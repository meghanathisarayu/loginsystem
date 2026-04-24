import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Download, Check } from 'lucide-react';
import { subscribeToPushNotifications } from '../utils/push';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Login = () => {
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const navigate = useNavigate();

    // Auto-redirect if already logged in (admin or user)
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        if (user && token) {
            if (user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/user');
            }
        }
    }, [navigate]);

    // PWA Install Prompt Handling
    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
        }

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        const handleAppInstalled = () => {
            setDeferredPrompt(null);
            setIsInstallable(false);
            setIsInstalled(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            setIsInstalled(true);
        }
        setDeferredPrompt(null);
        setIsInstallable(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/api/login`, {
                email,
                password
            });

            const { user, token } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            // AUTOMATIC PUSH SUBSCRIPTION FOR ADMINS
            if (user.role === 'admin' && 'serviceWorker' in navigator && 'PushManager' in window) {
                try {
                    if (Notification.permission === 'granted') {
                        await subscribeToPushNotifications();
                        console.log('Admin auto-subscribed to push notifications');
                    } else {
                        console.log('Notification permission not granted yet for push');
                    }
                } catch (err) {
                    console.log('Push auto-subscribe error:', err.message);
                }
            }

            if (user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/user');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="glass-card">
                <h1>Welcome Back</h1>
                <p>Enter your credentials to access your account</p>

                {error && (
                    <div className="error-msg">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="input-icon-left" />
                            <input
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-with-icon"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon-left" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-with-icon-both"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="password-toggle-btn"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <div className="forgot-password-container">
                            <Link to="/forgot-password" className="forgot-password-link">
                                Forgot Password?
                            </Link>
                        </div>
                    </div>

                    <button type="submit" className="btn" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                

                {/* PWA Install Section */}
                {!isInstalled && (
                    <div className="install-app-container">
                        {isInstallable ? (
                            <button
                                onClick={handleInstallClick}
                                className="btn-install-app"
                            >
                                <Download size={20} />
                                Install App
                            </button>
                        ) : (
                            <div className="manual-install-box">
                                <p className="manual-install-title">
                                    📱 Install this App
                                </p>
                                <p className="manual-install-text">
                                    Chrome: Click 3 dots → Install "My App"<br/>
                                    Safari: Share → Add to Home Screen
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {isInstalled && (
                    <div className="app-installed-box">
                        <Check size={20} />
                        App Installed
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;

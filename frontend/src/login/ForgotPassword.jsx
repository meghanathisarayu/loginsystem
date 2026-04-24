import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, Mail, Lock, CheckCircle2, ArrowLeft, Send } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API_BASE_URL}/api/forgot-password`, { email });
            setMessage(res.data.message);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await axios.post(`${API_BASE_URL}/api/verify-otp`, { email, otp });
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await axios.post(`${API_BASE_URL}/api/reset-password`, { email, otp, newPassword });
            alert('Password reset successfully!');
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="glass-card">
                <div className="auth-header-container">
                    <ShieldCheck size={28} />
                    <h2 className="auth-header-title">Account Recovery</h2>
                </div>

                {error && <div className="error-msg">{error}</div>}
                {message && !error && <div className="auth-success-msg">{message}</div>}

                {step === 1 && (
                    <form onSubmit={handleSendOTP}>
                        <p className="auth-subtitle">Enter your registered email to receive a 6-digit verification code.</p>
                        <div className="form-group">
                            <label>Email Address</label>
                            <div className="input-wrapper">
                                <Mail size={18} className="input-icon-left" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="input-with-icon"
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn" disabled={loading}>
                            {loading ? 'Sending...' : 'Send OTP'} <Send size={18} className="btn-icon-right" />
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyOTP}>
                        <p className="auth-subtitle">We've sent a code to <b>{email}</b>. Verification is required to proceed.</p>
                        <div className="form-group">
                            <label>Enter 6-Digit OTP</label>
                            <input
                                type="text"
                                maxLength="6"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="123456"
                                className="otp-input"
                                required
                            />
                        </div>
                        <button type="submit" className="btn" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                        <button type="button" onClick={() => setStep(1)} className="btn-link">
                            Change Email
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleResetPassword}>
                        <p className="auth-subtitle">Identity verified! You can now set your new login password.</p>
                        <div className="form-group">
                            <label>New Password</label>
                            <div className="input-wrapper">
                                <Lock size={18} className="input-icon-left" />
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="input-with-icon"
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn" disabled={loading}>
                            {loading ? 'Updating...' : 'Set New Password' } <CheckCircle2 size={18} className="btn-icon-right" />
                        </button>
                    </form>
                )}

                <Link to="/" className="back-to-login-link">
                   <ArrowLeft size={16} /> Back to Login
                </Link>
            </div>
        </div>
    );
};

export default ForgotPassword;

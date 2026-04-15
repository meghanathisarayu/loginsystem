import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ShieldCheck, Lock, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';

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
            const res = await axios.post('http://127.0.0.1:5000/api/forgot-password', { email });
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
            await axios.post('http://127.0.0.1:5000/api/verify-otp', { email, otp });
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
            await axios.post('http://127.0.0.1:5000/api/reset-password', { email, otp, newPassword });
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#818cf8' }}>
                    <ShieldCheck size={28} />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Account Recovery</h2>
                </div>

                {error && <div className="error-msg">{error}</div>}
                {message && !error && <div style={{ padding: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{message}</div>}

                {step === 1 && (
                    <form onSubmit={handleSendOTP}>
                        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>Enter your registered email to receive a 6-digit verification code.</p>
                        <div className="form-group">
                            <label>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    style={{ paddingLeft: '40px' }}
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn" disabled={loading}>
                            {loading ? 'Sending...' : 'Send OTP'} <Send size={18} style={{ marginLeft: '8px' }} />
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyOTP}>
                        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>We've sent a code to <b>{email}</b>. Verification is required to proceed.</p>
                        <div className="form-group">
                            <label>Enter 6-Digit OTP</label>
                            <input
                                type="text"
                                maxLength="6"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="123456"
                                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                                required
                            />
                        </div>
                        <button type="submit" className="btn" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                        <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', marginTop: '1rem', fontSize: '0.875rem' }}>
                            Change Email
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleResetPassword}>
                        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>Identity verified! You can now set your new login password.</p>
                        <div className="form-group">
                            <label>New Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    style={{ paddingLeft: '40px' }}
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn" disabled={loading}>
                            {loading ? 'Updating...' : 'Set New Password' } <CheckCircle2 size={18} style={{ marginLeft: '8px' }} />
                        </button>
                    </form>
                )}

                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', marginTop: '2rem', textDecoration: 'none', fontSize: '0.875rem' }}>
                   <ArrowLeft size={16} /> Back to Login
                </Link>
            </div>
        </div>
    );
};

export default ForgotPassword;

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, User, LogOut, FileText, Bell, CreditCard } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Unsubscribe from push notifications (users should never receive admin alerts)
async function unsubscribeFromPushNotifications() {
    try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            return;
        }
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            await fetch(`${API_BASE_URL}/api/push/unsubscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: subscription.endpoint })
            });
            await subscription.unsubscribe();
            console.log('User: Push unsubscribed successfully');
        }
    } catch (err) {
        console.error('User: Push unsubscribe error:', err);
    }
}

const UserDashboard = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    // Unsubscribe from push notifications on load (in case admin was logged in before)
    useEffect(() => {
        unsubscribeFromPushNotifications();
    }, []);

    const handleLogout = async () => {
        await unsubscribeFromPushNotifications();
        localStorage.clear();
        navigate('/');
    };

    return (
        <div className="dashboard">
            <nav className="nav">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <LayoutDashboard size={32} color="#4ade80" />
                    <div>
                        <h2 style={{ fontSize: '1.25rem' }}>User Dashboard</h2>
                        <span className="role-badge role-user">Standard User</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '600' }}>{user?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{user?.email}</div>
                    </div>
                    <button onClick={handleLogout} className="btn" style={{ marginTop: 0, padding: '0.5rem 1rem', width: 'auto', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
                        <LogOut size={18} />
                    </button>
                </div>
            </nav>

            <div className="grid">
                <div className="card">
                    <User size={24} color="#4ade80" style={{ marginBottom: '1rem' }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>My Profile</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Update your personal information and account security.</p>
                </div>
                <div className="card">
                    <FileText size={24} color="#4ade80" style={{ marginBottom: '1rem' }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>My Reports</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Access your personalized reports and activity history.</p>
                </div>
                <div className="card">
                    <Bell size={24} color="#4ade80" style={{ marginBottom: '1rem' }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>Notifications</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Check your latest updates and system messages.</p>
                </div>
                <div className="card">
                    <CreditCard size={24} color="#4ade80" style={{ marginBottom: '1rem' }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>Billing</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Manage your subscription and payment methods.</p>
                </div>
            </div>

            <div style={{ marginTop: '2rem', padding: '2rem', background: 'rgba(74, 222, 128, 0.05)', borderRadius: '20px', border: '1px solid rgba(74, 222, 128, 0.1)' }}>
                <h3>Welcome back, {user?.name.split(' ')[0]}!</h3>
                <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>You have 4 new messages and 2 pending tasks.</p>
            </div>
        </div>
    );
};

export default UserDashboard;

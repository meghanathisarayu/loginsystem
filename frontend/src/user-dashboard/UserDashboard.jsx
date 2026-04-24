import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, FileText, Bell, CreditCard } from 'lucide-react';
import UserHeader from './components/UserHeader';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

async function unsubscribeFromPushNotifications() {
    try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            await fetch(`${API_BASE_URL}/api/push/unsubscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: subscription.endpoint })
            });
            await subscription.unsubscribe();
        }
    } catch (err) {
        console.error('User: Push unsubscribe error:', err);
    }
}

const UserDashboard = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

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
            <UserHeader user={user} handleLogout={handleLogout} />

            <div className="grid">
                <div className="card">
                    <User size={24} color="#4ade80" className="card-icon" />
                    <h3 className="card-title">My Profile</h3>
                    <p className="card-subtitle">Update your personal information and account security.</p>
                </div>
                <div className="card">
                    <FileText size={24} color="#4ade80" className="card-icon" />
                    <h3 className="card-title">My Reports</h3>
                    <p className="card-subtitle">Access your personalized reports and activity history.</p>
                </div>
                <div className="card">
                    <Bell size={24} color="#4ade80" className="card-icon" />
                    <h3 className="card-title">Notifications</h3>
                    <p className="card-subtitle">Check your latest updates and system messages.</p>
                </div>
                <div className="card">
                    <CreditCard size={24} color="#4ade80" className="card-icon" />
                    <h3 className="card-title">Billing</h3>
                    <p className="card-subtitle">Manage your subscription and payment methods.</p>
                </div>
            </div>

            <div className="welcome-banner">
                <h3>Welcome back, {user?.name.split(' ')[0]}!</h3>
                <p className="welcome-subtitle">You have 4 new messages and 2 pending tasks.</p>
            </div>
        </div>
    );
};

export default UserDashboard;

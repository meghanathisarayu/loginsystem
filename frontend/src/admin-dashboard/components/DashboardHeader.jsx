import React from 'react';
import { ShieldCheck, LogOut, Bell, BellRing, BellOff, Volume2, VolumeX } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { unsubscribeFromPushNotifications } from '../../utils/push';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const NotificationToggle = ({ permission, onPermissionChange, onSubscribe }) => {
    const handleRequestPermission = async () => {
        if (!('Notification' in window)) {
            alert('This browser does not support notifications.');
            return;
        }

        try {
            const result = await Notification.requestPermission();
            onPermissionChange(result);
            
            if (result === 'granted') {
                new Notification('Notifications Enabled!', {
                    body: 'You will now receive real-time activity alerts.',
                    icon: '/favicon.svg'
                });
                if (onSubscribe) await onSubscribe();
            }
        } catch (err) {
            console.error('Notification permission error:', err);
        }
    };

    if (permission === 'granted') {
        return (
            <button 
                className="btn btn-header btn-success" 
                style={{ cursor: 'default' }}
            >
                <BellRing size={18} /> Alerts On
            </button>
        );
    }

    if (permission === 'denied') {
        return (
            <button 
                onClick={() => alert('Please enable notifications in your browser settings.')}
                className="btn btn-header btn-danger"
            >
                <BellOff size={18} /> Blocked
            </button>
        );
    }

    return (
        <button 
            onClick={handleRequestPermission}
            className="btn btn-header btn-indigo"
        >
            <Bell size={18} /> Enable Alerts
        </button>
    );
};

const SoundToggle = ({ enabled, onToggle }) => {
    const handleToggle = () => {
        const newValue = !enabled;
        localStorage.setItem('soundEnabled', newValue.toString());
        onToggle(newValue);
        if (newValue) {
            const audio = new Audio('/mixkit-software-interface-back-2575.wav');
            audio.volume = 0.3;
            audio.play().catch(() => {});
        }
    };

    return (
        <button 
            onClick={handleToggle}
            className={`btn btn-header ${enabled ? 'btn-success' : 'btn-muted'}`}
        >
            {enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            {enabled ? 'Sound On' : 'Sound Off'}
        </button>
    );
};

const DashboardHeader = ({ currentUser, navigate, notifPermission, setNotifPermission, soundEnabled, setSoundEnabled, onSubscribe }) => {
    const handleLogout = async () => {
        await unsubscribeFromPushNotifications();
        localStorage.clear();
        navigate('/');
    };

    const handleTestBG = async () => {
        if ("Notification" in window && Notification.permission === "granted") {
            toast.success("Push alert coming in 3s... switch tabs or close app now!");
            setTimeout(async () => {
                try {
                    await axios.post(`${API_BASE_URL}/api/push/test`);
                } catch (err) {
                    console.error('Push test failed:', err);
                    toast.error("Push test failed. Check console.");
                }
            }, 3000);
        } else {
            alert("Please enable notifications first.");
        }
    };

    return (
        <nav className="nav">
            <div className="header-title-container">
                <ShieldCheck size={32} color="#4f46e5" />
                <div>
                    <h2 className="header-title">Admin Control Center</h2>
                    <span className="role-badge role-admin">System Admin</span>
                </div>
            </div>
            <div className="header-actions">
                <div className="user-info">
                    <div className="user-name">{currentUser?.name}</div>
                    <div className="user-email">{currentUser?.email}</div>
                </div>
                <NotificationToggle 
                    permission={notifPermission}
                    onPermissionChange={setNotifPermission}
                    onSubscribe={onSubscribe}
                />
                <SoundToggle 
                    enabled={soundEnabled}
                    onToggle={setSoundEnabled}
                />
                <button 
                    onClick={handleTestBG}
                    className="btn btn-header btn-indigo"
                >
                    <BellRing size={16} /> Test BG
                </button>
                <button onClick={handleLogout} className="btn btn-header btn-danger">
                    <LogOut size={18} />
                </button>
            </div>
        </nav>
    );
};

export default DashboardHeader;

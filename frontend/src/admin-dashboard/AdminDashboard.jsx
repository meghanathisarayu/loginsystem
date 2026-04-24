import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Activity } from 'lucide-react';
import ActivityNotification from './components/ActivityNotification';
import { subscribeToPushNotifications } from '../utils/push';
import DashboardHeader from './components/DashboardHeader';
import StatusBanners from './components/StatusBanners';
import UserManagement from './user-management/UserManagement';
import ActivityLogs from './activity-logs/ActivityLogs';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const [activeTab, setActiveTab] = useState('users');
    const [notifPermission, setNotifPermission] = useState('default');
    const [showNotifModal, setShowNotifModal] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isPwa, setIsPwa] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);

    useEffect(() => {
        // Check notification permission
        if ('Notification' in window) {
            const perm = Notification.permission;
            setNotifPermission(perm);
            if (perm === 'default') setTimeout(() => setShowNotifModal(true), 1000);
            else if (perm === 'granted') subscribeToPushNotifications();
        }

        // Check sound preference
        const savedSound = localStorage.getItem('soundEnabled') === 'true';
        setSoundEnabled(savedSound);

        // Mobile/PWA checks
        const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        setIsMobile(mobileCheck);
        const pwaCheck = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        setIsPwa(pwaCheck);

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallPrompt(true);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    return (
        <div className="dashboard">
            <ActivityNotification />

            <DashboardHeader 
                currentUser={currentUser}
                navigate={navigate}
                notifPermission={notifPermission}
                setNotifPermission={setNotifPermission}
                soundEnabled={soundEnabled}
                setSoundEnabled={setSoundEnabled}
                onSubscribe={subscribeToPushNotifications}
            />

            <StatusBanners 
                isPwa={isPwa}
                isMobile={isMobile}
                showInstallPrompt={showInstallPrompt}
                deferredPrompt={deferredPrompt}
                setDeferredPrompt={setDeferredPrompt}
                setShowInstallPrompt={setShowInstallPrompt}
                showNotifModal={showNotifModal}
                setShowNotifModal={setShowNotifModal}
                notifPermission={notifPermission}
                setNotifPermission={setNotifPermission}
                onSubscribe={subscribeToPushNotifications}
            />

            {/* Tabs Navigation */}
            <div className="tabs-container">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`tab-btn ${activeTab === 'users' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
                >
                    <Users size={18} /> User Management
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`tab-btn ${activeTab === 'logs' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
                >
                    <Activity size={18} /> Activity Logs
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'users' ? (
                <UserManagement currentUser={currentUser} />
            ) : (
                <ActivityLogs />
            )}
        </div>
    );
};

export default AdminDashboard;

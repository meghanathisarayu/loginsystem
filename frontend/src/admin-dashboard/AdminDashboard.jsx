import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Activity, ShieldCheck, LayoutDashboard } from 'lucide-react';
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
        if ('Notification' in window) {
            const perm = Notification.permission;
            setNotifPermission(perm);
            if (perm === 'default') setTimeout(() => setShowNotifModal(true), 1000);
            else if (perm === 'granted') subscribeToPushNotifications();
        }

        const savedSound = localStorage.getItem('soundEnabled') === 'true';
        setSoundEnabled(savedSound);

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
        <div className="dashboard-wrapper">
            <ActivityNotification />

            {/* Left Sidebar Navigation */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <ShieldCheck size={32} color="#4f46e5" />
                    <span className="sidebar-brand-text">Admin Panel</span>
                </div>

                <nav className="sidebar-nav">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`sidebar-btn ${activeTab === 'users' ? 'sidebar-btn-active' : ''}`}
                    >
                        <Users size={20} /> 
                        <span>User Management</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`sidebar-btn ${activeTab === 'logs' ? 'sidebar-btn-active' : ''}`}
                    >
                        <Activity size={20} /> 
                        <span>Activity Logs</span>
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <button onClick={() => navigate('/user')} className="sidebar-btn">
                        <LayoutDashboard size={20} />
                        <span>User View</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="main-content">
                <DashboardHeader 
                    currentUser={currentUser}
                    navigate={navigate}
                    notifPermission={notifPermission}
                    setNotifPermission={setNotifPermission}
                    soundEnabled={soundEnabled}
                    setSoundEnabled={setSoundEnabled}
                    onSubscribe={subscribeToPushNotifications}
                />

                <div className="dashboard-content-area">
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

                    {/* Tab Content Area */}
                    <div className="tab-content">
                        {activeTab === 'users' ? (
                            <UserManagement currentUser={currentUser} />
                        ) : (
                            <ActivityLogs />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;

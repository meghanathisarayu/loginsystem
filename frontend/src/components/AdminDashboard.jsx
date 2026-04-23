import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    ShieldCheck, 
    Activity, 
    LogOut, 
    Users, 
    Plus, 
    Edit2, 
    Trash2, 
    User, 
    Clock, 
    X, 
    Eye, 
    EyeOff,
    Bell,
    BellRing,
    BellOff,
    Volume2,
    VolumeX,
    Smartphone,
    Home
} from 'lucide-react';
import ActivityNotification from './ActivityNotification';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Subscribe to Push Notifications (for background tabs)
async function subscribeToPushNotifications() {
    try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.log('Push notifications not supported');
            return;
        }

        const registration = await navigator.serviceWorker.ready;
        
        // Get VAPID public key from server
        const response = await fetch(`${API_BASE_URL}/api/push/vapid-public-key`);
        const { publicKey } = await response.json();
        
        if (!publicKey) {
            console.log('No VAPID key available');
            return;
        }

        // Subscribe
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey)
        });

        // Send subscription to server
        await fetch(`${API_BASE_URL}/api/push/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });

        console.log('Push subscription successful');
    } catch (err) {
        console.error('Push subscription error:', err);
    }
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Notification Toggle Component
const NotificationToggle = ({ permission, onPermissionChange }) => {
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
                
                // Also subscribe to push notifications for background tabs
                await subscribeToPushNotifications();
            }
        } catch (err) {
            console.error('Notification permission error:', err);
        }
    };

    if (permission === 'granted') {
        return (
            <button 
                className="btn" 
                style={{ 
                    marginTop: 0, 
                    padding: '0.5rem 1rem', 
                    width: 'auto', 
                    background: 'rgba(16, 185, 129, 0.15)', 
                    color: '#10b981', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    fontSize: '0.75rem',
                    cursor: 'default'
                }}
                title="Notifications are enabled"
            >
                <BellRing size={18} /> Alerts On
            </button>
        );
    }

    if (permission === 'denied') {
        return (
            <button 
                onClick={() => alert('Please enable notifications in your browser settings:\n1. Click the lock icon in the address bar\n2. Select "Site settings"\n3. Change Notifications to "Allow"')}
                className="btn" 
                style={{ 
                    marginTop: 0, 
                    padding: '0.5rem 1rem', 
                    width: 'auto', 
                    background: 'rgba(239, 68, 68, 0.15)', 
                    color: '#f87171', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    fontSize: '0.75rem'
                }}
                title="Notifications are blocked"
            >
                <BellOff size={18} /> Blocked
            </button>
        );
    }

    return (
        <button 
            onClick={handleRequestPermission}
            className="btn" 
            style={{ 
                marginTop: 0, 
                padding: '0.5rem 1rem', 
                width: 'auto', 
                background: 'rgba(99, 102, 241, 0.15)', 
                color: '#818cf8', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                fontSize: '0.75rem'
            }}
            title="Click to enable notifications"
        >
            <Bell size={18} /> Enable Alerts
        </button>
    );
};

// Sound Toggle Component
const SoundToggle = ({ enabled, onToggle }) => {
    const handleToggle = () => {
        const newValue = !enabled;
        localStorage.setItem('soundEnabled', newValue.toString());
        onToggle(newValue);
        
        // Preview sound when enabling
        if (newValue) {
            const audio = new Audio('/mixkit-software-interface-back-2575.wav');
            audio.volume = 0.3;
            audio.play().catch(() => {});
        }
    };

    return (
        <button 
            onClick={handleToggle}
            className="btn" 
            style={{ 
                marginTop: 0, 
                padding: '0.5rem 1rem', 
                width: 'auto', 
                background: enabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.1)', 
                color: enabled ? '#10b981' : '#94a3b8', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                fontSize: '0.75rem',
                transition: 'all 0.2s ease'
            }}
            title={enabled ? 'Sound alerts are ON' : 'Click to enable sound alerts'}
        >
            {enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            {enabled ? 'Sound On' : 'Sound Off'}
        </button>
    );
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' });
    const [showPassword, setShowPassword] = useState(false);
    const [activeTab, setActiveTab] = useState('users');
    const [activityLogs, setActivityLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [notifPermission, setNotifPermission] = useState('default');
    const [showNotifModal, setShowNotifModal] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isPwa, setIsPwa] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);

    useEffect(() => {
        fetchUsers();
        fetchActivityLogs();
        // Check notification permission status
        if ('Notification' in window) {
            const perm = Notification.permission;
            setNotifPermission(perm);
            // Show modal if permission not yet decided
            if (perm === 'default') {
                setTimeout(() => setShowNotifModal(true), 1000);
            }
        }
        // Check sound preference from localStorage
        const savedSound = localStorage.getItem('soundEnabled') === 'true';
        setSoundEnabled(savedSound);
        
        // Check if mobile and if already installed as PWA
        const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        setIsMobile(mobileCheck);
        
        // Check if running as installed PWA
        const pwaCheck = window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone === true;
        setIsPwa(pwaCheck);
        
        // Listen for PWA install prompt (Android Chrome)
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallPrompt(true);
        };
        
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const fetchActivityLogs = async () => {
        setLogsLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/activity-logs`);
            setActivityLogs(res.data);
        } catch (err) {
            console.error('Error fetching activity logs:', err);
        } finally {
            setLogsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'LOGIN': return '#10b981';
            case 'LOGOUT': return '#6b7280';
            case 'USER_CREATED': return '#3b82f6';
            case 'USER_UPDATED': return '#f59e0b';
            case 'USER_DELETED': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/users`);
            setUsers(res.data);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({ name: user.name, email: user.email, password: user.password, role: user.role });
            setShowPassword(true);
        } else {
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'user' });
            setShowPassword(false);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const performedBy = {
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email
            };
            if (editingUser) {
                await axios.put(`${API_BASE_URL}/api/users/${editingUser.id}`, {
                    ...formData,
                    performedBy
                });
            } else {
                await axios.post(`${API_BASE_URL}/api/users`, {
                    ...formData,
                    performedBy
                });
            }
            fetchUsers();
            fetchActivityLogs();
            handleCloseModal();
        } catch (err) {
            alert('Error saving user');
        }
    };

    const handleDelete = async (id) => {
        const userToDelete = users.find(u => u.id === id);
        
        if (userToDelete && userToDelete.role === 'admin') {
            const adminCount = users.filter(u => u.role === 'admin').length;
            if (adminCount <= 1) {
                alert('Primary Admin Warning: You cannot delete the last administrator.');
                return;
            }
        }

        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                const performedBy = {
                    id: currentUser.id,
                    name: currentUser.name,
                    email: currentUser.email
                };
                await axios.delete(`${API_BASE_URL}/api/users/${id}`, {
                    data: { performedBy }
                });
                fetchUsers();
                fetchActivityLogs();
            } catch (err) {
                alert(err.response?.data?.message || 'Error deleting user');
            }
        }
    };

    return (
        <div className="dashboard">
            <ActivityNotification />

            {/* PWA Install Banner */}
            {!isPwa && (
                <div style={{ 
                    background: 'rgba(99, 102, 241, 0.1)', 
                    border: '1px solid rgba(99, 102, 241, 0.3)', 
                    borderRadius: '12px', 
                    padding: '1rem 1.5rem', 
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Home size={20} color="#818cf8" />
                        <div>
                            <div style={{ fontWeight: '600', color: '#e2e8f0', fontSize: '0.9rem' }}>
                                Install App for Background Notifications
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                {isMobile 
                                    ? (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')
                                        ? 'Safari: Tap Share button → Add to Home Screen'
                                        : 'Tap "Install App" button below')
                                    : 'Click "Install App" to add to desktop'
                                }
                            </div>
                        </div>
                    </div>
                    {showInstallPrompt && deferredPrompt && (
                        <button
                            onClick={async () => {
                                deferredPrompt.prompt();
                                const { outcome } = await deferredPrompt.userChoice;
                                if (outcome === 'accepted') {
                                    console.log('PWA installed');
                                }
                                setDeferredPrompt(null);
                                setShowInstallPrompt(false);
                            }}
                            className="btn"
                            style={{ 
                                marginTop: 0, 
                                padding: '0.5rem 1rem', 
                                width: 'auto', 
                                background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            <Home size={16} /> Install App
                        </button>
                    )}
                </div>
            )}

            {/* Notification Permission Modal */}
            {showNotifModal && notifPermission === 'default' && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(5px)'
                }}>
                    <div style={{
                        background: '#1e293b',
                        borderRadius: '20px',
                        padding: '2.5rem',
                        maxWidth: '450px',
                        width: '90%',
                        textAlign: 'center',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'rgba(99, 102, 241, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem'
                        }}>
                            <Bell size={40} color="#818cf8" />
                        </div>
                        
                        <h2 style={{ 
                            fontSize: '1.5rem', 
                            fontWeight: '700', 
                            marginBottom: '0.75rem',
                            color: '#f1f5f9'
                        }}>
                            Enable Notifications
                        </h2>
                        
                        <p style={{ 
                            color: '#94a3b8', 
                            marginBottom: '2rem',
                            lineHeight: '1.6',
                            fontSize: '0.95rem'
                        }}>
                            Get instant desktop alerts when users login, create accounts, 
                            or make changes to the system. Stay informed in real-time!
                        </p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button
                                onClick={async () => {
                                    try {
                                        const result = await Notification.requestPermission();
                                        setNotifPermission(result);
                                        setShowNotifModal(false);
                                        if (result === 'granted') {
                                            new Notification('Notifications Enabled!', {
                                                body: 'You will now receive real-time activity alerts.',
                                                icon: '/favicon.svg'
                                            });
                                            
                                            // Also subscribe to push notifications for background tabs
                                            await subscribeToPushNotifications();
                                        }
                                    } catch (err) {
                                        console.error('Notification permission error:', err);
                                    }
                                }}
                                style={{
                                    padding: '1rem 2rem',
                                    background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <BellRing size={20} />
                                Allow Notifications
                            </button>
                            
                            <button
                                onClick={() => setShowNotifModal(false)}
                                style={{
                                    padding: '1rem 2rem',
                                    background: 'transparent',
                                    color: '#94a3b8',
                                    border: '1px solid rgba(148, 163, 184, 0.3)',
                                    borderRadius: '12px',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Notification Permission Banner */}
            {notifPermission !== 'granted' && (
                <div style={{ 
                    background: 'rgba(245, 158, 11, 0.1)', 
                    border: '1px solid rgba(245, 158, 11, 0.3)', 
                    borderRadius: '12px', 
                    padding: '1rem 1.5rem', 
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BellRing size={20} color="#f59e0b" />
                        <div>
                            <div style={{ fontWeight: '600', color: '#fef3c7', fontSize: '0.9rem' }}>
                                Critical: Background Notifications Disabled
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                You won't receive alerts if you switch to another tab. Please enable notifications for full admin monitoring.
                            </div>
                        </div>
                    </div>
                    <NotificationToggle 
                        permission={notifPermission}
                        onPermissionChange={setNotifPermission}
                    />
                </div>
            )}

            <nav className="nav">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ShieldCheck size={32} color="#818cf8" />
                    <div>
                        <h2 style={{ fontSize: '1.25rem' }}>Admin Control Center</h2>
                        <span className="role-badge role-admin">System Admin</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '600' }}>{currentUser?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{currentUser?.email}</div>
                    </div>
                    <NotificationToggle 
                        permission={notifPermission}
                        onPermissionChange={setNotifPermission}
                    />
                    <SoundToggle 
                        enabled={soundEnabled}
                        onToggle={setSoundEnabled}
                    />
                    <button 
                        onClick={() => {
                            if ("Notification" in window && Notification.permission === "granted") {
                                // Simulate a notification after 3 seconds so user can switch tabs
                                toast.success("Test alert coming in 3s... switch tabs now!");
                                setTimeout(() => {
                                    new Notification("Test Admin Alert", {
                                        body: "This is a test notification to verify background alerts.",
                                        icon: "/favicon.svg",
                                        requireInteraction: true
                                    });
                                }, 3000);
                            } else {
                                alert("Please enable notifications first using the button on the left.");
                            }
                        }}
                        className="btn"
                        style={{ 
                            marginTop: 0, 
                            padding: '0.5rem 1rem', 
                            width: 'auto', 
                            background: 'rgba(99, 102, 241, 0.1)', 
                            color: '#818cf8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.75rem'
                        }}
                        title="Test if notifications work in background"
                    >
                        <BellRing size={16} /> Test BG
                    </button>
                    <button onClick={handleLogout} className="btn" style={{ marginTop: 0, padding: '0.5rem 1rem', width: 'auto', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
                        <LogOut size={18} />
                    </button>
                </div>
            </nav>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                <button
                    onClick={() => setActiveTab('users')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: activeTab === 'users' ? 'rgba(129, 140, 248, 0.2)' : 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        color: activeTab === 'users' ? '#818cf8' : '#94a3b8',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Users size={18} />
                    User Management
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: activeTab === 'logs' ? 'rgba(129, 140, 248, 0.2)' : 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        color: activeTab === 'logs' ? '#818cf8' : '#94a3b8',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Activity size={18} />
                    Activity Logs
                </button>
            </div>

            {activeTab === 'users' ? (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '600' }}>User Management</h3>
                        <button onClick={() => handleOpenModal()} className="btn" style={{ marginTop: 0, width: 'auto', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Plus size={18} /> Add New User
                        </button>
                    </div>

                    <div className="table-container">
                        {loading ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading users...</div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Actions</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => handleOpenModal(u)} className="action-btn">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(u.id)} className="action-btn btn-delete">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(129, 140, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <User size={16} color="#818cf8" />
                                                    </div>
                                                    {u.name}
                                                </div>
                                            </td>
                                            <td>{u.email}</td>
                                            <td>
                                                <span className={`role-badge ${u.role === 'admin' ? 'role-admin' : 'role-user'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Activity Logs</h3>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button 
                                onClick={async () => {
                                    if (window.confirm('Are you sure you want to clear ALL activity logs? This cannot be undone.')) {
                                        try {
                                            await axios.delete(`${API_BASE_URL}/api/activity-logs`);
                                            fetchActivityLogs();
                                        } catch (err) {
                                            alert('Error clearing logs');
                                        }
                                    }
                                }} 
                                className="btn" 
                                style={{ marginTop: 0, width: 'auto', padding: '0.75rem 1.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Trash2 size={18} /> Clear All
                            </button>
                            <button onClick={fetchActivityLogs} className="btn" style={{ marginTop: 0, width: 'auto', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Clock size={18} /> Refresh
                            </button>
                        </div>
                    </div>

                    <div className="table-container">
                        {logsLoading ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading logs...</div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>User</th>
                                        <th>Action</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activityLogs.map(log => (
                                        <tr key={log.id}>
                                            <td style={{ fontSize: '0.875rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                                {formatDate(log.createdAt)}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: '500' }}>{log.userName}</span>
                                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{log.userEmail}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '9999px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    textTransform: 'uppercase',
                                                    background: `${getActionColor(log.action)}20`,
                                                    color: getActionColor(log.action)
                                                }}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                                                {log.details}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 style={{ fontSize: '1.25rem' }}>{editingUser ? 'Edit User' : 'Add New User'}</h3>
                            <button onClick={handleCloseModal} className="action-btn">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        style={{ paddingRight: '2.5rem' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '0.75rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            color: '#94a3b8'
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <select
                                    className="select-input"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <button type="submit" className="btn">
                                {editingUser ? 'Update User' : 'Create User'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;

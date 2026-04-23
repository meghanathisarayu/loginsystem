import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Notification sound
const NOTIFICATION_SOUND_URL = '/mixkit-software-interface-back-2575.wav';

const playNotificationSound = () => {
    try {
        const audio = new Audio(NOTIFICATION_SOUND_URL);
        audio.volume = 0.5;
        audio.play().catch(err => {
            console.log('Audio file play failed, possibly background restriction:', err);
        });
    } catch (err) {
        console.error('Audio play error:', err);
    }
};

const ActivityNotification = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const originalTitle = useRef(document.title);
    const intervalRef = useRef(null);

    useEffect(() => {
        // Only initialize for admins
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.role !== 'admin') {
            return;
        }

        // Use websocket transport for better background reliability
        const socket = io(SOCKET_URL, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            timeout: 10000
        });

        socket.on('connect', () => {
            console.log('Socket connected for admin notifications');
            const token = localStorage.getItem('token');
            if (token) {
                socket.emit('join-admin-room', token);
            }
        });

        socket.on('new-activity', (data) => {
            console.log('Activity Received:', data);
            
            // 1. SOUND
            const soundEnabled = localStorage.getItem('soundEnabled') === 'true';
            if (soundEnabled) {
                playNotificationSound();
            }

            // 2. SYSTEM DESKTOP NOTIFICATION
            // This is the most important part for background tabs
            if ("Notification" in window && Notification.permission === "granted") {
                try {
                    const notification = new Notification(`Admin Alert: ${data.action}`, {
                        body: `${data.userName}: ${data.details || 'New activity logged'}`,
                        icon: '/favicon.svg',
                        tag: 'admin-activity', // Use a constant tag to group notifications
                        renotify: true,
                        requireInteraction: true // Keeps it on screen until user interacts
                    });

                    notification.onclick = () => {
                        window.focus();
                        notification.close();
                    };
                } catch (err) {
                    console.error("System Notification Error:", err);
                }
            }

            // 3. TAB TITLE FLASHING (If tab is hidden)
            if (document.visibilityState === 'hidden') {
                setUnreadCount(prev => prev + 1);
                startTitleFlash(data.action);
            }

            // 4. IN-APP TOAST (Only useful if they are looking at the page)
            toast.custom((t) => (
                <div 
                    onClick={() => toast.dismiss(t.id)}
                    style={{
                        backgroundColor: '#ffffff',
                        padding: '12px 24px',
                        borderRadius: '16px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        animation: 'slideIn 0.3s ease-out'
                    }}
                >
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                    }}>
                        🔔
                    </div>
                    <div>
                        <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: 'bold', display: 'block', textTransform: 'uppercase' }}>{data.action}</span>
                        <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{data.userName}</span>
                    </div>
                </div>
            ), { position: 'top-right', duration: 5000 });
        });

        // Clear title flashing when user returns to tab
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                stopTitleFlash();
                setUnreadCount(0);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            socket.disconnect();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            stopTitleFlash();
        };
    }, []);

    const startTitleFlash = (action) => {
        if (intervalRef.current) return;
        
        let isAlt = false;
        intervalRef.current = setInterval(() => {
            document.title = isAlt ? `🔴 (New Alert) ${originalTitle.current}` : `🔔 ${action}! - Admin`;
            isAlt = !isAlt;
        }, 1000);
    };

    const stopTitleFlash = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        document.title = originalTitle.current;
    };

    return null;
};

export default ActivityNotification;

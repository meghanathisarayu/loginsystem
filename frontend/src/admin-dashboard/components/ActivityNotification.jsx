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

            // 2. SYSTEM DESKTOP NOTIFICATION (Removed to prevent double notifications)
            // Desktop notifications are now handled exclusively by the Service Worker (Web Push)
            // so we don't need to manually trigger them here.


            // 3. TAB TITLE FLASHING (If tab is hidden)
            if (document.visibilityState === 'hidden') {
                setUnreadCount(prev => prev + 1);
                startTitleFlash(data.action);
            }

            // 4. IN-APP TOAST (Only useful if they are looking at the page)
            toast.custom((t) => (
                <div 
                    onClick={() => toast.dismiss(t.id)}
                    className="custom-toast-container"
                >
                    <div className="custom-toast-icon">
                        🔔
                    </div>
                    <div>
                        <span className="custom-toast-action">{data.action}</span>
                        <span className="custom-toast-user">{data.userName}</span>
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

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const SOCKET_URL = 'http://localhost:5000';

const ActivityNotification = () => {
    useEffect(() => {
        // Use websocket transport for better background reliability
        const socket = io(SOCKET_URL, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: Infinity
        });

        socket.on('new-activity', (data) => {
            console.log('Background Signal Received:', data);

            // DESKTOP NOTIFICATION (System Tray)
            if ("Notification" in window && Notification.permission === "granted") {
                try {
                    // requireInteraction: true ensures the notification stays until the user clears it
                    new Notification(`Alert: ${data.action}`, {
                        body: `${data.userName}: ${data.details || 'New activity logged'}`,
                        icon: '/favicon.svg',
                        tag: Date.now().toString(),
                        renotify: true,
                        requireInteraction: true 
                    });
                } catch (err) {
                    console.error("BG Notification Error:", err);
                }
            }

            // IN-APP POPUP (Dashboard Capsule)
            toast.custom((t) => (
                <div style={{
                    backgroundColor: '#ffffff',
                    padding: '8px 22px',
                    borderRadius: '50px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    pointerEvents: 'auto'
                }}>
                    <span style={{ fontSize: '18px' }}>🔔</span>
                    <div>
                        <span style={{ fontSize: '10px', color: '#6366f1', fontWeight: 'bold', display: 'block' }}>{data.action}</span>
                        <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '600' }}>{data.userName}</span>
                    </div>
                </div>
            ), { position: 'bottom-right' });
        });

        return () => socket.disconnect();
    }, []);

    return null;
};

export default ActivityNotification;

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Play notification sound - CUSTOMIZE THIS URL WITH YOUR OWN SOUND
// Default: Online notification sound (replace with your own .mp3 or .wav URL)
const NOTIFICATION_SOUND_URL = '/notification.mp3';

const playNotificationSound = () => {
    try {
        const audio = new Audio(NOTIFICATION_SOUND_URL);
        audio.volume = 0.5; // 50% volume (change as needed: 0.0 to 1.0)
        audio.play().catch(err => {
            // Fallback to Web Audio API if file fails
            console.log('Audio file failed, using fallback tone');
            playFallbackTone();
        });
    } catch (err) {
        console.error('Audio play error:', err);
        playFallbackTone();
    }
};

// Fallback tone if audio file fails
const playFallbackTone = () => {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (err) {
        console.error('Fallback tone error:', err);
    }
};

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
            
            // PLAY NOTIFICATION SOUND
            playNotificationSound();

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

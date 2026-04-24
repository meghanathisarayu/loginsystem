import React from 'react';
import { Bell, BellRing, Home } from 'lucide-react';

const StatusBanners = ({ 
    isPwa, 
    isMobile, 
    showInstallPrompt, 
    deferredPrompt, 
    setDeferredPrompt, 
    setShowInstallPrompt,
    showNotifModal,
    setShowNotifModal,
    notifPermission,
    setNotifPermission,
    onSubscribe
}) => {
    return (
        <>
            {/* PWA Install Banner */}
            {!isPwa && (
                <div className="banner-base banner-info">
                    <div className="banner-content">
                        <Home size={20} color="#818cf8" />
                        <div>
                            <div className="banner-title">Install App for Background Notifications</div>
                            <div className="banner-subtitle">
                                {isMobile ? 'Tap "Install App" button below' : 'Click "Install App" to add to desktop'}
                            </div>
                        </div>
                    </div>
                    {showInstallPrompt && deferredPrompt && (
                        <button
                            onClick={async () => {
                                deferredPrompt.prompt();
                                const { outcome } = await deferredPrompt.userChoice;
                                if (outcome === 'accepted') console.log('PWA installed');
                                setDeferredPrompt(null);
                                setShowInstallPrompt(false);
                            }}
                            className="btn-install"
                        >
                            <Home size={16} /> Install App
                        </button>
                    )}
                </div>
            )}

            {/* Notification Permission Modal */}
            {showNotifModal && notifPermission === 'default' && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ textAlign: 'center', background: '#1e293b' }}>
                        <div className="modal-icon-container">
                            <Bell size={40} color="#818cf8" />
                        </div>
                        <h2 className="modal-title">Enable Notifications</h2>
                        <p className="modal-text">
                            Get instant desktop alerts when users login or make changes. Stay informed in real-time!
                        </p>
                        <div className="modal-actions">
                            <button
                                onClick={async () => {
                                    try {
                                        const result = await Notification.requestPermission();
                                        setNotifPermission(result);
                                        setShowNotifModal(false);
                                        if (result === 'granted') {
                                            new Notification('Notifications Enabled!', { body: 'You will now receive alerts.' });
                                            if (onSubscribe) await onSubscribe();
                                        }
                                    } catch (err) { console.error(err); }
                                }}
                                className="btn-allow"
                            >
                                <BellRing size={20} /> Allow Notifications
                            </button>
                            <button onClick={() => setShowNotifModal(false)} className="btn-later">Maybe Later</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Warning Banner */}
            {notifPermission !== 'granted' && (
                <div className="banner-base banner-warning">
                    <div className="banner-content">
                        <BellRing size={20} color="#f59e0b" />
                        <div>
                            <div className="banner-title">Background Notifications Disabled</div>
                            <div className="banner-subtitle">Please enable notifications for full admin monitoring.</div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default StatusBanners;

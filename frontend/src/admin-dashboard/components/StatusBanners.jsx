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
                <div style={{ 
                    background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', 
                    borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '1.5rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Home size={20} color="#818cf8" />
                        <div>
                            <div style={{ fontWeight: '600', color: '#e2e8f0', fontSize: '0.9rem' }}>Install App for Background Notifications</div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
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
                            className="btn"
                            style={{ 
                                marginTop: 0, padding: '0.5rem 1rem', width: 'auto', 
                                background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                                color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                fontSize: '0.8rem', fontWeight: '600', border: 'none', borderRadius: '8px'
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
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)'
                }}>
                    <div style={{
                        background: '#1e293b', borderRadius: '20px', padding: '2.5rem',
                        maxWidth: '450px', width: '90%', textAlign: 'center',
                        border: '1px solid rgba(99, 102, 241, 0.3)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: 'rgba(99, 102, 241, 0.15)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem'
                        }}>
                            <Bell size={40} color="#818cf8" />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem', color: '#f1f5f9' }}>Enable Notifications</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '2rem', lineHeight: '1.6', fontSize: '0.95rem' }}>
                            Get instant desktop alerts when users login or make changes. Stay informed in real-time!
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                                style={{
                                    padding: '1rem 2rem', background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                                    color: 'white', border: 'none', borderRadius: '12px', fontSize: '1rem',
                                    fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: '0.5rem'
                                }}
                            >
                                <BellRing size={20} /> Allow Notifications
                            </button>
                            <button onClick={() => setShowNotifModal(false)} style={{ padding: '1rem 2rem', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer' }}>Maybe Later</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Warning Banner */}
            {notifPermission !== 'granted' && (
                <div style={{ 
                    background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', 
                    borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '1.5rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BellRing size={20} color="#f59e0b" />
                        <div>
                            <div style={{ fontWeight: '600', color: '#fef3c7', fontSize: '0.9rem' }}>Background Notifications Disabled</div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>Please enable notifications for full admin monitoring.</div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default StatusBanners;

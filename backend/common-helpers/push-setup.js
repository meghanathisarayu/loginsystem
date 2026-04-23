const webpush = require('web-push');
const { PushSubscription } = require('./database-schemas');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:admin@loginsystem.com',
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    );
}

const sendPushNotification = async (title, body, icon = '/favicon.svg') => {
    try {
        const subscriptions = await PushSubscription.find({ role: 'admin' });
        if (subscriptions.length === 0) return;

        const payload = JSON.stringify({
            title: title || 'Admin Alert',
            body: body || 'New activity detected',
            icon: icon,
            badge: '/icons/icon-192x192.png',
            tag: 'activity-' + Date.now(),
            requireInteraction: true
        });

        await Promise.allSettled(
            subscriptions.map(sub => 
                webpush.sendNotification({
                    endpoint: sub.endpoint,
                    expirationTime: sub.expirationTime,
                    keys: sub.keys
                }, payload).catch(async (err) => {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await PushSubscription.deleteOne({ endpoint: sub.endpoint });
                    }
                })
            )
        );
    } catch (err) {
        console.error('Push error:', err.message);
    }
};

module.exports = { sendPushNotification, VAPID_PUBLIC_KEY };

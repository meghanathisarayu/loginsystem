const CACHE_NAME = 'login-system-v1';

// Install event - cache static assets
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Push event - Handle push notifications from server
self.addEventListener('push', (event) => {
    console.log('[SW] Push received:', event);
    
    let data = {};
    try {
        data = event.data.json();
    } catch (e) {
        data = {
            title: 'New Activity',
            body: 'Something happened in your admin dashboard',
            icon: '/favicon.svg',
            badge: '/icons/icon-192x192.png',
            tag: 'activity',
            requireInteraction: true
        };
    }

    const options = {
        body: data.body || 'New activity detected',
        icon: data.icon || '/favicon.svg',
        badge: data.badge || '/icons/icon-192x192.png',
        tag: data.tag || 'activity-' + Date.now(),
        requireInteraction: data.requireInteraction !== false,
        renotify: true,
        vibrate: [200, 100, 200],
        data: data.data || {}
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Admin Alert', options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event);
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If app is already open, focus it
            for (const client of clientList) {
                if (client.url.includes('/admin') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow('/admin');
            }
        })
    );
});

// Fetch event - network first strategy
self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request).catch(() => {
        return caches.match(event.request);
    }));
});

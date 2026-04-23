
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

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

// Subscribe to Push Notifications
export async function subscribeToPushNotifications() {
    try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.log('Push notifications not supported');
            return false;
        }

        const registration = await navigator.serviceWorker.ready;
        
        // Get VAPID public key from server
        const response = await fetch(`${API_BASE_URL}/api/push/vapid-public-key`);
        const { publicKey } = await response.json();
        
        if (!publicKey) {
            console.log('No VAPID key available');
            return false;
        }

        // Subscribe
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey)
        });

        // Send subscription to server with JWT token
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE_URL}/api/push/subscribe`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(subscription)
        });

        console.log('Push subscription successful');
        return true;
    } catch (err) {
        console.error('Push subscription error:', err);
        return false;
    }
}

// Unsubscribe from Push Notifications
export async function unsubscribeFromPushNotifications() {
    try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            return false;
        }
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            // Remove from backend
            await fetch(`${API_BASE_URL}/api/push/unsubscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: subscription.endpoint })
            });
            // Remove from browser
            await subscription.unsubscribe();
            console.log('Push unsubscribed successfully');
            return true;
        }
        return false;
    } catch (err) {
        console.error('Push unsubscribe error:', err);
        return false;
    }
}

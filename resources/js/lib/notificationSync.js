const NOTIFICATION_SYNC_EVENT = 'calming:notifications-changed';
const NOTIFICATION_SYNC_CHANNEL = 'calming-notifications';

function getChannel() {
    if (typeof window === 'undefined' || typeof window.BroadcastChannel === 'undefined') {
        return null;
    }

    if (!window.__calmingNotificationSyncChannel) {
        window.__calmingNotificationSyncChannel = new window.BroadcastChannel(NOTIFICATION_SYNC_CHANNEL);
    }

    return window.__calmingNotificationSyncChannel;
}

export function emitNotificationSync(detail = {}) {
    if (typeof window === 'undefined') {
        return;
    }

    window.dispatchEvent(new CustomEvent(NOTIFICATION_SYNC_EVENT, { detail }));
    getChannel()?.postMessage(detail);
}

export function subscribeNotificationSync(handler) {
    if (typeof window === 'undefined') {
        return () => {};
    }

    const handleWindowEvent = (event) => handler(event.detail ?? {});
    const handleStorage = (event) => {
        if (event.key === 'calming-guest-state-v1') {
            handler({ source: 'guest-storage' });
        }
    };

    window.addEventListener(NOTIFICATION_SYNC_EVENT, handleWindowEvent);
    window.addEventListener('storage', handleStorage);

    const channel = getChannel();
    const handleMessage = (event) => handler(event.data ?? {});
    channel?.addEventListener('message', handleMessage);

    return () => {
        window.removeEventListener(NOTIFICATION_SYNC_EVENT, handleWindowEvent);
        window.removeEventListener('storage', handleStorage);
        channel?.removeEventListener('message', handleMessage);
    };
}

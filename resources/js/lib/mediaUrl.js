export function normalizeMediaUrl(value) {
    if (!value) {
        return value;
    }

    if (typeof window === 'undefined') {
        return value;
    }

    try {
        const resolved = new URL(value, window.location.origin);

        if (resolved.pathname.startsWith('/storage/')) {
            return `${window.location.origin}${resolved.pathname}`;
        }

        return resolved.toString();
    } catch {
        return value;
    }
}

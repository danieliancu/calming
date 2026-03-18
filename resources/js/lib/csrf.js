function readCookie(name) {
    if (typeof document === 'undefined') {
        return '';
    }

    const encodedName = `${name}=`;
    const cookie = document.cookie
        .split('; ')
        .find((entry) => entry.startsWith(encodedName));

    if (!cookie) {
        return '';
    }

    return decodeURIComponent(cookie.slice(encodedName.length));
}

export function getCsrfToken() {
    return readCookie('XSRF-TOKEN') || document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

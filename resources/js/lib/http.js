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

function csrfToken() {
    return readCookie('XSRF-TOKEN') || document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

export async function apiFetch(url, options = {}) {
    const headers = new Headers(options.headers ?? {});

    if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
    }

    if (!headers.has('X-Requested-With')) {
        headers.set('X-Requested-With', 'XMLHttpRequest');
    }

    const token = csrfToken();
    if (token && !headers.has('X-XSRF-TOKEN')) {
        headers.set('X-XSRF-TOKEN', token);
    }

    const response = await fetch(url, {
        credentials: 'same-origin',
        ...options,
        headers,
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await response.json().catch(() => null) : await response.text().catch(() => '');

    if (!response.ok) {
        const message = typeof payload === 'object' && payload?.message
            ? payload.message
            : typeof payload === 'object' && payload?.error
                ? payload.error
                : response.status === 419
                    ? 'Sesiunea a expirat. Reincarca pagina si incearca din nou.'
                    : response.status === 401
                        ? 'Autentificare necesara.'
                        : 'Cererea a esuat.';

        const error = new Error(message);
        error.status = response.status;
        error.payload = payload;
        throw error;
    }

    return payload;
}

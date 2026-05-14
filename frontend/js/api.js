import { CONFIG } from '/js/config.js';

const DEFAULT_TIMEOUT_MS = 10000;

export class AuthError extends Error {
    constructor(message, status = 401) {
        super(message);
        this.name = 'AuthError';
        this.status = status;
    }
}

export async function fetchAPI(endpoint, options = {}) {
    const url = `${CONFIG.BASE_URL}${endpoint}`;
    const { timeout = DEFAULT_TIMEOUT_MS, signal, ...fetchOptions } = options;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeout);

    if (signal) {
        signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const config = {
        ...fetchOptions,
        headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
        },
        credentials: 'include',
        signal: controller.signal,
    };

    try {
        const response = await fetch(url, config);

        if (response.status === 401) {
            if (endpoint.includes(CONFIG.API_ENDPOINTS.LOGIN)) {
                const errorData = await response.json().catch(() => ({}));
                throw new AuthError(errorData.detail || 'Login failed.');
            }

            if (
                endpoint.includes(CONFIG.API_ENDPOINTS.USERS_ME) ||
                endpoint.includes(CONFIG.API_ENDPOINTS.LOGOUT) ||
                endpoint.includes(CONFIG.API_ENDPOINTS.MENUS)
            ) {
                return null;
            }

            throw new AuthError('SessionExpired');
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data?.detail || `Server error: ${response.status}`);
        }

        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error(`[API timeout - ${endpoint}]`);
            throw new Error('Request timed out.');
        }

        console.error(`[API error - ${endpoint}]:`, error.message);
        throw error;
    } finally {
        window.clearTimeout(timeoutId);
    }
}

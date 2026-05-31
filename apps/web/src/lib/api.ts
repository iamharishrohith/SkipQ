// ========================================
// SkipQ v2 — API Client Helper
// ========================================
// Auto-detects API URL: uses same hostname as the page (for LAN access)
// but on port 3001.

function getApiUrl(): string {
    // Server-side rendering — use env var or default
    if (typeof window === 'undefined') {
        return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    }

    // Client-side — derive from current page URL so it works on any LAN IP
    const { hostname } = window.location;
    return `http://${hostname}:3001`;
}

interface FetchOptions extends RequestInit {
    params?: Record<string, string>;
}

/**
 * Type-safe API client for making requests to the Elysia backend.
 */
export async function api<T = unknown>(
    path: string,
    options: FetchOptions = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
    const { params, ...fetchOptions } = options;

    let url = `${getApiUrl()}${path}`;
    if (params) {
        const searchParams = new URLSearchParams(params);
        url += `?${searchParams.toString()}`;
    }

    try {
        const res = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...fetchOptions.headers,
            },
            credentials: 'include',
            ...fetchOptions,
        });

        const json = await res.json();
        return json;
    } catch (err: any) {
        return { success: false, error: err.message || 'Network error' };
    }
}

/**
 * Shorthand helpers
 */
export const apiGet = <T>(path: string) => api<T>(path, { method: 'GET' });

export const apiPost = <T>(path: string, body: unknown) =>
    api<T>(path, {
        method: 'POST',
        body: JSON.stringify(body),
    });

export const apiPut = <T>(path: string, body: unknown) =>
    api<T>(path, {
        method: 'PUT',
        body: JSON.stringify(body),
    });

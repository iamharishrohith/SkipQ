// ========================================
// SkipQ v2 — Auth Client (Frontend)
// ========================================
// Simple auth client that calls our local auth API.

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function authFetch<T>(path: string, body?: unknown): Promise<{ data?: T; error?: { message: string } }> {
    try {
        const res = await fetch(`${API_URL}${path}`, {
            method: body ? 'POST' : 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: body ? JSON.stringify(body) : undefined,
        });
        const json = await res.json();
        if (!res.ok || json.error) {
            return { error: { message: json.error?.message || json.error || 'Request failed' } };
        }
        return { data: json };
    } catch (err: any) {
        return { error: { message: err.message || 'Network error' } };
    }
}

export const signIn = {
    email: (opts: { email: string; password: string }) =>
        authFetch('/api/auth/sign-in/email', opts),
};

export const signUp = {
    email: (opts: { name: string; email: string; password: string }) =>
        authFetch('/api/auth/sign-up/email', opts),
};

export const signOut = () => authFetch('/api/auth/sign-out');

export const getSession = () => authFetch('/api/auth/get-session');

export function useSession() {
    // Minimal hook — pages that need it can call getSession() directly.
    // This stub prevents import errors from existing code.
    return { data: null, isPending: false };
}

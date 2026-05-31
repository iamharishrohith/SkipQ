// ========================================
// SkipQ v2 — Local Auth (JSON Store)
// ========================================
// Lightweight auth replacing Better Auth.
// Handles signup, login, logout, and session via cookies.

import * as store from '../db/store';
import { randomUUID } from 'crypto';

const SESSION_COOKIE = 'skipq_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Hash a password with Bun's built-in bcrypt.
 */
async function hashPassword(password: string): Promise<string> {
    return Bun.password.hash(password, { algorithm: 'bcrypt', cost: 10 });
}

/**
 * Verify a password against a hash.
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return Bun.password.verify(password, hash);
}

/**
 * Create a session for a user and return the session token.
 */
function createSession(userId: string): string {
    const token = randomUUID();
    store.insert('session', {
        id: token,
        userId,
        token,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    });
    return token;
}

/**
 * Get session data from a token.
 */
export function getSession(token: string): any | null {
    if (!token) return null;
    const session = store.findOne('session', { token });
    if (!session) return null;

    // Check expiry
    if (new Date(session.expiresAt) < new Date()) {
        store.remove('session', { token });
        return null;
    }

    const user = store.findById('user', session.userId);
    if (!user) return null;

    return { session, user };
}

/**
 * Sign up a new user.
 */
export async function signUp(name: string, email: string, password: string) {
    // Check if email already exists
    const existing = store.findOne('user', { email });
    if (existing) {
        throw new Error('Email already registered');
    }

    if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
    }

    const passwordHash = await hashPassword(password);
    const user = store.insert('user', {
        name,
        email,
        emailVerified: false,
        image: null,
        role: 'customer',
        phone: null,
        passwordHash,
    });

    const token = createSession(user.id);
    return { user, token };
}

/**
 * Sign in an existing user.
 */
export async function signIn(email: string, password: string) {
    const user = store.findOne('user', { email });
    if (!user) {
        throw new Error('Invalid email or password');
    }

    if (!user.passwordHash) {
        throw new Error('Invalid email or password');
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
        throw new Error('Invalid email or password');
    }

    const token = createSession(user.id);
    return { user, token };
}

/**
 * Sign out — delete the session.
 */
export function signOut(token: string): void {
    store.remove('session', { token });
}

export { SESSION_COOKIE };

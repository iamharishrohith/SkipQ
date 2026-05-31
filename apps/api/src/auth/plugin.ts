// ========================================
// SkipQ v2 — Auth Plugin (Local Auth)
// ========================================
// Mounts auth routes and provides session resolution macro.

import { Elysia, t } from 'elysia';
import { signUp, signIn, signOut, getSession, SESSION_COOKIE } from './auth';

export const authPlugin = new Elysia({ name: 'auth' })

    // --- Session resolver macro ---
    .derive(({ cookie, headers }) => {
        // Try to get session from cookie or Authorization header
        const cookieToken = cookie?.[SESSION_COOKIE]?.value;
        const headerToken = headers?.authorization?.replace('Bearer ', '');
        const token = cookieToken || headerToken || '';

        const sessionData = getSession(token);
        return {
            user: sessionData?.user || null,
            session: sessionData?.session || null,
        };
    })

    // --- Auth Routes ---

    // Sign Up
    .post('/api/auth/sign-up/email', async ({ body, cookie, set }) => {
        try {
            const { user, token } = await signUp(body.name, body.email, body.password);

            cookie[SESSION_COOKIE].set({
                value: token,
                httpOnly: true,
                secure: false, // set true in production
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60, // 7 days
                path: '/',
            });

            return {
                user: { id: user.id, name: user.name, email: user.email },
                token,
            };
        } catch (err: any) {
            set.status = 400;
            return { error: { message: err.message } };
        }
    }, {
        body: t.Object({
            name: t.String({ minLength: 1 }),
            email: t.String(),
            password: t.String({ minLength: 8 }),
        }),
    })

    // Sign In
    .post('/api/auth/sign-in/email', async ({ body, cookie, set }) => {
        try {
            const { user, token } = await signIn(body.email, body.password);

            cookie[SESSION_COOKIE].set({
                value: token,
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60,
                path: '/',
            });

            return {
                user: { id: user.id, name: user.name, email: user.email },
                token,
            };
        } catch (err: any) {
            set.status = 401;
            return { error: { message: err.message } };
        }
    }, {
        body: t.Object({
            email: t.String(),
            password: t.String(),
        }),
    })

    // Sign Out
    .post('/api/auth/sign-out', ({ cookie }) => {
        const token = cookie?.[SESSION_COOKIE]?.value;
        if (token) {
            signOut(token);
            cookie[SESSION_COOKIE].set({
                value: '',
                maxAge: 0,
                path: '/',
            });
        }
        return { success: true };
    })

    // Get current session
    .get('/api/auth/get-session', ({ user, session }) => {
        if (!user || !session) {
            return { session: null, user: null };
        }
        return {
            session: { id: session.id, userId: session.userId, expiresAt: session.expiresAt },
            user: { id: user.id, name: user.name, email: user.email, image: user.image },
        };
    });

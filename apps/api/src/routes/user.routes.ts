// ========================================
// SkipQ v2 — User Profile Routes
// ========================================

import { Elysia, t } from 'elysia';
import { db } from '../db';

export const userRoutes = new Elysia({ prefix: '/api/users' })

    // --- Get current user profile ---
    .get('/me', ({ user }) => {
        if (!user) return { success: false, error: 'Not authenticated' };

        const dbUser = db.findOne('user', { email: user.email });
        if (!dbUser) return { success: false, error: 'User not found in database' };

        // Get user's org memberships
        const memberships = db.find('orgMembers', { userId: dbUser.id }).map((m: any) => {
            const org = db.findById('organizations', m.orgId);
            return {
                orgId: m.orgId,
                role: m.role,
                orgName: org?.name || 'Unknown',
                orgSlug: org?.slug || '',
            };
        });

        return {
            success: true,
            data: {
                id: dbUser.id,
                name: dbUser.name,
                email: dbUser.email,
                phone: dbUser.phone || null,
                role: dbUser.role || 'customer',
                createdAt: dbUser.createdAt,
                organizations: memberships,
            },
        };
    }, {
        auth: true,
    } as any)

    // --- Update current user profile ---
    .put('/me', ({ user, body }) => {
        if (!user) return { success: false, error: 'Not authenticated' };

        const updated = db.update('user', { email: user.email }, {
            name: body.name,
            phone: body.phone,
        });

        return { success: true, data: updated[0] || null };
    }, {
        auth: true,
        body: t.Object({
            name: t.Optional(t.String()),
            phone: t.Optional(t.String()),
        }),
    } as any)

    // --- List org members ---
    .get('/org/:orgId/members', ({ params }) => {
        const members = db.find('orgMembers', { orgId: params.orgId }).map((m: any) => {
            const u = db.findById('user', m.userId);
            return {
                id: m.id,
                userId: m.userId,
                role: m.role,
                userName: u?.name || 'Unknown',
                userEmail: u?.email || '',
                createdAt: m.createdAt,
            };
        });

        return { success: true, data: members };
    }, {
        auth: true,
        params: t.Object({ orgId: t.String() }),
    } as any)

    // --- Add a member to an org ---
    .post('/org/:orgId/members', ({ params, body }) => {
        try {
            let targetUser = db.findOne('user', { email: body.email });
            if (!targetUser) {
                // Auto-create user so client admins can onboard operators directly!
                targetUser = db.insert('user', {
                    name: body.name || body.email.split('@')[0],
                    email: body.email,
                    phone: body.phone || '',
                    role: body.role || 'operator',
                    emailVerified: true,
                    image: null,
                    passwordHash: 'GUEST_PASSCODE_ACTIVE',
                });
            }

            // Check if already a member
            const existing = db.findOne('orgMembers', { orgId: params.orgId, userId: targetUser.id });
            if (existing) {
                return { success: false, error: 'User is already a member of this organization' };
            }

            const member = db.insert('orgMembers', {
                orgId: params.orgId,
                userId: targetUser.id,
                role: body.role || 'operator',
            });

            return { success: true, data: { ...member, userName: targetUser.name, userEmail: targetUser.email } };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        auth: true,
        params: t.Object({ orgId: t.String() }),
        body: t.Object({
            email: t.String(),
            name: t.Optional(t.String()),
            phone: t.Optional(t.String()),
            role: t.Optional(t.Union([
                t.Literal('admin'),
                t.Literal('operator'),
            ])),
        }),
    } as any);

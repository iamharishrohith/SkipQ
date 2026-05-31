// ========================================
// SkipQ v2 — RBAC Middleware
// ========================================

import { Elysia } from 'elysia';
import { db } from '../db';
import type { UserRole, MemberRole } from '@skipq/shared';

/**
 * Check if a user has a specific global role.
 */
export function requireRole(...allowedRoles: UserRole[]) {
    return new Elysia({ name: `rbac-${allowedRoles.join('-')}` })
        .derive(async ({ user, set }) => {
            if (!user) {
                set.status = 401;
                throw new Error('Authentication required');
            }

            const dbUser = db.findOne('user', { email: user.email });
            if (!dbUser || !allowedRoles.includes(dbUser.role as UserRole)) {
                set.status = 403;
                throw new Error(`Forbidden: requires one of [${allowedRoles.join(', ')}]`);
            }

            return { userRole: dbUser.role as UserRole };
        });
}

/**
 * Check if a user is a member of a specific org with a required role.
 */
export function requireOrgRole(...allowedRoles: MemberRole[]) {
    return new Elysia({ name: `org-rbac-${allowedRoles.join('-')}` })
        .derive(async ({ user, params, set }) => {
            if (!user) {
                set.status = 401;
                throw new Error('Authentication required');
            }

            const orgId = (params as any)?.orgId;
            if (!orgId) {
                set.status = 400;
                throw new Error('Organization ID is required');
            }

            const dbUser = db.findOne('user', { email: user.email });
            if (!dbUser) {
                set.status = 401;
                throw new Error('User not found');
            }

            // Super admins bypass org checks
            if (dbUser.role === 'super_admin') {
                return { orgMemberRole: 'admin' as MemberRole, userId: dbUser.id };
            }

            // Check org membership
            const membership = db.findOne('orgMembers', { orgId, userId: dbUser.id });
            if (!membership || !allowedRoles.includes(membership.role as MemberRole)) {
                set.status = 403;
                throw new Error(`Forbidden: requires org role [${allowedRoles.join(', ')}]`);
            }

            return { orgMemberRole: membership.role as MemberRole, userId: dbUser.id };
        });
}

/**
 * Simple auth guard.
 */
export function requireAuth() {
    return new Elysia({ name: 'require-auth' })
        .derive(async ({ user, set }) => {
            if (!user) {
                set.status = 401;
                throw new Error('Authentication required');
            }

            const dbUser = db.findOne('user', { email: user.email });
            return { userId: dbUser?.id, userRole: dbUser?.role as UserRole };
        });
}

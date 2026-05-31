// ========================================
// SkipQ v2 — Organization & Branch Routes
// ========================================

import { Elysia, t } from 'elysia';
import { db } from '../db';

export const orgRoutes = new Elysia({ prefix: '/api/org' })

    // --- List all organizations ---
    .get('/orgs', () => {
        const orgs = db.getAll('organizations');
        return { success: true, data: orgs };
    })

    // --- List all branches (for QR setup) ---
    .get('/branches', () => {
        const branches = db.getAll('branches');
        return { success: true, data: branches };
    })

    // --- Get branch by ID ---
    .get('/branches/:branchId', ({ params }) => {
        const branch = db.findById('branches', params.branchId);
        if (!branch) return { success: false, error: 'Branch not found' };
        return { success: true, data: branch };
    }, {
        params: t.Object({ branchId: t.String() }),
    })

    // --- Create organization ---
    .post('/orgs', ({ body }) => {
        try {
            const slug = body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const org = db.insert('organizations', { name: body.name, slug, plan: body.plan || 'free' });
            return { success: true, data: org };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        body: t.Object({
            name: t.String({ minLength: 1 }),
            plan: t.Optional(t.Union([
                t.Literal('free'),
                t.Literal('pro'),
                t.Literal('enterprise'),
            ])),
        }),
    })

    // --- Get organization by ID ---
    .get('/orgs/:orgId', ({ params }) => {
        const org = db.findById('organizations', params.orgId);
        if (!org) return { success: false, error: 'Organization not found' };
        return { success: true, data: org };
    }, {
        params: t.Object({ orgId: t.String() }),
    })

    // --- Create a branch ---
    .post('/orgs/:orgId/branches', ({ params, body }) => {
        try {
            const branch = db.insert('branches', {
                orgId: params.orgId,
                name: body.name,
                address: body.address || null,
                operatingHours: body.operatingHours || null,
                isActive: true,
            });
            return { success: true, data: branch };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        params: t.Object({ orgId: t.String() }),
        body: t.Object({
            name: t.String({ minLength: 1 }),
            address: t.Optional(t.String()),
            operatingHours: t.Optional(t.Object({
                start: t.String(),
                end: t.String(),
            })),
        }),
    })

    // --- List branches for an org ---
    .get('/orgs/:orgId/branches', ({ params }) => {
        const branchList = db.find('branches', { orgId: params.orgId });
        return { success: true, data: branchList };
    }, {
        params: t.Object({ orgId: t.String() }),
    })

    // --- Create a service under a branch ---
    .post('/branches/:branchId/services', ({ params, body }) => {
        try {
            const service = db.insert('services', {
                branchId: params.branchId,
                name: body.name,
                description: body.description || null,
                estimatedDurationMin: body.estimatedDurationMin || 15,
                maxTokens: body.maxTokens || 100,
                deskType: body.deskType || 'free',
                tokenPrice: String(body.tokenPrice || 0),
                operatingHours: body.operatingHours || null,
                isActive: true,
            });
            return { success: true, data: service };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        params: t.Object({ branchId: t.String() }),
        body: t.Object({
            name: t.String({ minLength: 1 }),
            description: t.Optional(t.String()),
            estimatedDurationMin: t.Optional(t.Number()),
            maxTokens: t.Optional(t.Number()),
            deskType: t.Optional(t.Union([
                t.Literal('free'),
                t.Literal('paid'),
                t.Literal('vip'),
            ])),
            tokenPrice: t.Optional(t.Number()),
            operatingHours: t.Optional(t.Object({
                start: t.String(),
                end: t.String(),
            })),
        }),
    })

    // --- List services for a branch ---
    .get('/branches/:branchId/services', ({ params }) => {
        const serviceList = db.find('services', { branchId: params.branchId });
        return { success: true, data: serviceList };
    }, {
        params: t.Object({ branchId: t.String() }),
    })

    // --- Update a service ---
    .put('/services/:serviceId', ({ params, body }) => {
        try {
            const updated = db.update('services', { id: params.serviceId }, body);
            if (updated.length === 0) return { success: false, error: 'Service not found' };
            return { success: true, data: updated[0] };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        params: t.Object({ serviceId: t.String() }),
        body: t.Object({
            name: t.Optional(t.String()),
            description: t.Optional(t.String()),
            estimatedDurationMin: t.Optional(t.Number()),
            maxTokens: t.Optional(t.Number()),
            deskType: t.Optional(t.String()),
            tokenPrice: t.Optional(t.String()),
        }),
    })

    // --- Create a desk under a service ---
    .post('/services/:serviceId/desks', ({ params, body }) => {
        try {
            const desk = db.insert('desks', {
                serviceId: params.serviceId,
                name: body.name,
                isActive: true,
                assignedOperatorId: null,
            });
            return { success: true, data: desk };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        params: t.Object({ serviceId: t.String() }),
        body: t.Object({
            name: t.String({ minLength: 1 }),
        }),
    })

    // --- List desks for a service ---
    .get('/services/:serviceId/desks', ({ params }) => {
        const deskList = db.find('desks', { serviceId: params.serviceId });
        return { success: true, data: deskList };
    }, {
        params: t.Object({ serviceId: t.String() }),
    });

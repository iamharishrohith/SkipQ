// ========================================
// SkipQ v2 — Desk Management Routes
// ========================================

import { Elysia, t } from 'elysia';
import { db } from '../db';
import * as deskService from '../services/desk.service';
import * as queueService from '../services/queue.service';

export const deskRoutes = new Elysia({ prefix: '/api/desks' })

    // --- List desks for a service ---
    .get('/service/:serviceId', async ({ params }) => {
        try {
            const desks = await deskService.getDesksWithOperators(params.serviceId);
            return { success: true, data: desks };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        params: t.Object({ serviceId: t.String() }),
    })

    // --- List all desks (all services, for selection) ---
    .get('/all', () => {
        try {
            const desks = db.find('desks', {});
            const result = desks.map(desk => {
                const service = db.findOne('services', { id: desk.serviceId });
                const branch = service ? db.findOne('branches', { id: service.branchId }) : null;
                return {
                    ...desk,
                    serviceName: service?.name || 'Unknown',
                    branchName: branch?.name || 'Unknown',
                };
            });
            return { success: true, data: result };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    })

    // --- Desk login (operator enters name + selects desk) ---
    .post('/login', async ({ body }) => {
        try {
            const result = await deskService.deskLogin(body.deskId, body.operatorName);
            return { success: true, data: result };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        body: t.Object({
            deskId: t.String(),
            operatorName: t.String({ minLength: 1 }),
        }),
    })

    // --- Get desk + queue state (for operator view) ---
    .get('/:deskId/state', async ({ params }) => {
        try {
            const desk = await deskService.getDeskById(params.deskId);
            if (!desk) return { success: false, error: 'Desk not found' };

            const service = db.findOne('services', { id: desk.serviceId });
            const queueState = await queueService.getQueueState(desk.serviceId);

            return {
                success: true,
                data: {
                    desk,
                    service,
                    queue: queueState,
                },
            };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        params: t.Object({ deskId: t.String() }),
    })

    // --- Assign operator to desk ---
    .post('/assign', async ({ body }) => {
        try {
            await deskService.assignOperatorToDesk(body.deskId, body.operatorName);
            return { success: true, message: 'Operator assigned to desk' };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        body: t.Object({
            deskId: t.String(),
            operatorName: t.String(),
        }),
    })

    // --- Unassign operator from desk ---
    .post('/unassign', async ({ body }) => {
        try {
            await deskService.unassignOperator(body.deskId);
            return { success: true, message: 'Operator unassigned' };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        body: t.Object({
            deskId: t.String(),
        }),
    })

    // --- Toggle desk active status ---
    .patch('/:deskId/toggle', async ({ params, body }) => {
        try {
            await deskService.toggleDeskStatus(params.deskId, body.isActive);
            return { success: true, message: `Desk ${body.isActive ? 'activated' : 'deactivated'}` };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        params: t.Object({ deskId: t.String() }),
        body: t.Object({ isActive: t.Boolean() }),
    });

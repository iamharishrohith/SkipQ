// ========================================
// SkipQ v2 — Queue API Routes
// ========================================

import { Elysia, t } from 'elysia';
import { db } from '../db';
import * as queueService from '../services/queue.service';

export const queueRoutes = new Elysia({ prefix: '/api/queue' })

    // --- Book a token ---
    .post('/book', async ({ body }) => {
        try {
            // Find or create guest user by phone
            let user = db.findOne('user', { phone: body.phone });
            if (!user) {
                user = db.insert('user', {
                    name: body.name,
                    email: `${body.phone}@guest.skipq`,
                    phone: body.phone,
                    role: 'customer',
                    emailVerified: false,
                    image: null,
                    passwordHash: null,
                });
            } else {
                // Update name if provided
                if (body.name && body.name !== user.name) {
                    db.update('user', { id: user.id }, { name: body.name });
                    user.name = body.name;
                }
            }

            const result = await queueService.bookToken(
                body.serviceId,
                user.id,
                body.queueType
            );

            // Update newly created token with group size and payment status details
            if (result && result.tokenId) {
                db.update('tokens', { id: result.tokenId }, {
                    groupSize: body.groupSize || 1,
                    paymentStatus: body.paymentStatus || 'free',
                    amountPaid: body.amountPaid || 0,
                    transactionId: body.transactionId || null,
                });

                // Audit logging in transactional UPI Ledger if paid
                if (body.paymentStatus === 'paid' && (body.amountPaid || 0) > 0) {
                    const service = db.findOne('services', { id: body.serviceId });
                    const branch = service ? db.findOne('branches', { id: service.branchId }) : null;
                    
                    db.insert('upiTransactions', {
                        tokenId: result.tokenId,
                        orgId: branch?.orgId || 'unknown',
                        amount: body.amountPaid,
                        purpose: 'booking_fee',
                        status: 'success',
                        createdAt: new Date().toISOString()
                    });
                }
            }

            return { success: true, data: { ...result, userName: user.name, phone: user.phone } };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        body: t.Object({
            serviceId: t.String(),
            name: t.String({ minLength: 1 }),
            phone: t.String({ minLength: 10 }),
            queueType: t.Optional(t.Union([
                t.Literal('main'),
                t.Literal('buffer'),
            ])),
            groupSize: t.Optional(t.Number()),
            paymentStatus: t.Optional(t.String()),
            amountPaid: t.Optional(t.Number()),
            transactionId: t.Optional(t.String()),
        }),
    })

    // --- Call next customer ---
    .post('/next', async ({ body }) => {
        try {
            // 1. Complete current active token (if any)
            const queueRedis = await import('../redis/queue.redis');
            const activeTokenId = await queueRedis.getActiveToken(body.serviceId);
            let completedId: string | null = null;
            
            if (activeTokenId) {
                const now = new Date().toISOString();
                db.update('tokens', { id: activeTokenId }, {
                    status: 'completed',
                    serviceEndTime: now,
                });
                
                await queueRedis.clearActiveToken(body.serviceId);
                completedId = activeTokenId;
                
                const pubsub = await import('../redis/pubsub');
                await pubsub.publishQueueEvent(body.serviceId, 'TOKEN_COMPLETED', {
                    tokenId: activeTokenId
                });
            }

            // 2. Call deterministic load balancer to allocate next token (triage re-route if bottlenecked)
            const operatorName = body.operatorName || 'Desk Operator';
            const balancer = await import('../services/balancer.service');
            const balancerResult = await balancer.getNextBalancedToken(body.serviceId, operatorName);

            return {
                success: true,
                data: {
                    completed: completedId,
                    promoted: balancerResult.token?.id || null,
                    balanced: balancerResult.balanced,
                    originalServiceName: balancerResult.originalServiceName || null,
                    token: balancerResult.token
                }
            };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        body: t.Object({
            serviceId: t.String(),
            operatorName: t.Optional(t.String())
        }),
    })

    // --- Complete current customer (without calling next) ---
    .post('/complete', async ({ body }) => {
        try {
            const result = await queueService.completeCurrentToken(body.serviceId);
            return { success: true, data: result };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        body: t.Object({
            serviceId: t.String(),
        }),
    })

    // --- Cancel a token ---
    .post('/cancel', async ({ body }) => {
        try {
            await queueService.cancelToken(body.tokenId);
            return { success: true, message: 'Token cancelled' };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        body: t.Object({
            tokenId: t.String(),
        }),
    })

    // --- Mark no-show ---
    .post('/no-show', async ({ body }) => {
        try {
            await queueService.markNoShow(body.tokenId);
            return { success: true, message: 'Token marked as no-show' };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        body: t.Object({
            tokenId: t.String(),
        }),
    })

    // --- Get queue state ---
    .get('/state/:serviceId', async ({ params }) => {
        try {
            const state = await queueService.getQueueState(params.serviceId);
            return { success: true, data: state };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        params: t.Object({
            serviceId: t.String(),
        }),
    })

    // --- Get token info (for customer status page) ---
    .get('/token/:tokenId', async ({ params }) => {
        try {
            const token = db.findOne('tokens', { id: params.tokenId });
            if (!token) {
                return { success: false, error: 'Token not found' };
            }

            const service = db.findOne('services', { id: token.serviceId });

            // Get position in queue
            const queueRedis = await import('../redis/queue.redis');
            let position: number | null = null;
            if (token.status === 'waiting') {
                position = await queueRedis.getQueuePosition(token.serviceId, token.id);
                if (position !== null) position += 1; // 1-indexed
            }

            const desk = db.findOne('desks', { serviceId: token.serviceId });
            const operatorName = desk?.assignedOperatorId || 'Desk Operator';

            // Resolve industry categories and service booking price limits
            const branch = service ? db.findOne('branches', { id: service.branchId }) : null;
            const org = branch ? db.findOne('organizations', { id: branch.orgId }) : null;
            const industryCategory = org?.industryCategory || 'custom';
            
            const servicePrice = service?.price || 0;
            const allowPriorityFastPass = service?.allowPriorityFastPass !== false; // default true
            const fastPassPrice = service?.fastPassPrice || 99;

            return {
                success: true,
                data: {
                    id: token.id,
                    tokenNumber: token.tokenNumber,
                    status: token.status,
                    serviceId: token.serviceId,
                    serviceName: service?.name || 'Unknown',
                    position,
                    queueType: token.queueType,
                    bookedAt: token.bookedAt,
                    operatorName,
                    industryCategory,
                    price: servicePrice,
                    allowPriorityFastPass,
                    fastPassPrice,
                    isFastPass: token.isFastPass || false,
                    groupSize: token.groupSize || 1,
                    paymentStatus: token.paymentStatus || 'free'
                },
            };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        params: t.Object({
            tokenId: t.String(),
        }),
    })

    // --- Buffer Promotion ---
    .post('/buffer/promote', async ({ body }) => {
        try {
            const count = await queueService.promoteBufferToMain(body.serviceId, body.count);
            return { success: true, data: { promoted: count } };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        body: t.Object({
            serviceId: t.String(),
            count: t.Optional(t.Number()),
        }),
    })

    // --- Move to Bench ---
    .post('/bench/move', async ({ body }) => {
        try {
            const success = await queueService.moveToBench(body.serviceId);
            return { success };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        body: t.Object({
            serviceId: t.String(),
        }),
    })

    // --- Call from Bench ---
    .post('/bench/call', async ({ body }) => {
        try {
            const success = await queueService.callFromBench(body.serviceId, body.tokenId);
            return { success };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        body: t.Object({
            serviceId: t.String(),
            tokenId: t.String(),
        }),
    });

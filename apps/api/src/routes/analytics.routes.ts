// ========================================
// SkipQ v2 — Analytics Routes
// ========================================

import { Elysia, t } from 'elysia';
import { db } from '../db';
import * as queueRedis from '../redis/queue.redis';

export const analyticsRoutes = new Elysia({ prefix: '/api/analytics' })

    // --- List all tokens for historical audit ---
    .get('/tokens', () => {
        try {
            const tokens = db.getAll('tokens');
            const result = tokens.map((token: any) => {
                const service = db.findOne('services', { id: token.serviceId });
                const customer = db.findOne('user', { id: token.customerId });
                return {
                    ...token,
                    serviceName: service?.name || 'Unknown',
                    customerName: customer?.name || 'Visitor',
                    customerPhone: customer?.phone || 'N/A'
                };
            });
            return { success: true, data: result.reverse() };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    })

    // --- Service-level stats ---
    .get('/service/:serviceId', ({ params }) => {
        const allTokens = db.find('tokens', { serviceId: params.serviceId });
        const total = allTokens.length;
        const completed = allTokens.filter((t: any) => t.status === 'completed').length;
        const cancelled = allTokens.filter((t: any) => t.status === 'cancelled').length;
        const noShow = allTokens.filter((t: any) => t.status === 'no_show').length;

        // Calculate average service time
        const completedTokens = allTokens.filter((t: any) => t.status === 'completed' && t.serviceStartTime && t.serviceEndTime);
        let avgServiceTimeMin = 0;
        if (completedTokens.length > 0) {
            const totalTime = completedTokens.reduce((sum: number, t: any) => {
                const start = new Date(t.serviceStartTime).getTime();
                const end = new Date(t.serviceEndTime).getTime();
                return sum + (end - start) / 60000;
            }, 0);
            avgServiceTimeMin = Math.round((totalTime / completedTokens.length) * 100) / 100;
        }

        return {
            success: true,
            data: { total, completed, cancelled, noShow, avgServiceTimeMin },
        };
    }, {
        params: t.Object({ serviceId: t.String() }),
    })

    // --- Hourly breakdown for a service ---
    .get('/service/:serviceId/hourly', ({ params }) => {
        const allTokens = db.find('tokens', { serviceId: params.serviceId });
        const hourlyCounts: Record<number, number> = {};
        for (let h = 0; h < 24; h++) hourlyCounts[h] = 0;

        for (const token of allTokens) {
            if (token.bookedAt) {
                const hour = new Date(token.bookedAt).getHours();
                hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
            }
        }

        const data = Object.entries(hourlyCounts).map(([hour, count]) => ({
            hour: parseInt(hour, 10),
            count,
        }));

        return { success: true, data };
    }, {
        params: t.Object({ serviceId: t.String() }),
    })

    // --- Branch overview with live queue lengths ---
    .get('/branch/:branchId/overview', async ({ params }) => {
        const serviceList = db.find('services', { branchId: params.branchId });

        const data = await Promise.all(serviceList.map(async (service: any) => {
            const allTokens = db.find('tokens', { serviceId: service.id });
            const total = allTokens.length;
            const completed = allTokens.filter((t: any) => t.status === 'completed').length;
            const cancelled = allTokens.filter((t: any) => t.status === 'cancelled').length;
            const noShow = allTokens.filter((t: any) => t.status === 'no_show').length;

            const completedTokens = allTokens.filter((t: any) => t.status === 'completed' && t.serviceStartTime && t.serviceEndTime);
            let avgServiceTimeMin = 0;
            if (completedTokens.length > 0) {
                const totalTime = completedTokens.reduce((sum: number, t: any) => {
                    const start = new Date(t.serviceStartTime).getTime();
                    const end = new Date(t.serviceEndTime).getTime();
                    return sum + (end - start) / 60000;
                }, 0);
                avgServiceTimeMin = Math.round((totalTime / completedTokens.length) * 100) / 100;
            }

            const queueLength = await queueRedis.getQueueLength(service.id);

            return {
                serviceId: service.id,
                serviceName: service.name,
                total,
                completed,
                cancelled,
                noShow,
                avgServiceTimeMin,
                liveQueueLength: queueLength,
            };
        }));

        return { success: true, data };
    }, {
        params: t.Object({ branchId: t.String() }),
    });

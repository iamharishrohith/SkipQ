// ========================================
// SkipQ v2 — Queue Rehydration Logic
// ========================================
// Restores in-memory queue state from the JSON store on startup.

import { db } from './index';
import * as queueRedis from '../redis/queue.redis';

export async function rehydrateAllQueues() {
    console.log('  🔄 Rehydrating queue state from database...');

    try {
        // Seed default test service if not exists (for dual-simulator live sync)
        const existingService = db.findById('services', 'srv-test-1');
        if (!existingService) {
            db.insert('services', {
                id: 'srv-test-1',
                name: 'Test General OPD Clinic',
                branchId: 'br-test',
                isActive: true,
                maxTokens: 100,
                price: 0
            });
            console.log('  🌱 Seeded default srv-test-1 service');
        }

        const tokens = db.find('tokens', {});
        const counters: Record<string, number> = {};
        let activeCount = 0;
        let waitingCount = 0;

        // Sort tokens by bookedAt to ensure correct queue order
        const sortedTokens = [...tokens].sort((a, b) =>
            new Date(a.bookedAt).getTime() - new Date(b.bookedAt).getTime()
        );

        for (const token of sortedTokens) {
            const serviceId = token.serviceId;

            // Track max token number per service for counter rehydration
            const tokenNum = parseInt(token.tokenNumber, 10);
            if (!counters[serviceId] || tokenNum > counters[serviceId]) {
                counters[serviceId] = tokenNum;
            }

            // Rehydrate live queue based on status
            if (token.status === 'active') {
                await queueRedis.setActiveToken(serviceId, token.id);
                activeCount++;
            } else if (token.status === 'waiting') {
                if (token.queueType === 'main') {
                    await queueRedis.enqueueToken(serviceId, token.id);
                    waitingCount++;
                } else if (token.queueType === 'buffer') {
                    await queueRedis.enqueueBuffer(serviceId, token.id);
                }
            }

            // Always cache token details for fast lookups
            await queueRedis.cacheToken(token.id, {
                id: token.id,
                serviceId: token.serviceId,
                userId: token.userId,
                tokenNumber: String(token.tokenNumber),
                status: token.status,
                queueType: token.queueType,
                bookedAt: token.bookedAt,
            });
        }

        // Restore counters
        for (const [serviceId, value] of Object.entries(counters)) {
            await queueRedis.setCounter(serviceId, value);
        }

        console.log(`  ✅ Rehydrated: ${activeCount} active, ${waitingCount} waiting tokens`);
    } catch (err) {
        console.error('  ⚠️ Queue rehydration failed:', err);
    }
}

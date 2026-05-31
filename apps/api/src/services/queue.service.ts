// ========================================
// SkipQ v2 — Queue Business Logic Service
// ========================================

import { db } from '../db';
import * as queueRedis from '../redis/queue.redis';
import { publishQueueEvent } from '../redis/pubsub';
import type { TokenBookingResult, QueueState } from '@skipq/shared';

/**
 * Book a new token for a service.
 */
export async function bookToken(
    serviceId: string,
    userId: string,
    queueType: 'main' | 'buffer' = 'main'
): Promise<TokenBookingResult> {
    // Validate service exists and is active
    const service = db.findOne('services', { id: serviceId, isActive: true });
    if (!service) {
        throw new Error('Service not found or inactive');
    }

    // Check queue capacity
    const currentLength = await queueRedis.getQueueLength(serviceId);
    if (currentLength >= service.maxTokens) {
        throw new Error('Queue is full — maximum capacity reached');
    }

    // Get next token number (atomic)
    const tokenNumber = await queueRedis.getNextTokenNumber(serviceId);

    // Insert into JSON store
    const token = db.insert('tokens', {
        serviceId,
        userId,
        tokenNumber,
        status: queueType === 'main' ? 'waiting' : 'booked',
        queueType,
        bookedAt: new Date().toISOString(),
    });

    // Push to queue
    if (queueType === 'main') {
        await queueRedis.enqueueToken(serviceId, token.id);
    } else {
        await queueRedis.enqueueBuffer(serviceId, token.id);
    }

    // Cache token for fast lookups
    await queueRedis.cacheToken(token.id, {
        id: token.id,
        serviceId,
        userId,
        tokenNumber: String(tokenNumber),
        status: token.status,
        queueType,
        bookedAt: token.bookedAt,
    });

    // Auto-promote if no one is currently active
    const activeTokenId = await queueRedis.getActiveToken(serviceId);
    if (!activeTokenId && queueType === 'main') {
        await promoteNextToken(serviceId);
    }

    // Calculate position and EWT
    const position = await queueRedis.getQueuePosition(serviceId, token.id);
    const estimatedWait = await queueRedis.estimateWaitTime(serviceId, (position ?? 0) + 1);

    // Publish event
    await publishQueueEvent(serviceId, 'QUEUE_UPDATED', {
        tokenId: token.id,
        tokenNumber,
        action: 'booked',
    });

    return {
        tokenId: token.id,
        tokenNumber,
        position: (position ?? 0) + 1,
        estimatedWaitMinutes: estimatedWait,
    };
}

/**
 * Call the next customer: complete current active token, promote next.
 */
export async function callNextToken(serviceId: string): Promise<{
    completed: string | null;
    promoted: string | null;
}> {
    const activeTokenId = await queueRedis.getActiveToken(serviceId);
    let completedId: string | null = null;

    // Complete current active token
    if (activeTokenId) {
        const now = new Date().toISOString();
        db.update('tokens', { id: activeTokenId }, {
            status: 'completed',
            serviceEndTime: now,
        });

        await queueRedis.clearActiveToken(serviceId);

        // Update avg service time
        const completedToken = db.findById('tokens', activeTokenId);

        if (completedToken?.serviceStartTime) {
            const start = new Date(completedToken.serviceStartTime).getTime();
            const end = new Date(now).getTime();
            const serviceTimeMin = (end - start) / 60000;
            const meta = await queueRedis.getQueueMeta(serviceId);
            const totalServed = meta.totalServed + 1;
            const newAvg = meta.avgServiceTime
                ? (meta.avgServiceTime * meta.totalServed + serviceTimeMin) / totalServed
                : serviceTimeMin;

            await queueRedis.updateQueueMeta(serviceId, {
                avgServiceTime: Math.round(newAvg * 100) / 100,
                totalServed,
                lastServedAt: now,
            });
        }

        completedId = activeTokenId;

        await publishQueueEvent(serviceId, 'TOKEN_COMPLETED', {
            tokenId: activeTokenId,
        });
    }

    // Promote next
    const promotedId = await promoteNextToken(serviceId);

    return { completed: completedId, promoted: promotedId };
}

/**
 * Promote the next waiting token to active.
 */
async function promoteNextToken(serviceId: string): Promise<string | null> {
    const nextTokenId = await queueRedis.dequeueNextToken(serviceId);
    if (!nextTokenId) return null;

    const now = new Date().toISOString();
    db.update('tokens', { id: nextTokenId }, {
        status: 'active',
        serviceStartTime: now,
    });

    await queueRedis.setActiveToken(serviceId, nextTokenId);

    // Update cache
    await queueRedis.cacheToken(nextTokenId, {
        status: 'active',
        serviceStartTime: now,
    });

    await publishQueueEvent(serviceId, 'TOKEN_CALLED', {
        tokenId: nextTokenId,
    });

    return nextTokenId;
}

/**
 * Complete the current active token without calling the next one.
 */
export async function completeCurrentToken(serviceId: string): Promise<{ completed: string | null }> {
    const activeTokenId = await queueRedis.getActiveToken(serviceId);
    if (!activeTokenId) {
        return { completed: null };
    }

    const now = new Date().toISOString();

    // Update status
    db.update('tokens', { id: activeTokenId }, {
        status: 'completed',
        completedAt: now,
        serviceEndTime: now, // Ensure we track end time
    });

    // Remove from active
    await queueRedis.clearActiveToken(serviceId);

    // Publish event
    await publishQueueEvent(serviceId, 'QUEUE_UPDATED', {
        tokenId: activeTokenId,
        action: 'completed',
    });

    return { completed: activeTokenId };
}

/**
 * Cancel a token.
 */
export async function cancelToken(tokenId: string): Promise<void> {
    const token = db.findById('tokens', tokenId);
    if (!token) throw new Error('Token not found');

    db.update('tokens', { id: tokenId }, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
    });

    // Remove from queues
    await queueRedis.removeFromQueue(token.serviceId, tokenId);
    await queueRedis.removeFromBuffer(token.serviceId, tokenId);

    // If the cancelled token was the active one, promote next
    const activeTokenId = await queueRedis.getActiveToken(token.serviceId);
    if (activeTokenId === tokenId) {
        await queueRedis.clearActiveToken(token.serviceId);
        await promoteNextToken(token.serviceId);
    }

    await publishQueueEvent(token.serviceId, 'QUEUE_UPDATED', {
        tokenId,
        action: 'cancelled',
    });
}

/**
 * Mark a token as no-show.
 */
export async function markNoShow(tokenId: string): Promise<void> {
    const token = db.findById('tokens', tokenId);
    if (!token) throw new Error('Token not found');

    db.update('tokens', { id: tokenId }, { status: 'no_show' });

    await queueRedis.removeFromQueue(token.serviceId, tokenId);

    const activeTokenId = await queueRedis.getActiveToken(token.serviceId);
    if (activeTokenId === tokenId) {
        await queueRedis.clearActiveToken(token.serviceId);
        await promoteNextToken(token.serviceId);
    }

    await publishQueueEvent(token.serviceId, 'QUEUE_UPDATED', {
        tokenId,
        action: 'no_show',
    });
}

/**
 * Promote tokens from buffer to main queue.
 */
export async function promoteBufferToMain(serviceId: string, count: number = 1): Promise<number> {
    let promotedCount = 0;
    for (let i = 0; i < count; i++) {
        const tokenId = await queueRedis.dequeueNextBuffer(serviceId);
        if (!tokenId) break;

        // Update status and move to main queue
        db.update('tokens', { id: tokenId }, {
            status: 'waiting',
            queueType: 'main',
        });

        await queueRedis.enqueueToken(serviceId, tokenId);
        await queueRedis.cacheToken(tokenId, { status: 'waiting', queueType: 'main' });

        await publishQueueEvent(serviceId, 'QUEUE_UPDATED', {
            tokenId,
            action: 'promoted_from_buffer',
        });
        promotedCount++;
    }
    return promotedCount;
}

/**
 * Move current active token to bench.
 */
export async function moveToBench(serviceId: string): Promise<boolean> {
    const activeTokenId = await queueRedis.getActiveToken(serviceId);
    if (!activeTokenId) return false;

    // Update status
    db.update('tokens', { id: activeTokenId }, { status: 'waiting' }); // Technically waiting on bench

    // Remove from active
    await queueRedis.clearActiveToken(serviceId);

    // Add to bench
    await queueRedis.addToBench(serviceId, activeTokenId);

    // Publish event
    await publishQueueEvent(serviceId, 'QUEUE_UPDATED', {
        tokenId: activeTokenId,
        action: 'moved_to_bench',
    });

    return true;
}

/**
 * Call a specific token from the bench (make active).
 */
export async function callFromBench(serviceId: string, tokenId: string): Promise<boolean> {
    // Check if desk is free (no active token)
    const activeTokenId = await queueRedis.getActiveToken(serviceId);
    if (activeTokenId) throw new Error('Desk is currently busy');

    // Remove from bench
    await queueRedis.removeFromBench(serviceId, tokenId);

    // Set as active
    const now = new Date().toISOString();
    db.update('tokens', { id: tokenId }, {
        status: 'active',
        serviceStartTime: now,
    });

    await queueRedis.setActiveToken(serviceId, tokenId);

    // Update cache
    await queueRedis.cacheToken(tokenId, {
        status: 'active',
        serviceStartTime: now,
    });

    await publishQueueEvent(serviceId, 'TOKEN_CALLED', {
        tokenId,
        fromBench: true,
    });

    return true;
}

/**
 * Get the current queue state for a service.
 */
export async function getQueueState(serviceId: string): Promise<QueueState> {
    const service = db.findById('services', serviceId);
    if (!service) throw new Error('Service not found');

    const activeTokenId = await queueRedis.getActiveToken(serviceId);
    let currentlyServing: number | null = null;

    if (activeTokenId) {
        const cached = await queueRedis.getCachedToken(activeTokenId);
        currentlyServing = cached ? parseInt(cached.tokenNumber, 10) : null;
    }

    const totalWaiting = await queueRedis.getQueueLength(serviceId);
    const estimatedWait = await queueRedis.estimateWaitTime(serviceId, totalWaiting);
    const waitingTokens = await queueRedis.getQueueMembers(serviceId);
    const benchTokens = await queueRedis.getBenchMembers(serviceId);
    const bufferCount = await queueRedis.getBufferLength(serviceId);

    return {
        serviceId,
        serviceName: service.name,
        currentlyServing,
        totalWaiting,
        estimatedWaitMinutes: estimatedWait,
        isOpen: service.isActive,
        waitingTokens,
        benchTokens,
        bufferCount,
    };
}

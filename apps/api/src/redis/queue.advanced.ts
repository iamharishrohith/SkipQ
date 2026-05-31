// ========================================
// SkipQ v2 — Advanced Queue Operations
// ========================================
// VIP priority, concurrency locks, queue policies, and EWT refinement.

import { redis } from './client';
import { REDIS_KEYS } from '@skipq/shared';

// --- VIP Queue Operations ---

/**
 * Enqueue a VIP token with higher priority (lower score = higher priority).
 * VIP tokens are added to the main queue but with a score that ensures
 * they are served before regular tokens added after them.
 */
export async function enqueueVIP(serviceId: string, tokenId: string): Promise<number> {
    const key = REDIS_KEYS.queueMain(serviceId);
    // Use a score that's significantly lower than regular timestamps
    // This ensures VIP tokens jump ahead of regular ones
    const vipScore = Date.now() - 86400000; // 1 day offset
    await redis.zadd(key, vipScore, tokenId);
    return redis.zcard(key);
}

// --- Concurrency Lock ---

const LOCK_TTL = 5; // 5 seconds lock timeout

/**
 * Acquire a distributed lock for a "call next" operation.
 * Prevents race conditions when multiple operators try to call next simultaneously.
 */
export async function acquireCallNextLock(serviceId: string): Promise<boolean> {
    const lockKey = `lock:callnext:${serviceId}`;
    const result = await redis.set(lockKey, '1', 'EX', LOCK_TTL, 'NX');
    return result === 'OK';
}

/**
 * Release the call-next lock.
 */
export async function releaseCallNextLock(serviceId: string): Promise<void> {
    const lockKey = `lock:callnext:${serviceId}`;
    await redis.del(lockKey);
}

// --- Queue Policies ---

/**
 * Check if a service's queue is open based on operating hours.
 */
export function isWithinOperatingHours(operatingHours: { start: string; end: string } | null): boolean {
    if (!operatingHours) return true; // No hours set = always open

    const now = new Date();
    const [startH, startM] = operatingHours.start.split(':').map(Number);
    const [endH, endM] = operatingHours.end.split(':').map(Number);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/**
 * Check if a token has expired (booked but not arrived within timeout).
 * Returns true if expired.
 */
export function isTokenExpired(bookedAt: Date, expiryMinutes: number = 30): boolean {
    const expiryTime = bookedAt.getTime() + expiryMinutes * 60 * 1000;
    return Date.now() > expiryTime;
}

// --- EWT Refinement ---

/**
 * Calculate refined EWT using exponential moving average.
 * More recent service times are weighted heavier than older ones.
 */
export function calculateRefinedEWT(
    currentAvg: number,
    newServiceTime: number,
    alpha: number = 0.3
): number {
    if (currentAvg === 0) return newServiceTime;
    // EMA: new_avg = alpha * latest + (1 - alpha) * current_avg
    return Math.round((alpha * newServiceTime + (1 - alpha) * currentAvg) * 100) / 100;
}

/**
 * Estimate wait time with per-desk parallelism.
 * If a service has N active desks, effective wait = position * avg_time / N
 */
export async function estimateWaitWithDesks(
    serviceId: string,
    position: number,
    activeDesks: number
): Promise<number> {
    const meta = await redis.hgetall(REDIS_KEYS.queueMeta(serviceId));
    const avgTime = parseFloat(meta.avg_service_time || '15');
    const effectiveDesks = Math.max(activeDesks, 1);
    return Math.ceil((position * avgTime) / effectiveDesks);
}

// --- Promote from Buffer ---

/**
 * Move the next token from the buffer queue to the main queue.
 * Called when the main queue drops below a threshold.
 */
export async function promoteFromBuffer(serviceId: string): Promise<string | null> {
    const bufferKey = REDIS_KEYS.queueBuffer(serviceId);
    const mainKey = REDIS_KEYS.queueMain(serviceId);

    // Pop from buffer
    const result = await redis.zpopmin(bufferKey, 1);
    if (result.length === 0) return null;

    const tokenId = result[0];
    // Add to main queue
    await redis.zadd(mainKey, Date.now(), tokenId);
    return tokenId;
}

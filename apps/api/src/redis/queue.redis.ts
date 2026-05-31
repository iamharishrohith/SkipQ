// ========================================
// SkipQ v2 — Queue Operations (In-Memory)
// ========================================
// Replaces Redis sorted sets / hashes / counters
// with plain JS data structures.

import { REDIS_KEYS } from '@skipq/shared';

// --- In-memory sorted sets (Map<key, Array<{member, score}>>) ---
const sortedSets = new Map<string, { member: string; score: number }[]>();
// --- In-memory key-value store ---
const kvStore = new Map<string, string>();
// --- In-memory hash store ---
const hashStore = new Map<string, Record<string, string>>();
// --- Counters ---
const counters = new Map<string, number>();

function getSortedSet(key: string): { member: string; score: number }[] {
    if (!sortedSets.has(key)) sortedSets.set(key, []);
    return sortedSets.get(key)!;
}

/**
 * Add a token to the main queue (sorted set, scored by timestamp).
 */
export async function enqueueToken(serviceId: string, tokenId: string): Promise<number> {
    const key = REDIS_KEYS.queueMain(serviceId);
    const set = getSortedSet(key);
    set.push({ member: tokenId, score: Date.now() });
    set.sort((a, b) => a.score - b.score);
    return set.length;
}

/**
 * Add a token to the buffer queue.
 */
export async function enqueueBuffer(serviceId: string, tokenId: string): Promise<void> {
    const key = REDIS_KEYS.queueBuffer(serviceId);
    const set = getSortedSet(key);
    set.push({ member: tokenId, score: Date.now() });
    set.sort((a, b) => a.score - b.score);
}

/**
 * Remove and return the next token from the main queue (FIFO).
 */
export async function dequeueNextToken(serviceId: string): Promise<string | null> {
    const key = REDIS_KEYS.queueMain(serviceId);
    const set = getSortedSet(key);
    if (set.length === 0) return null;
    const first = set.shift()!;
    return first.member;
}

/**
 * Get the currently active token for a service.
 */
export async function getActiveToken(serviceId: string): Promise<string | null> {
    return kvStore.get(REDIS_KEYS.queueActive(serviceId)) || null;
}

/**
 * Set the currently active token for a service.
 */
export async function setActiveToken(serviceId: string, tokenId: string): Promise<void> {
    kvStore.set(REDIS_KEYS.queueActive(serviceId), tokenId);
}

/**
 * Clear the currently active token.
 */
export async function clearActiveToken(serviceId: string): Promise<void> {
    kvStore.delete(REDIS_KEYS.queueActive(serviceId));
}

/**
 * Get an atomic, incrementing token number.
 */
export async function getNextTokenNumber(serviceId: string): Promise<number> {
    const key = REDIS_KEYS.queueCounter(serviceId);
    const current = counters.get(key) || 0;
    const next = current + 1;
    counters.set(key, next);
    return next;
}

/**
 * Set the counter for a service (for rehydration).
 */
export async function setCounter(serviceId: string, value: number): Promise<void> {
    const key = REDIS_KEYS.queueCounter(serviceId);
    counters.set(key, value);
}

/**
 * Get the position of a token in the main queue (0-indexed).
 */
export async function getQueuePosition(serviceId: string, tokenId: string): Promise<number | null> {
    const key = REDIS_KEYS.queueMain(serviceId);
    const set = getSortedSet(key);
    const idx = set.findIndex(s => s.member === tokenId);
    return idx >= 0 ? idx : null;
}

/**
 * Get the total number of tokens waiting in the main queue.
 */
/**
 * Get the total number of tokens waiting in the main queue.
 */
export async function getQueueLength(serviceId: string): Promise<number> {
    const key = REDIS_KEYS.queueMain(serviceId);
    return getSortedSet(key).length;
}

/**
 * Get the total number of tokens waiting in the buffer queue.
 */
export async function getBufferLength(serviceId: string): Promise<number> {
    const key = REDIS_KEYS.queueBuffer(serviceId);
    return getSortedSet(key).length;
}

/**
 * Remove and return the next token from the buffer queue.
 */
export async function dequeueNextBuffer(serviceId: string): Promise<string | null> {
    const key = REDIS_KEYS.queueBuffer(serviceId);
    const set = getSortedSet(key);
    if (set.length === 0) return null;
    const first = set.shift()!;
    return first.member;
}

/**
 * Get all token IDs in the buffer queue.
 */
export async function getBufferMembers(serviceId: string): Promise<string[]> {
    const key = REDIS_KEYS.queueBuffer(serviceId);
    return getSortedSet(key).map(s => s.member);
}

/**
 * Remove a specific token from the main queue.
 */
export async function removeFromQueue(serviceId: string, tokenId: string): Promise<void> {
    const key = REDIS_KEYS.queueMain(serviceId);
    const set = getSortedSet(key);
    const idx = set.findIndex(s => s.member === tokenId);
    if (idx >= 0) set.splice(idx, 1);
}

/**
 * Remove a token from the buffer queue.
 */
export async function removeFromBuffer(serviceId: string, tokenId: string): Promise<void> {
    const key = REDIS_KEYS.queueBuffer(serviceId);
    const set = getSortedSet(key);
    const idx = set.findIndex(s => s.member === tokenId);
    if (idx >= 0) set.splice(idx, 1);
}

/**
 * Get all token IDs in the main queue (in order).
 */
export async function getQueueMembers(serviceId: string): Promise<string[]> {
    const key = REDIS_KEYS.queueMain(serviceId);
    return getSortedSet(key).map(s => s.member);
}

/**
 * Cache a token's details in a hash.
 */
export async function cacheToken(tokenId: string, data: Record<string, string>): Promise<void> {
    const key = REDIS_KEYS.tokenCache(tokenId);
    const existing = hashStore.get(key) || {};
    hashStore.set(key, { ...existing, ...data });
}

/**
 * Get cached token details.
 */
export async function getCachedToken(tokenId: string): Promise<Record<string, string> | null> {
    const key = REDIS_KEYS.tokenCache(tokenId);
    const data = hashStore.get(key);
    return data && Object.keys(data).length > 0 ? data : null;
}

/**
 * Update queue metadata (avg service time, total served).
 */
export async function updateQueueMeta(
    serviceId: string,
    fields: { avgServiceTime?: number; totalServed?: number; lastServedAt?: string }
): Promise<void> {
    const key = REDIS_KEYS.queueMeta(serviceId);
    const existing = hashStore.get(key) || {};
    if (fields.avgServiceTime !== undefined) existing.avg_service_time = String(fields.avgServiceTime);
    if (fields.totalServed !== undefined) existing.total_served = String(fields.totalServed);
    if (fields.lastServedAt !== undefined) existing.last_served_at = fields.lastServedAt;
    hashStore.set(key, existing);
}

/**
 * Get queue metadata.
 */
export async function getQueueMeta(serviceId: string): Promise<{
    avgServiceTime: number;
    totalServed: number;
    lastServedAt: string | null;
}> {
    const data = hashStore.get(REDIS_KEYS.queueMeta(serviceId)) || {};
    return {
        avgServiceTime: parseFloat(data.avg_service_time || '0'),
        totalServed: parseInt(data.total_served || '0', 10),
        lastServedAt: data.last_served_at || null,
    };
}

/**
 * Calculate estimated wait time for a position in the queue.
 */
export async function estimateWaitTime(serviceId: string, position: number): Promise<number> {
    const meta = await getQueueMeta(serviceId);
    const avgTime = meta.avgServiceTime || 15;
    return Math.ceil(position * avgTime);
}

/**
 * Add a token to the bench queue.
 */
export async function addToBench(serviceId: string, tokenId: string): Promise<void> {
    const key = `queue:${serviceId}:bench`; // Custom key for bench
    const set = getSortedSet(key);
    // Add if not exists
    if (!set.find(s => s.member === tokenId)) {
        set.push({ member: tokenId, score: Date.now() });
        set.sort((a, b) => a.score - b.score);
    }
}

/**
 * Remove a token from the bench queue.
 */
export async function removeFromBench(serviceId: string, tokenId: string): Promise<void> {
    const key = `queue:${serviceId}:bench`;
    const set = getSortedSet(key);
    const idx = set.findIndex(s => s.member === tokenId);
    if (idx >= 0) set.splice(idx, 1);
}

/**
 * Get all token IDs in the bench queue.
 */
export async function getBenchMembers(serviceId: string): Promise<string[]> {
    const key = `queue:${serviceId}:bench`;
    return getSortedSet(key).map(s => s.member);
}

/**
 * Reset the queue for a service.
 */
export async function resetQueue(serviceId: string): Promise<void> {
    sortedSets.delete(REDIS_KEYS.queueMain(serviceId));
    sortedSets.delete(REDIS_KEYS.queueBuffer(serviceId));
    sortedSets.delete(`queue:${serviceId}:bench`);
    kvStore.delete(REDIS_KEYS.queueActive(serviceId));
    counters.delete(REDIS_KEYS.queueCounter(serviceId));
}

/**
 * Promotes a token to the absolute front of the waiting queue.
 * Sets its sorting score to 1, placing it ahead of all other standard timestamp-based tickets.
 */
export async function promoteToFrontOfQueue(serviceId: string, tokenId: string): Promise<void> {
    const key = REDIS_KEYS.queueMain(serviceId);
    const set = getSortedSet(key);
    const item = set.find(s => s.member === tokenId);
    if (item) {
        item.score = 1;
        set.sort((a, b) => a.score - b.score);
    }
}

// ========================================
// SkipQ v2 — Redis Client (In-Memory Stub)
// ========================================
// No external Redis needed. Queue ops use in-memory store.

export async function connectRedis(): Promise<void> {
    console.log('✅ Using in-memory queue store (no Redis)');
}

export async function disconnectRedis(): Promise<void> {
    // no-op
}

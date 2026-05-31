// ========================================
// SkipQ v2 — Shared Constants
// ========================================

/** Default service duration in minutes */
export const DEFAULT_SERVICE_DURATION = 15;

/** Default max tokens per service */
export const DEFAULT_MAX_TOKENS = 100;

/** Default buffer percentage */
export const DEFAULT_BUFFER_PERCENTAGE = 50;

/** Token expiry duration in minutes (how long before a booked token expires if not arrived) */
export const TOKEN_EXPIRY_MINUTES = 30;

/** Offer expiry duration in seconds */
export const OFFER_EXPIRY_SECONDS = 120;

/** Redis key patterns */
export const REDIS_KEYS = {
    /** Sorted set: main queue for a service */
    queueMain: (serviceId: string) => `queue:${serviceId}:main`,
    /** Sorted set: buffer queue for a service */
    queueBuffer: (serviceId: string) => `queue:${serviceId}:buffer`,
    /** String: currently active token ID for a service */
    queueActive: (serviceId: string) => `queue:${serviceId}:active`,
    /** String (INCR): atomic token number counter */
    queueCounter: (serviceId: string) => `queue:${serviceId}:counter`,
    /** Hash: queue metadata (avg_service_time, total_served, etc.) */
    queueMeta: (serviceId: string) => `queue:${serviceId}:meta`,
    /** Hash: cached token details */
    tokenCache: (tokenId: string) => `token:${tokenId}`,
    /** Pub/Sub channel for a service's queue updates */
    channelQueue: (serviceId: string) => `channel:queue:${serviceId}`,
    /** Pub/Sub channel for global events */
    channelGlobal: 'channel:global',
} as const;

/** WebSocket paths */
export const WS_PATHS = {
    /** WebSocket path for queue updates */
    queue: '/ws/queue',
} as const;

/** Subscription plan limits */
export const PLAN_LIMITS: Record<string, { maxDesks: number; maxBranches: number; maxServices: number }> = {
    free: { maxDesks: 1, maxBranches: 1, maxServices: 2 },
    pro: { maxDesks: 10, maxBranches: 3, maxServices: 10 },
    enterprise: { maxDesks: -1, maxBranches: -1, maxServices: -1 }, // unlimited
};

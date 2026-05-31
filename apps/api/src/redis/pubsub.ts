// ========================================
// SkipQ v2 — Pub/Sub (EventEmitter-based)
// ========================================
// Replaces Redis Pub/Sub with a local EventEmitter.

import { REDIS_KEYS, type WSEvent, type WSEventType } from '@skipq/shared';
import { EventEmitter } from 'events';

type EventHandler = (event: WSEvent) => void;

const emitter = new EventEmitter();
emitter.setMaxListeners(200);

/**
 * Publish a queue event to a service's channel.
 */
export async function publishQueueEvent(
    serviceId: string,
    type: WSEventType,
    payload: Record<string, unknown> = {}
): Promise<void> {
    const event: WSEvent = {
        type,
        serviceId,
        payload,
        timestamp: new Date().toISOString(),
    };
    const channel = REDIS_KEYS.channelQueue(serviceId);
    emitter.emit(channel, event);
}

/**
 * Subscribe to a service's queue channel.
 * Returns an unsubscribe function.
 */
export async function subscribeToQueue(
    serviceId: string,
    handler: EventHandler
): Promise<() => void> {
    const channel = REDIS_KEYS.channelQueue(serviceId);
    emitter.on(channel, handler);

    return () => {
        emitter.off(channel, handler);
    };
}

/**
 * Initialize the Pub/Sub message listener.
 * No-op for EventEmitter (it's synchronous).
 */
export function initPubSubListener(): void {
    console.log('✅ Pub/Sub listener initialized (EventEmitter)');
}

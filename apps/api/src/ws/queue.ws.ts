// ========================================
// SkipQ v2 — WebSocket Handler
// ========================================
// Elysia WebSocket that bridges Redis Pub/Sub to browser clients.
// Each client subscribes to a serviceId channel and receives live updates.

import { Elysia, t } from 'elysia';
import { subscribeToQueue } from '../redis/pubsub';
import type { WSEvent } from '@skipq/shared';

// Track active connections for metrics
let activeConnections = 0;

export const queueWebSocket = new Elysia()
    .ws('/ws/queue', {
        query: t.Object({
            serviceId: t.String({ minLength: 1 }),
        }),
        open(ws) {
            activeConnections++;
            const serviceId = ws.data.query.serviceId;
            console.log(`[WS] Client connected to service: ${serviceId} (total: ${activeConnections})`);

            // Subscribe to the Redis Pub/Sub channel for this service
            subscribeToQueue(serviceId, (event: WSEvent) => {
                ws.send(JSON.stringify(event));
            }).then((unsubscribe) => {
                // Store the unsubscribe function on the WebSocket data for cleanup
                (ws.data as any)._unsubscribe = unsubscribe;
            });
        },
        message(ws, message) {
            // Clients can send ping/pong for keepalive
            if (message === 'ping') {
                ws.send(JSON.stringify({ type: 'pong' }));
            }
        },
        close(ws) {
            activeConnections--;
            const serviceId = ws.data.query.serviceId;
            console.log(`[WS] Client disconnected from service: ${serviceId} (total: ${activeConnections})`);

            // Clean up the Redis subscription
            const unsubscribe = (ws.data as any)._unsubscribe;
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        },
    });

export function getActiveWSConnections(): number {
    return activeConnections;
}

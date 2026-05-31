// ========================================
// SkipQ v2 — Elysia Server Entry Point
// ========================================

import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { networkInterfaces } from 'os';
import { connectRedis } from './redis/client';
import { initPubSubListener } from './redis/pubsub';
import { authPlugin } from './auth/plugin';
import { queueRoutes } from './routes/queue.routes';
import { orgRoutes } from './routes/org.routes';
import { userRoutes } from './routes/user.routes';
import { deskRoutes } from './routes/desk.routes';
import { analyticsRoutes } from './routes/analytics.routes';
import { systemRoutes } from './routes/system.routes';
import { billingRoutes } from './routes/billing.routes';
import { queueWebSocket, getActiveWSConnections } from './ws/queue.ws';
import { db } from './db';

const PORT = parseInt(process.env.PORT || '3001', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Auto-detect the LAN IP address.
 */
function getLanIP(): string {
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

// --- Initialize connections ---
await connectRedis();
initPubSubListener();

// --- Clear stale desk assignments on startup (since queue is in-memory) ---
try {
    const desks = db.getAll('desks');
    for (const desk of desks) {
        if (desk.assignedOperatorId) {
            db.update('desks', { id: desk.id }, { assignedOperatorId: null });
        }
    }
    console.log('  🧹 Cleared stale desk assignments');
} catch (err) {
    console.error('  ⚠️ Failed to clear desks:', err);
}

// --- Rehydrate live queue state from DB ---
import { rehydrateAllQueues } from './db/rehydration';
await rehydrateAllQueues();

console.log('─────────────────────────────────────────');
console.log('  SkipQ v2 API — Starting...');
console.log('─────────────────────────────────────────');

const lanIP = getLanIP();

// --- Build the Elysia app ---
const app = new Elysia()
    // CORS — allow LAN access
    .use(cors({
        origin: true,  // Allow any origin for LAN access
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization'],
    }))

    // Global error handler
    .onError(({ code, error, set }) => {
        console.error(`[ERROR] ${code}:`, error.message);

        if (code === 'NOT_FOUND') {
            set.status = 404;
            return { success: false, error: 'Route not found' };
        }

        if (code === 'VALIDATION') {
            set.status = 400;
            return { success: false, error: 'Validation failed', details: error.message };
        }

        set.status = 500;
        return { success: false, error: 'Internal server error' };
    })

    // --- Auth (must come before routes that use session) ---
    .use(authPlugin)

    // --- Health check ---
    .get('/health', () => ({
        status: 'ok',
        timestamp: new Date().toISOString(),
        activeWSConnections: getActiveWSConnections(),
    }))

    // --- LAN Info endpoint (returns current IP for QR generation) ---
    .get('/api/lan-info', () => ({
        success: true,
        data: {
            lanIP,
            apiUrl: `http://${lanIP}:${PORT}`,
            frontendUrl: `http://${lanIP}:3000`,
        },
    }))

    // --- API Routes ---
    .use(queueRoutes)
    .use(orgRoutes)
    .use(userRoutes)
    .use(deskRoutes)
    .use(analyticsRoutes)
    .use(systemRoutes)
    .use(billingRoutes)

    // --- WebSocket ---
    .use(queueWebSocket)

    // --- Start (bind to 0.0.0.0 for LAN access) ---
    .listen({ port: PORT, hostname: '0.0.0.0' });

console.log(`  ✅ Server running on http://0.0.0.0:${PORT}`);
console.log(`  🌐 LAN access: http://${lanIP}:${PORT}`);
console.log(`  🔐 Auth at /api/auth/*`);
console.log(`  📡 WebSocket at ws://${lanIP}:${PORT}/ws/queue`);
console.log(`  🔗 CORS: open (LAN)`);
console.log('─────────────────────────────────────────');

// --- Graceful shutdown handlers for DB Compaction ---
function handleShutdown(signal: string) {
    console.log(`\n  🛑 Received ${signal}. Shutting down gracefully...`);
    try {
        db.compact();
    } catch (err) {
        console.error('  ⚠️ Error during DB compaction on shutdown:', err);
    }
    process.exit(0);
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

export type App = typeof app;

// ========================================
// SkipQ v2 — Platform System Diagnostic Routes
// ========================================

import { Elysia, t } from 'elysia';
import { db } from '../db';
import { compact } from '../db/store';
import { existsSync, statSync, readFileSync } from 'fs';
import { join } from 'path';
import { getActiveWSConnections } from '../ws/queue.ws';

const DATA_DIR = join(import.meta.dir, '..', '..', '.data');
const DB_FILE = join(DATA_DIR, 'db.json');
const AOF_FILE = join(DATA_DIR, 'transactions.aof');

export const systemRoutes = new Elysia({ prefix: '/api/system' })

    // --- Get Core System Stats & Telemetry ---
    .get('/stats', () => {
        try {
            const dbSize = existsSync(DB_FILE) ? statSync(DB_FILE).size : 0;
            const aofSize = existsSync(AOF_FILE) ? statSync(AOF_FILE).size : 0;

            const counts = {
                organizations: db.count('organizations'),
                branches: db.count('branches'),
                services: db.count('services'),
                desks: db.count('desks'),
                users: db.count('users'),
                tokens: db.count('tokens'),
                auditLogs: db.count('auditLogs')
            };

            const memory = process.memoryUsage();

            return {
                success: true,
                data: {
                    dbSize,
                    aofSize,
                    counts,
                    memory: {
                        heapUsed: memory.heapUsed,
                        heapTotal: memory.heapTotal,
                        rss: memory.rss,
                        external: memory.external
                    },
                    activeWebSockets: getActiveWSConnections(),
                    uptime: process.uptime()
                }
            };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    })

    // --- Manually Trigger DB Compaction ---
    .post('/compact', () => {
        try {
            compact();
            return {
                success: true,
                message: 'Database compacted and compacted snapshot saved to db.json successfully.',
                timestamp: Date.now()
            };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    })

    // --- Retrieve recent AOF transactional log entries ---
    .get('/logs', () => {
        try {
            if (!existsSync(AOF_FILE)) {
                return { success: true, data: [] };
            }

            const content = readFileSync(AOF_FILE, 'utf-8');
            const lines = content.split('\n').filter(l => l.trim().length > 0);
            
            // Return last 50 transactions
            const lastTransactions = lines.slice(-50).map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return { raw: line };
                }
            }).reverse();

            return { success: true, data: lastTransactions };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    })

    // --- Get all Clients & Tenant details ---
    .get('/clients', () => {
        try {
            const orgs = db.getAll('organizations');
            const result = orgs.map(org => {
                const branches = db.find('branches', { organizationId: org.id });
                const branchIds = branches.map(b => b.id);
                const services = db.getAll('services').filter(s => branchIds.includes(s.branchId));
                
                return {
                    id: org.id,
                    name: org.name,
                    slug: org.slug || org.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    branchesCount: branches.length,
                    servicesCount: services.length,
                    createdAt: org.createdAt
                };
            });

            return { success: true, data: result };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    })

    // --- Get all records of a specific table ---
    .get('/table/:tableName', ({ params }) => {
        try {
            const { tableName } = params;
            const records = db.getAll(tableName as any);
            return { success: true, data: records };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        params: t.Object({ tableName: t.String() })
    })

    // --- Delete a specific record from a table ---
    .delete('/table/:tableName/:id', ({ params }) => {
        try {
            const { tableName, id } = params;
            const removed = db.remove(tableName as any, { id });
            return { success: true, removed };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        params: t.Object({ tableName: t.String(), id: t.String() })
    });

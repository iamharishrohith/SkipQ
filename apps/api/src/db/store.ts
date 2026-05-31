// ========================================
// SkipQ v2 — Custom High-Performance DB Engine (SkipQ-DB)
// ========================================
// In-memory data store with sub-millisecond write performance.
// Features Append-Only File (AOF) transaction logging for crash recovery
// and automatic startup log replay/compaction.

import { randomUUID } from 'crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(import.meta.dir, '..', '..', '.data');
const DB_FILE = join(DATA_DIR, 'db.json');
const AOF_FILE = join(DATA_DIR, 'transactions.aof');

export interface StoreSchema {
    organizations: Record<string, any>[];
    branches: Record<string, any>[];
    services: Record<string, any>[];
    desks: Record<string, any>[];
    users: Record<string, any>[];
    orgMembers: Record<string, any>[];
    tokens: Record<string, any>[];
    auditLogs: Record<string, any>[];
    // Better Auth tables
    user: Record<string, any>[];
    session: Record<string, any>[];
    account: Record<string, any>[];
    verification: Record<string, any>[];
    packages: Record<string, any>[];
    supportTickets: Record<string, any>[];
    feedbacks: Record<string, any>[];
    spotOffers: Record<string, any>[];
    upiTransactions: Record<string, any>[];
}

const EMPTY_DB: StoreSchema = {
    organizations: [],
    branches: [],
    services: [],
    desks: [],
    users: [],
    orgMembers: [],
    tokens: [],
    auditLogs: [],
    user: [],
    session: [],
    account: [],
    verification: [],
    packages: [],
    supportTickets: [],
    feedbacks: [],
    spotOffers: [],
    upiTransactions: [],
};

let data: StoreSchema;

/**
 * Replays a logged transaction on an in-memory StoreSchema instance.
 */
function replayWrite(base: StoreSchema, op: string, table: keyof StoreSchema, payload: any): void {
    if (!base[table]) base[table] = [];

    if (op === 'insert') {
        // Prevent duplicate IDs during replay
        base[table] = base[table].filter((r: any) => r.id !== payload.id);
        base[table].push(payload);
    } else if (op === 'update') {
        const { filter, updates } = payload;
        base[table] = base[table].map((row: any) => {
            const matches = Object.entries(filter).every(([key, val]) => row[key] === val);
            if (matches) {
                return { ...row, ...updates };
            }
            return row;
        });
    } else if (op === 'remove') {
        const { filter } = payload;
        base[table] = base[table].filter((row: any) =>
            !Object.entries(filter).every(([key, val]) => row[key] === val)
        );
    } else if (op === 'setRawData') {
        Object.assign(base, payload);
    }
}

/**
 * Appends a structured transaction to the AOF log file.
 */
function logTransaction(op: string, table: keyof StoreSchema, payload: any): void {
    try {
        const line = JSON.stringify({ op, table, payload, timestamp: Date.now() }) + '\n';
        appendFileSync(AOF_FILE, line, 'utf-8');
    } catch (err) {
        console.error('⚠️ Failed to append to AOF transaction log:', err);
    }
}

/**
 * Perform database compaction: write current state to db.json and truncate transactions.aof.
 */
export function compact(): void {
    try {
        console.log('📦 Compacting database snapshot...');
        writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        writeFileSync(AOF_FILE, '', 'utf-8');
        console.log('✅ Database snapshot compaction complete.');
    } catch (err) {
        console.error('⚠️ Database compaction failed:', err);
    }
}

/**
 * Initialize and rehydrate the in-memory database state.
 */
function initDB(): StoreSchema {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

    let base: StoreSchema;
    if (existsSync(DB_FILE)) {
        try {
            base = JSON.parse(readFileSync(DB_FILE, 'utf-8'));
        } catch (e) {
            console.error('⚠️ Failed to parse db.json, starting fresh:', e);
            base = structuredClone(EMPTY_DB);
        }
    } else {
        base = structuredClone(EMPTY_DB);
    }

    // Ensure all tables are present
    for (const key of Object.keys(EMPTY_DB) as (keyof StoreSchema)[]) {
        if (!base[key]) base[key] = [];
    }

    // Seed default subscription packages if empty
    if (base.packages.length === 0) {
        base.packages = [
            {
                id: 'starter',
                name: 'Starter Plan',
                monthlyPrice: 1999,
                maxBranches: 1,
                maxDesks: 2,
                features: ['1 Physical Branch', '2 Counter Desks', 'Standard Email Support', 'Basic Waiting Statistics']
            },
            {
                id: 'pro',
                name: 'Professional Plan',
                monthlyPrice: 4999,
                maxBranches: 3,
                maxDesks: 6,
                features: ['3 Branch Networks', '6 Counter Desks', 'Prioritized Desk Approvals', 'Live WebSocket Telemetry', 'SMS Integration Ready']
            },
            {
                id: 'enterprise',
                name: 'Enterprise Plus',
                monthlyPrice: 12999,
                maxBranches: 99,
                maxDesks: 99,
                features: ['Unlimited Branches & Desks', 'Instant 5-Min Desk Approvals', 'Custom Customer Review Forms', 'Priority Phone Support', 'Dedicated Account Manager']
            }
        ];
    }

    // Seed localized waiting room Spot-Offers if empty
    if (base.spotOffers.length === 0) {
        base.spotOffers = [
            {
                id: 'spot-med-folder',
                category: 'medical',
                title: 'OPD Health File Folder',
                description: 'Splash-proof secure portfolio to organize doctor prescription slips and diagnostics logs.',
                price: 149,
                imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300'
            },
            {
                id: 'spot-sevai-guard',
                category: 'e-sevai',
                title: 'Certificate Lamination Guard',
                description: 'Heavy duty military-grade transparent lamination pouch guarding documents from tearing/water.',
                price: 49,
                imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300'
            },
            {
                id: 'spot-salon-mask',
                category: 'salon',
                title: 'Charcoal Face Mask Upgrade',
                description: 'Invigorating cooling peel-off charcoal mask applied directly while you wait for styling shifts.',
                price: 199,
                imageUrl: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=300'
            },
            {
                id: 'spot-dine-samosa',
                category: 'dining',
                title: 'Hot Samosa & Ginger Chai Combo',
                description: 'Pair of crispy, warm potato samosas served with aromatic cardamon ginger tea straight to your queue seat.',
                price: 59,
                imageUrl: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=300'
            },
            {
                id: 'spot-trans-case',
                category: 'transport',
                title: 'Premium Smartcard RFID Case',
                description: 'Anti-scan protective sleeve defending metro/transit smartcards from digital pickpocketing scans.',
                price: 99,
                imageUrl: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=300'
            },
            {
                id: 'spot-auto-cloth',
                category: 'automobile',
                title: 'High-Density Microfiber Cloth',
                description: 'Super absorbent, lint-free double plush microfiber towel ideal for dashboard and vehicle body dusting.',
                price: 129,
                imageUrl: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=300'
            }
        ];
    }

    // Replay transactions.aof if it exists
    if (existsSync(AOF_FILE)) {
        console.log('🔄 Replaying transactions from append-only log...');
        try {
            const logs = readFileSync(AOF_FILE, 'utf-8').split('\n');
            let replayCount = 0;
            for (const line of logs) {
                if (!line.trim()) continue;
                const { op, table, payload } = JSON.parse(line);
                replayWrite(base, op, table, payload);
                replayCount++;
            }
            console.log(`✅ Successfully replayed ${replayCount} transactions.`);
        } catch (err) {
            console.error('⚠️ Failed to replay transaction log:', err);
        }

        // Compact immediately on startup to merge replayed changes
        try {
            writeFileSync(DB_FILE, JSON.stringify(base, null, 2));
            writeFileSync(AOF_FILE, '', 'utf-8');
            console.log('📦 AOF transaction log compacted on startup.');
        } catch (err) {
            console.error('⚠️ Failed to compact log on startup:', err);
        }
    }

    return base;
}

// Rehydrate database on import
data = initDB();

/**
 * Get all rows from a table.
 */
export function getAll(table: keyof StoreSchema): any[] {
    return data[table] || [];
}

/**
 * Find rows matching a filter.
 */
export function find(table: keyof StoreSchema, filter: Record<string, any>): any[] {
    return getAll(table).filter(row =>
        Object.entries(filter).every(([key, val]) => row[key] === val)
    );
}

/**
 * Find a single row by filter.
 */
export function findOne(table: keyof StoreSchema, filter: Record<string, any>): any | null {
    return find(table, filter)[0] || null;
}

/**
 * Find a single row by id.
 */
export function findById(table: keyof StoreSchema, id: string): any | null {
    return (data[table] || []).find((r: any) => r.id === id) || null;
}

/**
 * Insert a row, auto-generating id and timestamps.
 */
export function insert(table: keyof StoreSchema, row: Record<string, any>): any {
    const now = new Date().toISOString();
    const record = {
        id: row.id || randomUUID(),
        ...row,
        createdAt: row.createdAt || now,
        updatedAt: row.updatedAt || now,
    };
    if (!data[table]) data[table] = [];
    data[table].push(record);
    logTransaction('insert', table, record);
    return record;
}

/**
 * Update rows matching a filter.
 */
export function update(table: keyof StoreSchema, filter: Record<string, any>, updates: Record<string, any>): any[] {
    const now = new Date().toISOString();
    const updated: any[] = [];
    data[table] = (data[table] || []).map((row: any) => {
        const matches = Object.entries(filter).every(([key, val]) => row[key] === val);
        if (matches) {
            const newRow = { ...row, ...updates, updatedAt: now };
            updated.push(newRow);
            return newRow;
        }
        return row;
    });
    if (updated.length > 0) {
        logTransaction('update', table, { filter, updates: { ...updates, updatedAt: now } });
    }
    return updated;
}

/**
 * Delete rows matching a filter.
 */
export function remove(table: keyof StoreSchema, filter: Record<string, any>): number {
    const before = data[table]?.length || 0;
    data[table] = (data[table] || []).filter((row: any) =>
        !Object.entries(filter).every(([key, val]) => row[key] === val)
    );
    const removed = before - (data[table]?.length || 0);
    if (removed > 0) {
        logTransaction('remove', table, { filter });
    }
    return removed;
}

/**
 * Count rows matching a filter.
 */
export function count(table: keyof StoreSchema, filter?: Record<string, any>): number {
    if (!filter) return data[table]?.length || 0;
    return find(table, filter).length;
}

/**
 * Get the raw store data (for Better Auth adapter).
 */
export function getRawData(): StoreSchema {
    return data;
}

/**
 * Set the raw store data (for Better Auth adapter).
 */
export function setRawData(newData: StoreSchema): void {
    data = newData;
    logTransaction('setRawData', 'user', newData);
    compact(); // Raw replacements consolidate snapshot immediately
}

export { randomUUID };

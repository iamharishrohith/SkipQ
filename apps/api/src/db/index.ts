// ========================================
// SkipQ v2 — Database (JSON File Store)
// ========================================
// Drop-in replacement for Drizzle/PostgreSQL.
// Re-exports the JSON store as `db`.

export * as db from './store';
export type Database = typeof import('./store');

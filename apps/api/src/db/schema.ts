// ========================================
// SkipQ v2 — Drizzle PostgreSQL Schema
// ========================================

import { pgTable, uuid, text, varchar, integer, decimal, boolean, timestamp, jsonb, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- Enums ---

export const orgPlanEnum = pgEnum('org_plan', ['free', 'pro', 'enterprise']);
export const userRoleEnum = pgEnum('user_role', ['super_admin', 'org_admin', 'operator', 'customer']);
export const memberRoleEnum = pgEnum('member_role', ['admin', 'operator']);
export const deskTypeEnum = pgEnum('desk_type', ['free', 'paid', 'vip']);
export const tokenStatusEnum = pgEnum('token_status', ['booked', 'waiting', 'active', 'completed', 'cancelled', 'no_show']);
export const queueTypeEnum = pgEnum('queue_type', ['main', 'buffer', 'vip']);

// --- Tables ---

export const organizations = pgTable('organizations', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    plan: orgPlanEnum('plan').notNull().default('free'),
    branding: jsonb('branding'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const branches = pgTable('branches', {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    address: text('address'),
    operatingHours: jsonb('operating_hours'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const services = pgTable('services', {
    id: uuid('id').primaryKey().defaultRandom(),
    branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    estimatedDurationMin: integer('estimated_duration_min').notNull().default(15),
    maxTokens: integer('max_tokens').notNull().default(100),
    deskType: deskTypeEnum('desk_type').notNull().default('free'),
    tokenPrice: decimal('token_price', { precision: 10, scale: 2 }).notNull().default('0'),
    operatingHours: jsonb('operating_hours'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const desks = pgTable('desks', {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceId: uuid('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    assignedOperatorId: uuid('assigned_operator_id').references(() => users.id, { onDelete: 'set null' }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    phone: varchar('phone', { length: 20 }),
    role: userRoleEnum('role').notNull().default('customer'),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const orgMembers = pgTable('org_members', {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    role: memberRoleEnum('role').notNull().default('operator'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    uniqueMember: uniqueIndex('unique_org_member').on(table.orgId, table.userId),
}));

export const tokens = pgTable('tokens', {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceId: uuid('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
    deskId: uuid('desk_id').references(() => desks.id, { onDelete: 'set null' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    tokenNumber: integer('token_number').notNull(),
    status: tokenStatusEnum('status').notNull().default('booked'),
    queueType: queueTypeEnum('queue_type').notNull().default('main'),
    bookedAt: timestamp('booked_at', { withTimezone: true }).notNull().defaultNow(),
    arrivedAt: timestamp('arrived_at', { withTimezone: true }),
    serviceStartTime: timestamp('service_start_time', { withTimezone: true }),
    serviceEndTime: timestamp('service_end_time', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
});

export const auditLogs = pgTable('audit_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 100 }).notNull(),
    details: jsonb('details'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Relations ---

export const organizationsRelations = relations(organizations, ({ many }) => ({
    branches: many(branches),
    members: many(orgMembers),
    auditLogs: many(auditLogs),
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
    organization: one(organizations, { fields: [branches.orgId], references: [organizations.id] }),
    services: many(services),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
    branch: one(branches, { fields: [services.branchId], references: [branches.id] }),
    desks: many(desks),
    tokens: many(tokens),
}));

export const desksRelations = relations(desks, ({ one, many }) => ({
    service: one(services, { fields: [desks.serviceId], references: [services.id] }),
    assignedOperator: one(users, { fields: [desks.assignedOperatorId], references: [users.id] }),
    tokens: many(tokens),
}));

export const usersRelations = relations(users, ({ many }) => ({
    memberships: many(orgMembers),
    tokens: many(tokens),
}));

export const orgMembersRelations = relations(orgMembers, ({ one }) => ({
    organization: one(organizations, { fields: [orgMembers.orgId], references: [organizations.id] }),
    user: one(users, { fields: [orgMembers.userId], references: [users.id] }),
}));

export const tokensRelations = relations(tokens, ({ one }) => ({
    service: one(services, { fields: [tokens.serviceId], references: [services.id] }),
    desk: one(desks, { fields: [tokens.deskId], references: [desks.id] }),
    user: one(users, { fields: [tokens.userId], references: [users.id] }),
}));

// ========================================
// SkipQ v2 — Shared Type Definitions
// ========================================

// --- Enums ---

export const ORG_PLANS = ['free', 'pro', 'enterprise'] as const;
export type OrgPlan = (typeof ORG_PLANS)[number];

export const USER_ROLES = ['super_admin', 'org_admin', 'operator', 'customer'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const MEMBER_ROLES = ['admin', 'operator'] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export const DESK_TYPES = ['free', 'paid', 'vip'] as const;
export type DeskType = (typeof DESK_TYPES)[number];

export const TOKEN_STATUSES = ['booked', 'waiting', 'active', 'completed', 'cancelled', 'no_show'] as const;
export type TokenStatus = (typeof TOKEN_STATUSES)[number];

export const QUEUE_TYPES = ['main', 'buffer', 'vip'] as const;
export type QueueType = (typeof QUEUE_TYPES)[number];

// --- Entity Types ---

export interface Organization {
    id: string;
    name: string;
    slug: string;
    plan: OrgPlan;
    branding: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface Branch {
    id: string;
    orgId: string;
    name: string;
    address: string | null;
    operatingHours: OperatingHours | null;
    isActive: boolean;
    createdAt: Date;
}

export interface Service {
    id: string;
    branchId: string;
    name: string;
    description: string | null;
    estimatedDurationMin: number;
    maxTokens: number;
    deskType: DeskType;
    tokenPrice: number;
    operatingHours: OperatingHours | null;
    isActive: boolean;
    createdAt: Date;
}

export interface Desk {
    id: string;
    serviceId: string;
    name: string;
    assignedOperatorId: string | null;
    isActive: boolean;
    createdAt: Date;
}

export interface User {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: UserRole;
    createdAt: Date;
}

export interface OrgMember {
    id: string;
    orgId: string;
    userId: string;
    role: MemberRole;
    createdAt: Date;
}

export interface Token {
    id: string;
    serviceId: string;
    deskId: string | null;
    userId: string;
    tokenNumber: number;
    status: TokenStatus;
    queueType: QueueType;
    bookedAt: Date;
    arrivedAt: Date | null;
    serviceStartTime: Date | null;
    serviceEndTime: Date | null;
    cancelledAt: Date | null;
}

// --- Utility Types ---

export interface OperatingHours {
    start: string; // "09:00"
    end: string;   // "17:00"
}

export interface QueueState {
    serviceId: string;
    serviceName: string;
    currentlyServing: number | null;
    totalWaiting: number;
    estimatedWaitMinutes: number;
    isOpen: boolean;
    waitingTokens: string[];
    benchTokens: string[];
    bufferCount: number;
}

export interface TokenBookingResult {
    tokenId: string;
    tokenNumber: number;
    position: number;
    estimatedWaitMinutes: number;
}

// --- WebSocket Event Types ---

export type WSEventType =
    | 'QUEUE_UPDATED'
    | 'TOKEN_CALLED'
    | 'TOKEN_COMPLETED'
    | 'QUEUE_OPENED'
    | 'QUEUE_CLOSED';

export interface WSEvent {
    type: WSEventType;
    serviceId: string;
    payload: Record<string, unknown>;
    timestamp: string;
}

// --- API Response Types ---

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

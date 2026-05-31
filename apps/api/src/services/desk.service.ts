// ========================================
// SkipQ v2 — Desk Assignment Service
// ========================================

import { db } from '../db';

/**
 * Assign an operator (by name) to a desk.
 */
export async function assignOperatorToDesk(deskId: string, operatorName: string): Promise<any> {
    const desk = db.findOne('desks', { id: deskId });
    if (!desk) throw new Error('Desk not found');

    const updated = db.update('desks', { id: deskId }, {
        assignedOperatorId: operatorName, // using name as identifier for simplicity
        isActive: true,
    });
    return updated[0] || null;
}

/**
 * Unassign an operator from a desk.
 */
export async function unassignOperator(deskId: string): Promise<any> {
    const updated = db.update('desks', { id: deskId }, { assignedOperatorId: null });
    return updated[0] || null;
}

/**
 * Get all desks for a service with operator info.
 */
export async function getDesksWithOperators(serviceId: string): Promise<any[]> {
    const deskList = db.find('desks', { serviceId });
    return deskList.map(desk => ({
        ...desk,
        operatorName: desk.assignedOperatorId || null,
    }));
}

/**
 * Toggle desk active status.
 */
export async function toggleDeskStatus(deskId: string, isActive?: boolean): Promise<any> {
    const desk = db.findOne('desks', { id: deskId });
    if (!desk) throw new Error('Desk not found');

    const newStatus = isActive !== undefined ? isActive : !desk.isActive;
    const updated = db.update('desks', { id: deskId }, { isActive: newStatus });
    return updated[0] || null;
}

/**
 * Get a single desk by ID.
 */
export async function getDeskById(deskId: string): Promise<any> {
    return db.findOne('desks', { id: deskId });
}

/**
 * Login to a desk by desk ID and operator name. Returns the desk + its service.
 */
export async function deskLogin(deskId: string, operatorName: string): Promise<any> {
    const desk = db.findOne('desks', { id: deskId });
    if (!desk) throw new Error('Desk not found');

    // Assign operator
    db.update('desks', { id: deskId }, { assignedOperatorId: operatorName, isActive: true });

    // Get the service info
    const service = db.findOne('services', { id: desk.serviceId });

    return {
        desk: { ...desk, assignedOperatorId: operatorName, isActive: true },
        service,
    };
}

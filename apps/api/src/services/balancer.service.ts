// ========================================
// SkipQ v2 — Deterministic Load Balancer & Dispatcher (LBTDA)
// ========================================

import { db } from '../db';
import * as queueRedis from '../redis/queue.redis';
import { publishQueueEvent } from '../redis/pubsub';

interface QueueMetrics {
    serviceId: string;
    serviceName: string;
    waitingCount: number;
    avgServiceTimeMin: number;
    totalWaitDelayMin: number;
}

/**
 * Calculates real-time queue delay metrics for a given service.
 */
export async function getQueueMetrics(serviceId: string): Promise<QueueMetrics> {
    const service = db.findOne('services', { id: serviceId });
    const serviceName = service?.name || 'Unknown Queue';
    
    // Count waiting tokens in JSON store
    const waitingCount = db.count('tokens', { serviceId, status: 'waiting' });
    
    // Fetch average service duration from Redis metadata or fallback to service default
    const meta = await queueRedis.getQueueMeta(serviceId);
    const avgServiceTimeMin = meta.avgServiceTime || service?.estimatedDurationMin || 10;
    
    // Calculate total wait delay metric
    const totalWaitDelayMin = waitingCount * avgServiceTimeMin;

    return {
        serviceId,
        serviceName,
        waitingCount,
        avgServiceTimeMin,
        totalWaitDelayMin
    };
}

/**
 * Deterministic Balancer Dispatcher:
 * Automatically re-routes operators to serve bottlenecked queues in the same branch
 * if the bottleneck wait delay exceeds 2.5x of the operator's primary queue.
 */
/**
 * Deterministic Balancer Dispatcher (SkipQ-LBTDA Pro):
 * Automatically re-routes operator lanes to serve bottlenecked queues in the same branch
 * based on dynamic Target SLAs, Token Triage Scores, and overall Queue Bottleneck Indices (QBI).
 * Strictly non-AI, mathematically predictable, and fully automated.
 */
export async function getNextBalancedToken(
    serviceId: string,
    operatorName: string
): Promise<{ token: any | null; balanced: boolean; originalServiceName?: string }> {
    const primaryService = db.findOne('services', { id: serviceId });
    if (!primaryService) {
        return { token: null, balanced: false };
    }

    // 1. Determine target SLA (in minutes) based on queue service name / category keywords
    const getTargetSlaMinutes = (name: string): number => {
        const lower = name.toLowerCase();
        if (lower.includes('med') || lower.includes('opd') || lower.includes('clinic') || lower.includes('consult')) return 15;
        if (lower.includes('sevai') || lower.includes('aadhaar') || lower.includes('pan') || lower.includes('record')) return 20;
        if (lower.includes('salon') || lower.includes('hair') || lower.includes('groom')) return 30;
        if (lower.includes('dine') || lower.includes('table') || lower.includes('restaurant')) return 20;
        if (lower.includes('ticket') || lower.includes('transit') || lower.includes('board') || lower.includes('transport')) return 10;
        if (lower.includes('auto') || lower.includes('wash') || lower.includes('vehicle') || lower.includes('repair')) return 40;
        return 20; // Default fallback SLA
    };

    const primarySlaMin = getTargetSlaMinutes(primaryService.name);

    // Helper to calculate Queue Bottleneck Index (QBI) & retrieve tokens
    const calculateQueueMetrics = async (svc: any) => {
        const waitingTokens = db.find('tokens', { serviceId: svc.id, status: 'waiting' });
        const activeDesks = db.count('desks', { serviceId: svc.id, isActive: true });
        
        const slaMin = getTargetSlaMinutes(svc.name);
        let maxTokenTriageScore = 0;
        let highestTriageToken: any = null;

        for (const token of waitingTokens) {
            const waitTimeMs = Date.now() - new Date(token.bookedAt).getTime();
            const waitTimeMin = waitTimeMs / 60000;
            const slaRatio = waitTimeMin / slaMin;

            // Mathematical triage score weight: wait-ratio, Fast-Pass premium boost, and group size complexity
            const fastPassMultiplier = token.isFastPass ? 1.8 : 1.0;
            const groupComplexity = token.groupSize > 1 ? 1.0 + (token.groupSize - 1) * 0.12 : 1.0;
            const tokenTriageScore = slaRatio * fastPassMultiplier * groupComplexity;

            if (tokenTriageScore > maxTokenTriageScore) {
                maxTokenTriageScore = tokenTriageScore;
                highestTriageToken = token;
            }
        }

        // QBI = Max(TokenTriageScore) * (1.0 + wait_count / (active_desks + 1))
        const qbi = maxTokenTriageScore * (1.0 + waitingTokens.length / (activeDesks + 1));

        return {
            serviceId: svc.id,
            serviceName: svc.name,
            waitingCount: waitingTokens.length,
            activeDesks,
            maxTriageScore: maxTokenTriageScore,
            highestTriageToken,
            qbi
        };
    };

    // 2. Compute metrics for the primary queue
    const primaryMetrics = await calculateQueueMetrics(primaryService);

    // 3. Fetch all other active services under the same branch
    const branchServices = db.find('services', { branchId: primaryService.branchId, isActive: true });
    const peerMetrics: Array<Awaited<ReturnType<typeof calculateQueueMetrics>>> = [];

    for (const s of branchServices) {
        if (s.id !== serviceId) {
            const metrics = await calculateQueueMetrics(s);
            peerMetrics.push(metrics);
        }
    }

    // 4. Bottleneck Detection & SLA mitigation re-routing triage
    // If a peer queue has a critical Queue Bottleneck Index (QBI >= 2.0) and the primary queue has a lower index
    const primaryQBI = primaryMetrics.qbi;
    
    let worstPeer: typeof peerMetrics[0] | null = null;
    for (const peer of peerMetrics) {
        // Must have waiting tokens and have violated target SLA bottleneck limits (QBI >= 2.0)
        // Also must be more bottlenecked than the operator's primary queue lane
        if (peer.waitingCount > 0 && peer.qbi >= 2.0 && peer.qbi > primaryQBI * 1.5) {
            if (!worstPeer || peer.qbi > worstPeer.qbi) {
                worstPeer = peer;
            }
        }
    }

    // 5. BALANCING DISPATCH RE-ROUTE ACTION
    if (worstPeer && worstPeer.highestTriageToken) {
        const token = worstPeer.highestTriageToken;
        
        // Dequeue from Redis line
        await queueRedis.removeFromQueue(worstPeer.serviceId, token.id);
        
        const now = new Date().toISOString();
        
        // Deterministic Re-route: update status to active and dynamically bind to this operator's service lane
        db.update('tokens', { id: token.id }, {
            status: 'active',
            serviceStartTime: now,
            originalServiceId: token.serviceId, // track original service for metrics audits
            serviceId: primaryService.id, // bind to current active operator service lane
        });

        await queueRedis.setActiveToken(primaryService.id, token.id);
        
        // Update fast lookup cache
        await queueRedis.cacheToken(token.id, {
            status: 'active',
            serviceStartTime: now,
            serviceId: primaryService.id,
        });

        const mathDetails = {
            formula: "QBI = Max(TokenTriageScore) * (1.0 + wait_count / (active_desks + 1))",
            targetSLA: getTargetSlaMinutes(worstPeer.serviceName) + " min",
            maxTokenTriageScore: worstPeer.maxTriageScore.toFixed(3),
            peerQBI: worstPeer.qbi.toFixed(3),
            primaryQBI: primaryQBI.toFixed(3)
        };

        // Write re-routing audit log in db with mathematical verification details
        db.insert('auditLogs', {
            type: 'balancer_auto_route',
            message: `Auto-routed Token #${token.tokenNumber} from '${worstPeer.serviceName}' to '${primaryService.name}' (Operator: ${operatorName}) due to SLA breach (QBI: ${worstPeer.qbi.toFixed(2)}).`,
            details: {
                tokenId: token.id,
                tokenNumber: token.tokenNumber,
                fromServiceId: worstPeer.serviceId,
                fromServiceName: worstPeer.serviceName,
                toServiceId: primaryService.id,
                toServiceName: primaryService.name,
                operatorName,
                ...mathDetails
            }
        });

        // Notify websockets
        await publishQueueEvent(worstPeer.serviceId, 'QUEUE_UPDATED', {
            action: 'balanced_out',
            tokenId: token.id,
        });

        await publishQueueEvent(primaryService.id, 'TOKEN_CALLED', {
            tokenId: token.id,
        });

        const updatedToken = db.findOne('tokens', { id: token.id });

        return {
            token: updatedToken,
            balanced: true,
            originalServiceName: worstPeer.serviceName
        };
    }

    // 6. FALLBACK: Normal allocation from primary queue
    const nextTokenId = await queueRedis.dequeueNextToken(primaryService.id);
    
    if (nextTokenId) {
        const now = new Date().toISOString();
        db.update('tokens', { id: nextTokenId }, {
            status: 'active',
            serviceStartTime: now,
        });

        await queueRedis.setActiveToken(primaryService.id, nextTokenId);

        await queueRedis.cacheToken(nextTokenId, {
            status: 'active',
            serviceStartTime: now,
        });

        await publishQueueEvent(primaryService.id, 'TOKEN_CALLED', {
            tokenId: nextTokenId,
        });

        const token = db.findOne('tokens', { id: nextTokenId });
        
        return { token, balanced: false };
    }

    return { token: null, balanced: false };
}

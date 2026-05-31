// ========================================
// SkipQ v2 — WebSocket Hook
// ========================================
// Custom React hook for connecting to the Elysia WebSocket

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { WSEvent } from '@skipq/shared';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

interface UseQueueWSOptions {
    serviceId: string;
    onEvent?: (event: WSEvent) => void;
    enabled?: boolean;
}

export function useQueueWS({ serviceId, onEvent, enabled = true }: UseQueueWSOptions) {
    const [isConnected, setIsConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState<WSEvent | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onEventRef = useRef(onEvent);
    onEventRef.current = onEvent;

    const connect = useCallback(() => {
        if (!enabled || !serviceId) return;

        const url = `${WS_URL}/ws/queue?serviceId=${encodeURIComponent(serviceId)}`;
        const ws = new WebSocket(url);

        ws.onopen = () => {
            setIsConnected(true);
            console.log(`[WS] Connected to service: ${serviceId}`);
        };

        ws.onmessage = (event) => {
            try {
                const data: WSEvent = JSON.parse(event.data);
                setLastEvent(data);
                onEventRef.current?.(data);
            } catch {
                // Ignore non-JSON messages (pong, etc.)
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
            console.log('[WS] Disconnected. Reconnecting in 3s...');
            reconnectTimerRef.current = setTimeout(connect, 3000);
        };

        ws.onerror = (err) => {
            console.error('[WS] Error:', err);
            ws.close();
        };

        wsRef.current = ws;
    }, [serviceId, enabled]);

    useEffect(() => {
        connect();
        return () => {
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            wsRef.current?.close();
        };
    }, [connect]);

    const sendPing = useCallback(() => {
        wsRef.current?.send('ping');
    }, []);

    return { isConnected, lastEvent, sendPing };
}

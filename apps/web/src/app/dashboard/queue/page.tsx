'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { useQueueWS } from '@/hooks/useQueueWS';
import styles from '../../queue.module.css';
import type { QueueState } from '@skipq/shared';

export default function OperatorQueuePage() {
    const [serviceId, setServiceId] = useState('');
    const [queueState, setQueueState] = useState<QueueState | null>(null);
    const [loading, setLoading] = useState(false);
    const [calling, setCalling] = useState(false);

    // Get serviceId from URL params
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            setServiceId(params.get('serviceId') || '');
        }
    }, []);

    const fetchState = useCallback(async () => {
        if (!serviceId) return;
        setLoading(true);
        const res = await apiGet<QueueState>(`/api/queue/state/${serviceId}`);
        if (res.success && res.data) {
            setQueueState(res.data);
        }
        setLoading(false);
    }, [serviceId]);

    // Real-time updates
    useQueueWS({
        serviceId,
        enabled: !!serviceId,
        onEvent: () => fetchState(),
    });

    useEffect(() => {
        fetchState();
    }, [fetchState]);

    const handleCallNext = async () => {
        if (!serviceId) return;
        setCalling(true);
        await apiPost('/api/queue/next', { serviceId });
        await fetchState();
        setCalling(false);
    };

    const handleNoShow = async (tokenId: string) => {
        await apiPost('/api/queue/no-show', { tokenId });
        await fetchState();
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>Operator View</h1>
                    <p className="text-secondary" style={{ fontSize: 'var(--fs-sm)' }}>
                        {queueState?.serviceName || 'Select a service'}{' '}
                        <span className="live-dot" style={{ display: 'inline-block' }} />
                    </p>
                </div>
            </div>

            <div className={styles['operator-view']}>
                {/* Left Panel — Current Token + Call Next */}
                <div className={styles['operator-panel']}>
                    <div className={styles['operator-panel-header']}>
                        <i className="fas fa-user-check" /> Currently Serving
                    </div>

                    <div className={styles['current-token-display']}>
                        {queueState?.currentlyServing ? (
                            <>
                                <div className={styles['current-number']}>
                                    {queueState.currentlyServing}
                                </div>
                                <div className={styles['current-label']}>Token Number</div>
                            </>
                        ) : (
                            <>
                                <div className={styles['current-number']} style={{ fontSize: '2rem', opacity: 0.5 }}>
                                    —
                                </div>
                                <div className={styles['current-label']}>No active token</div>
                            </>
                        )}
                    </div>

                    <div style={{ padding: 'var(--space-md) var(--space-lg) var(--space-lg)' }}>
                        <button
                            className={styles['call-next-btn']}
                            onClick={handleCallNext}
                            disabled={calling}
                        >
                            {calling ? (
                                <><i className="fas fa-spinner fa-spin" /> Calling...</>
                            ) : (
                                <><i className="fas fa-forward-step" /> Call Next</>
                            )}
                        </button>
                    </div>

                    {queueState?.currentlyServing && (
                        <div className={styles['action-buttons']}>
                            <button className="btn btn-secondary" onClick={handleCallNext}>
                                <i className="fas fa-check" /> Complete & Next
                            </button>
                            <button className="btn btn-danger" onClick={() => { }}>
                                <i className="fas fa-ghost" /> No Show
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Panel — Queue Status */}
                <div className={styles['operator-panel']}>
                    <div className={styles['operator-panel-header']}>
                        <i className="fas fa-users-line" /> Queue Status
                    </div>

                    <div style={{ padding: 'var(--space-lg)' }}>
                        <div className="grid-2" style={{ gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                            <div className="stat-card">
                                <span className="stat-label">Waiting</span>
                                <span className="stat-value" style={{ fontSize: 'var(--fs-2xl)' }}>
                                    {queueState?.totalWaiting ?? 0}
                                </span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Est. Wait</span>
                                <span className="stat-value" style={{ fontSize: 'var(--fs-2xl)' }}>
                                    {queueState?.estimatedWaitMinutes ?? 0}m
                                </span>
                            </div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <span className={`badge ${queueState?.isOpen ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 'var(--fs-sm)', padding: '0.4rem 1rem' }}>
                                {queueState?.isOpen ? (
                                    <><span className="live-dot" /> Queue Open</>
                                ) : (
                                    <>Queue Closed</>
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

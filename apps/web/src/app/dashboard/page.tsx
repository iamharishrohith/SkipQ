'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './dashboard.module.css';
import { apiGet, apiPost } from '@/lib/api';

// Simplified state type to avoid import issues
interface DashboardQueueState {
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

interface ServiceInfo {
    id: string;
    name: string;
    branchId: string;
    isActive: boolean;
}

export default function DashboardOverview() {
    const [queueState, setQueueState] = useState<DashboardQueueState | null>(null);
    const [services, setServices] = useState<ServiceInfo[]>([]);
    const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch available services on mount
    useEffect(() => {
        const loadServices = async () => {
            try {
                // Get all branches first, then services for each
                const branchRes = await apiGet<any[]>('/api/org/branches');
                if (branchRes.success && branchRes.data && branchRes.data.length > 0) {
                    const branchId = branchRes.data[0].id;
                    const serviceRes = await apiGet<ServiceInfo[]>(`/api/org/branches/${branchId}/services`);
                    if (serviceRes.success && serviceRes.data && serviceRes.data.length > 0) {
                        setServices(serviceRes.data);
                        // Check URL for serviceId, otherwise use the first service
                        const urlParams = new URLSearchParams(window.location.search);
                        const urlServiceId = urlParams.get('serviceId');
                        const targetId = urlServiceId || serviceRes.data[0].id;
                        setActiveServiceId(targetId);
                    } else {
                        setError('No services found. Create services first.');
                        setLoading(false);
                    }
                } else {
                    setError('No branches found. Set up your organization first.');
                    setLoading(false);
                }
            } catch (err) {
                console.error('Failed to load services:', err);
                setError('Failed to connect to API');
                setLoading(false);
            }
        };
        loadServices();
    }, []);

    // Fetch queue state when activeServiceId changes
    const fetchState = useCallback(async () => {
        if (!activeServiceId) return;
        try {
            const res = await apiGet<DashboardQueueState>(`/api/queue/state/${activeServiceId}`);
            if (res.success && res.data) {
                setQueueState(res.data);
                setError(null);
            }
        } catch (err) {
            console.error('Error fetching queue state:', err);
        } finally {
            setLoading(false);
        }
    }, [activeServiceId]);

    useEffect(() => {
        if (!activeServiceId) return;
        fetchState();
        const interval = setInterval(fetchState, 5000);
        return () => clearInterval(interval);
    }, [fetchState, activeServiceId]);

    const handleCallNext = async () => {
        if (!activeServiceId) return;
        await apiPost('/api/queue/next', { serviceId: activeServiceId });
        fetchState();
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.25rem' }}>Dashboard</h1>
                    <p className="text-secondary" style={{ fontSize: 'var(--fs-sm)' }}>
                        Real-time queue overview
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <Link href="/qr" className="btn btn-secondary">
                        <i className="fas fa-qrcode" /> QR Setup
                    </Link>
                    <button className="btn btn-primary btn-lg" onClick={handleCallNext}>
                        <i className="fas fa-forward-step" /> Call Next
                    </button>
                </div>
            </div>

            {/* Service Selector */}
            {services.length > 1 && (
                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {services.map(svc => (
                        <button
                            key={svc.id}
                            className={`btn ${activeServiceId === svc.id ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setActiveServiceId(svc.id)}
                            style={{ fontSize: '0.875rem' }}
                        >
                            {svc.name}
                        </button>
                    ))}
                </div>
            )}

            {error && (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block', color: 'var(--color-warning)' }} />
                    {error}
                </div>
            )}

            {!error && (
                <>
                    {/* Stats Row */}
                    <div className={styles['stats-row']}>
                        <div className="stat-card">
                            <span className="stat-label">Now Serving</span>
                            <span className="stat-value">
                                {loading ? '—' : queueState?.currentlyServing ?? '—'}
                            </span>
                            <span className="stat-sub">{queueState?.serviceName || 'Loading...'}</span>
                        </div>

                        <div className="stat-card">
                            <span className="stat-label">Waiting</span>
                            <span className="stat-value" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                {loading ? '—' : queueState?.totalWaiting ?? 0}
                            </span>
                            <span className="stat-sub">In queue</span>
                        </div>

                        <div className="stat-card">
                            <span className="stat-label">Est. Wait</span>
                            <span className="stat-value" style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                {loading ? '—' : `${queueState?.estimatedWaitMinutes ?? 0}m`}
                            </span>
                            <span className="stat-sub">For next customer</span>
                        </div>

                        <div className="stat-card">
                            <span className="stat-label">Status</span>
                            <span className="stat-value" style={{ fontSize: 'var(--fs-xl)' }}>
                                {loading ? (
                                    <span className="badge badge-neutral" style={{ fontSize: 'var(--fs-sm)' }}>LOADING</span>
                                ) : queueState?.isOpen ? (
                                    <span className="badge badge-success" style={{ fontSize: 'var(--fs-sm)' }}>
                                        <span className="live-dot" /> OPEN
                                    </span>
                                ) : (
                                    <span className="badge badge-danger" style={{ fontSize: 'var(--fs-sm)' }}>CLOSED</span>
                                )}
                            </span>
                            <span className="stat-sub">Queue status</span>
                        </div>
                    </div>

                    {/* Queue Board */}
                    <div className={styles['queue-board']}>
                        <div className={styles['queue-board-header']}>
                            <h3>
                                <span className="live-dot" /> Live Queue
                            </h3>
                            <span className="badge badge-neutral">
                                <i className="fas fa-satellite-dish" /> Real-time
                            </span>
                        </div>

                        <div className={styles['now-serving']}>
                            <div className={styles['now-serving-label']}>Now Serving</div>
                            <div className={styles['now-serving-number']}>
                                {queueState?.currentlyServing ?? '—'}
                            </div>
                        </div>

                        <div className={styles['queue-list']}>
                            {(!queueState || queueState.totalWaiting === 0) ? (
                                <div className={styles['queue-empty']}>
                                    <i className="fas fa-check-circle" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block', color: 'var(--color-success)' }} />
                                    No one waiting — queue is clear!
                                </div>
                            ) : (
                                <p className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
                                    {queueState.totalWaiting} customer{queueState.totalWaiting !== 1 ? 's' : ''} waiting
                                </p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

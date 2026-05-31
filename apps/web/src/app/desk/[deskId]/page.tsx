'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiGet, apiPost } from '@/lib/api';
import styles from '../../queue.module.css';

interface QueueState {
    serviceName: string;
    currentlyServing: string | null;
    totalWaiting: number;
    estimatedWaitMinutes: number;
    waitingTokens: string[]; // List of token IDs
    benchTokens: string[];
    bufferCount: number;
}

interface DeskInfo {
    id: string;
    name: string;
    serviceId: string;
    serviceName: string;
    branchName: string;
    assignedOperatorId: string | null;
}

interface TokenInfo {
    id: string;
    tokenNumber: number;
    status: string;
    name?: string;
    phone?: string;
    bookedAt: string;
}

export default function DeskOperatorPage() {
    const params = useParams();
    const router = useRouter();
    const deskId = params?.deskId as string;

    const [desk, setDesk] = useState<DeskInfo | null>(null);
    const [queueState, setQueueState] = useState<QueueState | null>(null);
    const [waitingTickets, setWaitingTickets] = useState<TokenInfo[]>([]);
    const [benchTickets, setBenchTickets] = useState<TokenInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'queue' | 'bench'>('queue');
    const [toast, setToast] = useState<string | null>(null);

    const fetchDeskState = useCallback(async () => {
        try {
            // Get desk info
            const deskRes = await apiGet<DeskInfo>(`/api/desks/${deskId}/state`);
            if (deskRes.success && deskRes.data) {
                setDesk(deskRes.data);

                // Get queue state
                const queueRes = await apiGet<QueueState>(`/api/queue/state/${deskRes.data.serviceId}`);
                if (queueRes.success && queueRes.data) {
                    setQueueState(queueRes.data);

                    // Fetch details for waiting tokens (limit 10)
                    const waitTokens = await Promise.all(
                        (queueRes.data.waitingTokens || []).slice(0, 10).map(id => apiGet<TokenInfo>(`/api/queue/token/${id}`))
                    );
                    setWaitingTickets(waitTokens.map(t => t.data).filter((v): v is TokenInfo => Boolean(v)));

                    // Fetch details for bench tokens
                    const bTokens = await Promise.all(
                        (queueRes.data.benchTokens || []).map(id => apiGet<TokenInfo>(`/api/queue/token/${id}`))
                    );
                    setBenchTickets(bTokens.map(t => t.data).filter((v): v is TokenInfo => Boolean(v)));
                }
            } else {
                setToast('Desk session is inactive.');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [deskId]);

    // Poll for updates every 3s
    useEffect(() => {
        fetchDeskState();
        const interval = setInterval(fetchDeskState, 3000);
        return () => clearInterval(interval);
    }, [fetchDeskState]);

    const handleAction = async (action: () => Promise<any>, successMsg: string) => {
        if (!desk) return;
        setActionLoading(true);
        try {
            const res = await action();
            if (res.success || res.success === undefined) {
                setToast(successMsg);
                setTimeout(() => setToast(null), 3000);
                fetchDeskState();
            }
        } catch (error) {
            console.error('Action failed', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleCallNext = () => handleAction(
        () => apiPost('/api/queue/next', { serviceId: desk?.serviceId }),
        'Next customer called!'
    );
    const handleComplete = () => handleAction(
        () => apiPost('/api/queue/complete', { serviceId: desk?.serviceId }),
        'Shift transaction completed!'
    );
    const handleNoShow = () => {
        if (!queueState?.currentlyServing) return;
        // In skipq-v2 queueService, markNoShow cancels/completes current active token
        handleAction(
            () => apiPost('/api/queue/complete', { serviceId: desk?.serviceId }),
            'Customer marked as No Show!'
        );
    };
    const handleMoveToBench = () => handleAction(
        () => apiPost('/api/queue/bench/move', { serviceId: desk?.serviceId }),
        'Customer parked to Bench!'
    );
    const handleCallFromBench = (tokenId: string) => handleAction(
        () => apiPost('/api/queue/bench/call', { serviceId: desk?.serviceId, tokenId }),
        'Customer called from Bench!'
    );
    const handlePromoteBuffer = () => handleAction(
        () => apiPost('/api/queue/buffer/promote', { serviceId: desk?.serviceId, count: 1 }),
        'Promoted 1 buffer token!'
    );

    const handleLogout = async () => {
        if (!desk) return;
        setActionLoading(true);
        await apiPost('/api/desks/unassign', { deskId: desk.id });
        router.push('/desk');
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2.5rem', color: 'var(--color-primary)' }} />
            </div>
        );
    }

    if (!desk) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
                <h2>Desk not found or inactive</h2>
                <Link href="/desk" className="btn btn-primary" style={{ marginTop: '1rem' }}>Return to Shift Select</Link>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
            
            {/* Header */}
            <header style={{
                background: 'var(--bg-glass)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--border-color)',
                padding: '1rem 2.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'sticky', top: 0, zIndex: 100,
                boxShadow: 'var(--shadow-sm)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '40px', height: '40px', background: 'var(--color-primary-subtle)',
                        color: 'var(--color-primary)', borderRadius: 'var(--radius-md)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(124, 58, 237, 0.12)'
                    }}>
                        <i className="fas fa-desktop" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>{desk.name}</h1>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {desk.serviceName} Counter • Operator: <span style={{ color: 'var(--color-primary)' }}>{desk.assignedOperatorId || 'Visitor'}</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="badge badge-success">
                        <span className="live-dot pulsing" style={{ width: '6px', height: '6px' }} /> SHIFT ACTIVE
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={handleLogout} style={{ height: '36px' }}>
                        <i className="fas fa-right-from-bracket" /> End Shift
                    </button>
                </div>
            </header>

            {/* Notification Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000,
                    padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)',
                    background: 'var(--color-primary)',
                    color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem',
                    boxShadow: 'var(--shadow-lg)', animation: 'fadeIn 0.3s ease-out'
                }}>
                    <i className="fas fa-bell" />
                    {toast}
                </div>
            )}

            <main style={{ padding: '2rem', maxWidth: '1400px', width: '100%', margin: '0 auto', flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>

                {/* Left Panel: Active Serving Workspace */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Active Serving Screen */}
                    <div className="card" style={{
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        minHeight: '440px', position: 'relative', background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-md)'
                    }}>
                        <div style={{
                            position: 'absolute', top: '1.5rem', left: '1.5rem',
                            textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700,
                            letterSpacing: '0.15em', color: 'var(--text-secondary)'
                        }}>
                            Active Counter ticket
                        </div>

                        {queueState?.currentlyServing ? (
                            <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease-out' }}>
                                <div style={{
                                    fontSize: '9rem', fontWeight: 900, lineHeight: 1.1,
                                    color: 'var(--color-primary-light)', letterSpacing: '-0.05em',
                                    marginBottom: '1rem',
                                    textShadow: '0 4px 30px rgba(124, 58, 237, 0.15)'
                                }}>
                                    {queueState.currentlyServing}
                                </div>
                                <div className="badge badge-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 700 }}>
                                    <i className="fas fa-circle-user" style={{ marginRight: '6px' }} /> serving client now
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', opacity: 0.6 }}>
                                <i className="fas fa-coffee" style={{ fontSize: '4rem', marginBottom: '1.25rem', color: 'var(--text-tertiary)' }} />
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Station Idle</h2>
                                <p className="text-secondary" style={{ fontSize: '0.95rem', marginTop: '0.25rem' }}>No ticket active at this desk counter. Press "Call Next" to serve.</p>
                            </div>
                        )}
                    </div>

                    {/* Operator Station Actions Controls */}
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                            
                            <button
                                className="btn btn-secondary btn-lg"
                                disabled={!queueState?.currentlyServing || actionLoading}
                                onClick={handleMoveToBench}
                                style={{ height: '4.5rem', flexDirection: 'column', gap: '0.4rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}
                                title="Park customer on bench"
                            >
                                <i className="fas fa-chair" style={{ fontSize: '1.2rem' }} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Park Bench</span>
                            </button>

                            <button
                                className="btn btn-secondary btn-lg"
                                disabled={!queueState?.currentlyServing || actionLoading}
                                onClick={handleNoShow}
                                style={{ height: '4.5rem', flexDirection: 'column', gap: '0.4rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', color: 'var(--color-warning)', borderColor: 'rgba(245, 158, 11, 0.2)' }}
                                title="Mark current visitor as no-show"
                            >
                                <i className="fas fa-user-slash" style={{ fontSize: '1.2rem' }} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>No Show</span>
                            </button>

                            <button
                                className="btn btn-primary btn-lg"
                                disabled={(!queueState?.currentlyServing && queueState?.totalWaiting === 0) || actionLoading}
                                onClick={handleCallNext}
                                style={{
                                    height: '4.5rem', flexDirection: 'column', gap: '0.4rem',
                                    borderRadius: 'var(--radius-lg)', fontSize: '1.125rem'
                                }}
                                title="Call next visitor ticket"
                            >
                                <i className="fas fa-bullhorn" style={{ fontSize: '1.2rem' }} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Call Next</span>
                            </button>

                            <button
                                className="btn btn-success btn-lg"
                                disabled={!queueState?.currentlyServing || actionLoading}
                                onClick={handleComplete}
                                style={{
                                    height: '4.5rem', flexDirection: 'column', gap: '0.4rem',
                                    borderRadius: 'var(--radius-lg)', borderColor: 'transparent'
                                }}
                                title="Mark serving as complete"
                            >
                                <i className="fas fa-check" style={{ fontSize: '1.2rem' }} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Complete</span>
                            </button>

                        </div>
                    </div>
                </div>

                {/* Right Panel: Waiting lists & bench states */}
                <div className="card" style={{
                    display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', height: 'calc(100vh - 160px)',
                    background: 'var(--bg-surface)'
                }}>
                    
                    {/* Panel tab triggers */}
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-elevated)' }}>
                        <button
                            style={{
                                flex: 1, padding: '1.25rem', border: 'none', cursor: 'pointer',
                                background: activeTab === 'queue' ? 'var(--bg-surface)' : 'transparent',
                                borderBottom: activeTab === 'queue' ? '3px solid var(--color-primary)' : 'none',
                                fontWeight: 700, color: activeTab === 'queue' ? 'var(--color-primary)' : 'var(--text-secondary)',
                                transition: 'all 0.15s ease', fontSize: '0.875rem'
                            }}
                            onClick={() => setActiveTab('queue')}
                        >
                            Queue List <span className="badge badge-neutral" style={{ marginLeft: '0.4rem', fontSize: '0.7rem' }}>{queueState?.totalWaiting || 0}</span>
                        </button>
                        <button
                            style={{
                                flex: 1, padding: '1.25rem', border: 'none', cursor: 'pointer',
                                background: activeTab === 'bench' ? 'var(--bg-surface)' : 'transparent',
                                borderBottom: activeTab === 'bench' ? '3px solid var(--color-primary)' : 'none',
                                fontWeight: 700, color: activeTab === 'bench' ? 'var(--color-primary)' : 'var(--text-secondary)',
                                transition: 'all 0.15s ease', fontSize: '0.875rem'
                            }}
                            onClick={() => setActiveTab('bench')}
                        >
                            Parked Bench <span className="badge badge-warning" style={{ marginLeft: '0.4rem', fontSize: '0.7rem' }}>{queueState?.benchTokens?.length || 0}</span>
                        </button>
                    </div>

                    {/* Tab list panels */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {activeTab === 'queue' ? (
                            <>
                                {waitingTickets.length === 0 ? (
                                    <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                        <i className="fas fa-check-double" style={{ fontSize: '2rem', color: 'var(--color-success)', display: 'block', marginBottom: '0.5rem' }} />
                                        <span>No customers in queue. Shift is clear!</span>
                                    </div>
                                ) : (
                                    <div className="data-table">
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <tbody>
                                                {waitingTickets.map((ticket, i) => (
                                                    <tr key={ticket.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                        <td style={{ padding: '1rem', width: '40px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                            {i + 1}
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>#{ticket.tokenNumber}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                                {ticket.name || 'Visitor'}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                            <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>WAIT</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {benchTickets.length === 0 ? (
                                    <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                        <i className="fas fa-chair" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }} />
                                        <span>No parked counter tickets.</span>
                                    </div>
                                ) : (
                                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {benchTickets.map((ticket) => (
                                            <div key={ticket.id} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '0.85rem 1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                                                background: 'var(--bg-elevated)', transition: 'all 0.2s ease'
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>#{ticket.tokenNumber}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{ticket.name || 'Visitor'}</div>
                                                </div>
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => handleCallFromBench(ticket.id)}
                                                    disabled={!!queueState?.currentlyServing || actionLoading}
                                                    style={{ padding: '0.35rem 0.75rem' }}
                                                >
                                                    <i className="fas fa-bullhorn" style={{ marginRight: '0.25rem' }} /> Recall
                                                </button>
                                            </div>
                                        ))}
                                        {queueState?.currentlyServing && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-warning)', textAlign: 'center', marginTop: '0.5rem', background: 'var(--color-warning-bg)', border: '1px solid rgba(245, 158, 11, 0.15)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
                                                <i className="fas fa-circle-info" style={{ marginRight: '0.25rem' }} />
                                                Complete current customer to recall parked bench tickets.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Buffer Queue control (Bottom overlay) */}
                    <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-elevated)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Buffer Overflow Capacity</span>
                            <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>{queueState?.bufferCount || 0} IN FLOW</span>
                        </div>
                        <button
                            className="btn btn-secondary btn-full"
                            disabled={!queueState?.bufferCount || queueState.bufferCount === 0 || actionLoading}
                            onClick={handlePromoteBuffer}
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
                        >
                            <i className="fas fa-arrow-up" style={{ marginRight: '0.4rem' }} /> Promote 1 to Main List
                        </button>
                    </div>

                </div>

            </main>
        </div>
    );
}

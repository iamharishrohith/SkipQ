'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiGet, apiPost } from '@/lib/api';

interface DeskInfo {
    id: string;
    name: string;
    serviceId: string;
    serviceName: string;
    branchName: string;
    isActive: boolean;
    assignedOperatorId: string | null;
}

export default function DeskLoginPage() {
    const router = useRouter();
    const [desks, setDesks] = useState<DeskInfo[]>([]);
    const [selectedDesk, setSelectedDesk] = useState('');
    const [operatorName, setOperatorName] = useState('');
    const [loading, setLoading] = useState(true);
    const [logging, setLogging] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            const res = await apiGet<DeskInfo[]>('/api/desks/all');
            if (res.success && res.data) {
                setDesks(res.data);
            }
            setLoading(false);
        })();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDesk || !operatorName.trim()) {
            setError('Please select a desk and enter your name');
            return;
        }
        setError('');
        setLogging(true);

        const res = await apiPost<any>('/api/desks/login', {
            deskId: selectedDesk,
            operatorName: operatorName.trim(),
        });

        if (res.success) {
            router.push(`/desk/${selectedDesk}`);
        } else {
            setError(res.error || 'Failed to login');
            setLogging(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
            backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(124, 58, 237, 0.03), transparent 45%), radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.03), transparent 45%)',
            backgroundAttachment: 'fixed', backgroundColor: 'var(--bg-base)'
        }}>
            <div className="card" style={{
                maxWidth: '520px', width: '100%', padding: '3rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        margin: '0 auto 1.5rem auto',
                        width: '64px', height: '64px',
                        background: 'var(--color-primary-subtle)',
                        color: 'var(--color-primary)',
                        borderRadius: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(124, 58, 237, 0.15)',
                    }}>
                        <i className="fas fa-desktop" style={{ fontSize: '1.75rem' }} />
                    </div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 800, letterSpacing: '-0.03em' }}>Counter Shift Entry</h1>
                    <p className="text-secondary" style={{ fontSize: '0.95rem' }}>Select your station to begin serving customers.</p>
                </div>

                {error && (
                    <div style={{
                        padding: '0.75rem 1rem', background: 'var(--color-danger-bg)',
                        color: 'var(--color-danger)', borderRadius: 'var(--radius-md)',
                        marginBottom: '1.5rem', fontSize: '0.875rem',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                        <i className="fas fa-circle-exclamation" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="operatorName" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>Operator Name</label>
                        <input
                            id="operatorName"
                            type="text"
                            placeholder="Enter your full name"
                            value={operatorName}
                            onChange={(e) => setOperatorName(e.target.value)}
                            required
                            autoFocus
                            style={{ height: '52px' }}
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: '2rem' }}>
                        <label htmlFor="desk" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>Select Station Desk</label>
                        {loading ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                <i className="fas fa-circle-notch fa-spin" style={{ marginRight: '0.5rem' }} /> Loading desks...
                            </div>
                        ) : desks.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
                                <i className="fas fa-desktop" style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem', color: 'var(--text-tertiary)' }} />
                                No active counter desks found. Create counter desks in the Client Admin Dashboard first.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '0.75rem', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                                {desks.map(desk => (
                                    <label
                                        key={desk.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '1rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: `1px solid ${selectedDesk === desk.id ? 'var(--color-primary)' : 'var(--border-color)'}`,
                                            background: selectedDesk === desk.id ? 'var(--color-primary-subtle)' : 'var(--bg-surface)',
                                            cursor: desk.assignedOperatorId ? 'not-allowed' : 'pointer',
                                            opacity: desk.assignedOperatorId ? 0.6 : 1,
                                            transition: 'all 0.2s ease',
                                            boxShadow: selectedDesk === desk.id ? 'var(--shadow-glow)' : 'none'
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="desk"
                                            value={desk.id}
                                            checked={selectedDesk === desk.id}
                                            onChange={() => !desk.assignedOperatorId && setSelectedDesk(desk.id)}
                                            disabled={!!desk.assignedOperatorId}
                                            style={{ margin: 0, width: '1.25rem', height: '1.25rem', accentColor: 'var(--color-primary)' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, color: selectedDesk === desk.id ? 'var(--color-primary)' : 'var(--text-primary)' }}>{desk.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {desk.serviceName} • {desk.branchName}
                                            </div>
                                        </div>
                                        {desk.assignedOperatorId ? (
                                            <div className="badge badge-danger" style={{ fontSize: '0.65rem' }}>
                                                <i className="fas fa-lock" style={{ marginRight: '4px' }} /> Occupied
                                            </div>
                                        ) : (
                                            <div className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                                                <i className="fas fa-check" style={{ marginRight: '4px' }} /> Ready
                                            </div>
                                        )}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg btn-full"
                        disabled={logging || !selectedDesk || !operatorName.trim()}
                        style={{ height: '3.5rem' }}
                    >
                        {logging ? (
                            <><i className="fas fa-circle-notch fa-spin" /> Logging in...</>
                        ) : (
                            'Start Shift Session'
                        )}
                    </button>

                    <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
                        <Link href="/" className="text-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            <i className="fas fa-arrow-left" /> Back to Main Gateway
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

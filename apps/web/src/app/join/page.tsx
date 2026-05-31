'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function JoinIndexPage() {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) {
            setError('Please enter a branch code');
            return;
        }
        router.push(`/join/${code.trim()}`);
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ maxWidth: '400px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '64px', height: '64px',
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                        borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem auto', boxShadow: '0 8px 16px -4px rgba(124, 58, 237, 0.5)'
                    }}>
                        <i className="fas fa-ticket" style={{ fontSize: '1.75rem', color: 'white' }} />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>Join a Queue</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Enter the branch code provided at the venue or by the staff.</p>
                </div>

                <form onSubmit={handleSubmit} className="card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '2rem' }}>
                    <div className="input-group">
                        <label htmlFor="code">Branch Code</label>
                        <input
                            id="code"
                            type="text"
                            placeholder="e.g. branch-id"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            style={{ fontSize: '1.25rem', textAlign: 'center', letterSpacing: '0.05em' }}
                        />
                    </div>

                    {error && (
                        <div style={{ color: '#f87171', fontSize: '0.875rem', marginTop: '-0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <i className="fas fa-exclamation-circle" /> {error}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary btn-lg btn-full" style={{ height: '3.5rem', fontSize: '1.125rem' }}>
                        Continue <i className="fas fa-arrow-right" style={{ marginLeft: '0.5rem' }} />
                    </button>

                    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <Link href="/" style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', textDecoration: 'none' }}>
                            <i className="fas fa-chevron-left" style={{ marginRight: '0.5rem' }} /> Back to Home
                        </Link>
                    </div>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                    Don&apos;t have a code? Look for a QR code at the service counter.
                </div>
            </div>
        </div>
    );
}

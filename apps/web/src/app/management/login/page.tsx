'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../management.module.css';

export default function ManagementLoginPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Simple mock authentication for management console (allows easy showcase/access)
        setTimeout(() => {
            if (password === 'admin123' || password === 'skipq2026' || password === 'admin') {
                // Set cookie or local storage to simulate login
                localStorage.setItem('mgmt_authenticated', 'true');
                router.push('/management/dashboard');
            } else {
                setError('Invalid administrative passcode. (Tip: use "admin" or "admin123")');
                setLoading(false);
            }
        }, 600);
    };

    return (
        <div className={styles['mgmt-page']}>
            {/* Left Panel: Platform Aesthetics */}
            <div className={styles['mgmt-brand-panel']}>
                <div className={styles['brand-content']}>
                    <div className={styles['mgmt-logo-large']}>SkipQ Telemetry</div>
                    <p className={styles['mgmt-tagline']}>
                        Platform control center. Monitor low-cost transactional databases, view live WebSockets, and supervise system performance.
                    </p>
                </div>
                <div className={styles['brand-footer']}>
                    SkipQ Systems Group • ₹0 Database Engine
                </div>
            </div>

            {/* Right Panel: Passcode Form */}
            <div className={styles['mgmt-form-panel']}>
                <div className={styles['mgmt-card']}>
                    <div className={styles['mgmt-header']}>
                        <h1>Control Tower</h1>
                        <p>Authenticate with your administrative passcode.</p>
                    </div>

                    {error && (
                        <div className="badge badge-danger" style={{
                            width: '100%', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)',
                            display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem',
                            fontSize: '0.825rem', whiteSpace: 'normal', lineHeight: 1.4
                        }}>
                            <i className="fas fa-circle-exclamation" /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="input-group" style={{ marginBottom: '2rem' }}>
                            <label htmlFor="passcode">System Administrative Passcode</label>
                            <input
                                id="passcode"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoFocus
                                style={{
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                }}
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary btn-full btn-lg" 
                            disabled={loading}
                            style={{
                                background: 'linear-gradient(135deg, #d97706, #b45309)',
                                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)',
                                borderColor: 'transparent',
                                color: '#ffffff',
                                height: '3.5rem'
                            }}
                        >
                            {loading ? (
                                <><i className="fas fa-circle-notch fa-spin" /> Accessing Hub...</>
                            ) : (
                                'Access Diagnostics'
                            )}
                        </button>
                    </form>

                    <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
                        <Link href="/" className="text-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            <i className="fas fa-arrow-left" /> Return to Main Gateway
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

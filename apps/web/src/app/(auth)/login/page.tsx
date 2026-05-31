'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/auth-client';
import styles from '../auth.module.css';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signIn.email({
                email,
                password,
            });

            if (result.error) {
                setError(result.error.message || 'Invalid credentials');
            } else {
                // Hard navigation to ensure cookies are picked up
                console.log('Login successful');
                window.location.href = '/dashboard';
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles['auth-page']}>
            {/* Left Panel: Brand & Visuals */}
            <div className={styles['auth-brand-panel']}>
                <div className={styles['brand-content']}>
                    <div className={styles['auth-logo-large']}>SkipQ</div>
                    <p className={styles['auth-tagline']}>
                        Orchestrate your customer flow with the modern queue platform built for speed.
                    </p>
                </div>
                <div className={styles['brand-footer']}>
                    © 2026 SkipQ Inc.
                </div>
            </div>

            {/* Right Panel: Form */}
            <div className={styles['auth-form-panel']}>
                <div className={styles['auth-card']}>
                    <div className={styles['auth-header']}>
                        <h1>Welcome back</h1>
                        <p>Sign in to your account to continue.</p>
                    </div>

                    {error && (
                        <div className={styles['auth-error']}>
                            <i className="fas fa-circle-exclamation" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles['auth-form']}>
                        <div className={styles['input-group']}>
                            <label htmlFor="email">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div className={styles['input-group']}>
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>

                        <button type="submit" className={styles['btn-full']} disabled={loading}>
                            {loading ? (
                                <>
                                    <i className="fas fa-circle-notch fa-spin" style={{ marginRight: '8px' }} />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className={styles['auth-footer']}>
                        Don&apos;t have an account?{' '}
                        <Link href="/signup">Create account</Link>
                    </div>

                    <div className={styles['auth-footer']} style={{ marginTop: '1rem' }}>
                        <Link href="/dashboard" style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: 'var(--color-primary-light)',
                            fontWeight: 600,
                            textDecoration: 'none'
                        }}>
                            <i className="fas fa-arrow-right" /> Go to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

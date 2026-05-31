'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';

export default function FeedbackFormPage() {
    const params = useParams();
    const tokenId = params?.tokenId as string;

    const [tokenInfo, setTokenInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [comments, setComments] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchTokenDetails() {
            if (!tokenId) return;
            try {
                const res = await apiGet<any>(`/api/queue/token/${tokenId}`);
                if (res.success && res.data) {
                    setTokenInfo(res.data);
                } else {
                    setError(res.error || 'Token information not found.');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to retrieve ticket information.');
            } finally {
                setLoading(false);
            }
        }
        fetchTokenDetails();
    }, [tokenId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please choose a rating of 1 to 5 stars.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const payload = {
                tokenId: tokenInfo.id,
                tokenNumber: tokenInfo.tokenNumber,
                operatorName: tokenInfo.operatorName || 'Desk Operator',
                serviceId: tokenInfo.serviceId,
                rating,
                comments: comments.trim()
            };

            const res = await apiPost<any>('/api/billing/feedback', payload);
            if (res.success) {
                setSuccess(true);
            } else {
                setError(res.error || 'Failed to submit feedback.');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during submission.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
                <div style={{ textAlign: 'center' }}>
                    <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2.5rem', color: 'var(--color-primary)', marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Loading service details...</p>
                </div>
            </div>
        );
    }

    if (error && !tokenInfo) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: '1.5rem' }}>
                <div className="card" style={{ maxWidth: '400px', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
                    <i className="fas fa-exclamation-triangle" style={{ fontSize: '3rem', color: 'var(--color-danger)', marginBottom: '1rem' }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>Invalid Review Link</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>{error}</p>
                    <a href="/" style={{
                        display: 'inline-block',
                        padding: '0.625rem 1.25rem',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        color: 'var(--text-primary)'
                    }}>
                        Back to SkipQ Home
                    </a>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: '1.5rem' }}>
                <div className="card" style={{
                    maxWidth: '420px',
                    textAlign: 'center',
                    padding: '3rem 2rem',
                    background: 'rgba(19, 19, 31, 0.7)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(139, 92, 246, 0.25)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
                }}>
                    <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 95, 70, 0.2))',
                        border: '2px solid var(--color-success)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto',
                        color: 'var(--color-success)',
                        fontSize: '2rem',
                        boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)'
                    }}>
                        <i className="fas fa-check" />
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                        Thank You!
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.5, marginBottom: '2rem' }}>
                        Your experience review has been received. Your feedback helps us continuously elevate our wait times and service excellence!
                    </p>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Ticket Details
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                            {tokenInfo?.serviceName} • #{tokenInfo?.tokenNumber}
                        </div>
                    </div>
                    <a href="/" style={{
                        display: 'block',
                        width: '100%',
                        padding: '0.75rem',
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                        color: '#white',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        textAlign: 'center',
                        boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)'
                    }}>
                        Done
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '480px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(139, 92, 246, 0.1)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid rgba(139, 92, 246, 0.2)', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Post-Service Experience
                        </span>
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Rate Your Visit</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '0.25rem' }}>
                        Help us reward outstanding support agents
                    </p>
                </div>

                <div className="card" style={{
                    padding: '2.5rem 2rem',
                    background: 'rgba(19, 19, 31, 0.6)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
                }}>
                    {/* Ticket Context Information Banner */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.25rem',
                        marginBottom: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(139, 92, 246, 0.1)',
                            border: '1px solid rgba(139, 92, 246, 0.2)',
                            color: 'var(--color-primary-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.25rem',
                            flexShrink: 0
                        }}>
                            <i className="fas fa-ticket" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Queue Queue Service Lane
                            </div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {tokenInfo.serviceName}
                            </div>
                            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                                Token Number: <strong>#{tokenInfo.tokenNumber}</strong>
                            </div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                            You were served by:
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <i className="fas fa-user-circle" style={{ color: 'var(--color-primary-light)' }} />
                            {tokenInfo.operatorName || 'Desk Operator'}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Star Rating Interactive Field */}
                        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                How would you rate your overall experience?
                            </label>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '2.5rem',
                                            color: (hoverRating || rating) >= star ? '#fbbf24' : 'rgba(255,255,255,0.1)',
                                            filter: (hoverRating || rating) >= star ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.4))' : 'none',
                                            transition: 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), color 0.1s ease',
                                            transform: (hoverRating || rating) >= star ? 'scale(1.15)' : 'scale(1)'
                                        }}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                            {rating > 0 && (
                                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#fbbf24', marginTop: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {rating === 1 ? 'Poor 😞' :
                                     rating === 2 ? 'Fair 😐' :
                                     rating === 3 ? 'Good 🙂' :
                                     rating === 4 ? 'Very Good 😃' : 'Excellent! ✨🤩'}
                                </div>
                            )}
                        </div>

                        {/* Text Comments area */}
                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                            <label htmlFor="comments" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                Add optional feedback or comments
                            </label>
                            <textarea
                                id="comments"
                                rows={4}
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                placeholder="Describe how our service agent helped you or any suggestions for improvements..."
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '0.75rem',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.875rem',
                                    resize: 'none',
                                    transition: 'border-color 0.2s',
                                    outline: 'none'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                            />
                        </div>

                        {/* Error box */}
                        {error && (
                            <div style={{
                                padding: '0.75rem 1rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid var(--color-danger)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--color-danger)',
                                fontSize: '0.825rem',
                                marginBottom: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <i className="fas fa-exclamation-circle" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Action buttons */}
                        <button
                            type="submit"
                            disabled={submitting || rating === 0}
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                background: rating === 0 ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                                color: rating === 0 ? 'var(--text-tertiary)' : 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.875rem',
                                fontWeight: 700,
                                cursor: rating === 0 ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                boxShadow: rating === 0 ? 'none' : '0 4px 15px rgba(124, 58, 237, 0.3)',
                                transition: 'all 0.2s'
                            }}
                        >
                            {submitting ? (
                                <>
                                    <i className="fas fa-circle-notch fa-spin" />
                                    <span>Submitting Review...</span>
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-paper-plane" />
                                    <span>Submit Experience Rating</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

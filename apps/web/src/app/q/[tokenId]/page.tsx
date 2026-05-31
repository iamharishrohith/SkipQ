'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { useQueueWS } from '@/hooks/useQueueWS';
import type { QueueState } from '@skipq/shared';
// Ensure we import the CSS module to avail of the .queue-status-card class if needed, 
// though this page largely uses global classes + inline styles.
// Let's rely on globals.css and the updated palette.

export default function QueueStatusPage() {
    const params = useParams();
    const tokenId = params?.tokenId as string;
    const [queueState, setQueueState] = useState<QueueState | null>(null);
    const [tokenInfo, setTokenInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [showFastPassModal, setShowFastPassModal] = useState(false);
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState<any>(null);
    const [spotOffers, setSpotOffers] = useState<any[]>([]);
    const [simulatedTxnId, setSimulatedTxnId] = useState('');
    const [purchasing, setPurchasing] = useState(false);

    const fetchData = useCallback(async () => {
        if (!tokenId) return;
        const res = await apiGet<any>(`/api/queue/token/${tokenId}`);
        if (res.success && res.data) {
            setTokenInfo(res.data);
            
            // Fetch waiting room deals dynamically
            const offersRes = await apiGet<any[]>(`/api/billing/spot-offers/${res.data.industryCategory}`);
            if (offersRes.success && offersRes.data) {
                setSpotOffers(offersRes.data);
            }

            const stateRes = await apiGet<QueueState>(`/api/queue/state/${res.data.serviceId}`);
            if (stateRes.success && stateRes.data) {
                setQueueState(stateRes.data);
            }
        }
        setLoading(false);
    }, [tokenId]);

    const handleUpgradeFastPass = async () => {
        setPurchasing(true);
        try {
            const apiHost = window.location.hostname;
            const res = await fetch(`http://${apiHost}:3001/api/billing/upgrade-fastpass`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tokenId: tokenInfo.id,
                    amount: tokenInfo.fastPassPrice || 99
                })
            });
            const data = await res.json();
            if (data.success) {
                setShowFastPassModal(false);
                fetchData();
            }
        } catch (err) {
            console.error('Fast-pass upgrade failed', err);
        } finally {
            setPurchasing(false);
        }
    };

    const handleBuyOffer = (offer: any) => {
        setSelectedOffer(offer);
        setSimulatedTxnId('UPI_TXN_' + Math.random().toString(36).substring(2, 11).toUpperCase());
        setShowOfferModal(true);
    };

    const executeOfferBuy = async () => {
        setPurchasing(true);
        try {
            const apiHost = window.location.hostname;
            const res = await fetch(`http://${apiHost}:3001/api/billing/buy-spot-offer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tokenId: tokenInfo.id,
                    amount: selectedOffer.price,
                    offerTitle: selectedOffer.title
                })
            });
            const data = await res.json();
            if (data.success) {
                setShowOfferModal(false);
                alert(`Transaction Approved! Your '${selectedOffer.title}' will be delivered/assigned to you shortly.`);
            }
        } catch (err) {
            console.error('Spot-offer purchase failed', err);
        } finally {
            setPurchasing(false);
        }
    };

    // Real-time updates
    useQueueWS({
        serviceId: tokenInfo?.serviceId || '',
        enabled: !!tokenInfo?.serviceId,
        onEvent: () => fetchData(),
    });

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--color-primary)' }} />
            </div>
        );
    }

    if (!tokenInfo) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                    <i className="fas fa-ticket-simple-slash" style={{ fontSize: '3rem', color: 'var(--text-tertiary)', marginBottom: '1rem' }} />
                    <h2>Token Not Found</h2>
                    <p className="text-muted">This token may have expired or does not exist.</p>
                </div>
            </div>
        );
    }

    const getStatusColor = () => {
        switch (tokenInfo.status) {
            case 'active': return 'var(--color-success)';
            case 'waiting': return 'var(--color-warning)';
            case 'completed': return 'var(--color-primary)';
            case 'cancelled': return 'var(--color-danger)';
            default: return 'var(--text-secondary)';
        }
    };

    const getStatusIcon = () => {
        switch (tokenInfo.status) {
            case 'active': return 'fa-bell';
            case 'waiting': return 'fa-clock';
            case 'completed': return 'fa-check-circle';
            case 'cancelled': return 'fa-ban';
            default: return 'fa-circle-question';
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: '420px' }}>

                {/* Status Card */}
                <div className="card" style={{
                    padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    background: 'rgba(19, 19, 31, 0.6)',
                    backdropFilter: 'blur(16px)'
                }}>
                    {/* Hero Section */}
                    <div style={{
                        background: tokenInfo.status === 'active'
                            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 95, 70, 0.2))'
                            : 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(91, 33, 182, 0.2))',
                        padding: '3rem 2rem',
                        textAlign: 'center',
                        color: 'white',
                        position: 'relative',
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        {tokenInfo.status === 'active' && (
                            <div style={{
                                position: 'absolute', top: '1rem', right: '1rem',
                                background: 'var(--color-success)', padding: '0.25rem 0.75rem',
                                borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                boxShadow: '0 0 15px var(--color-success)'
                            }}>
                                <span className="live-dot" style={{ background: '#fff', boxShadow: 'none' }} /> YOUR TURN
                            </div>
                        )}

                        <div style={{ fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.9, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                            {queueState?.serviceName}
                        </div>
                        <div style={{
                            fontSize: '5rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', margin: '0.5rem 0',
                            background: tokenInfo.status === 'active'
                                ? 'linear-gradient(135deg, #fff, #6ee7b7)'
                                : 'linear-gradient(135deg, #fff, #a78bfa)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: `drop-shadow(0 0 20px ${tokenInfo.status === 'active' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(124, 58, 237, 0.4)'})`
                        }}>
                            {tokenInfo.tokenNumber}
                        </div>

                        {tokenInfo.isFastPass && (
                            <div style={{
                                display: 'inline-block',
                                background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                                color: '#000',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                padding: '0.25rem 0.75rem',
                                borderRadius: 'var(--radius-full)',
                                boxShadow: '0 0 15px rgba(251, 191, 36, 0.4)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: '0.5rem'
                            }}>
                                ⚡ VIP FAST-PASS ACTIVE
                            </div>
                        )}
                        <div style={{ fontSize: '0.875rem', opacity: 0.8, color: 'var(--text-secondary)' }}>
                            Ticket Number
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div style={{ padding: '2rem', background: 'transparent' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                                    Now Serving
                                </div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary-light)', textShadow: '0 0 10px rgba(139, 92, 246, 0.3)' }}>
                                    {queueState?.currentlyServing || '—'}
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                                    Your Position
                                </div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {tokenInfo.position || '—'}
                                </div>
                            </div>
                        </div>

                        {tokenInfo.groupSize > 1 && (
                            <div style={{
                                background: 'rgba(124, 58, 237, 0.08)',
                                border: '1px solid rgba(124, 58, 237, 0.25)',
                                padding: '0.625rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.8rem',
                                color: 'var(--color-primary-light)',
                                textAlign: 'center',
                                marginBottom: '1.5rem',
                                fontWeight: 600
                            }}>
                                👥 Family / Group Pass: {tokenInfo.groupSize} People Booking
                            </div>
                        )}

                        {/* Status Message */}
                        <div style={{
                            padding: '1rem',
                            background: tokenInfo.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                            borderRadius: 'var(--radius-lg)',
                            display: 'flex', alignItems: 'center', gap: '1rem',
                            border: `1px solid ${tokenInfo.status === 'active' ? 'var(--color-success)' : 'var(--border-color)'}`,
                            boxShadow: tokenInfo.status === 'active' ? '0 0 20px -5px rgba(16, 185, 129, 0.2)' : 'none'
                        }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                background: tokenInfo.status === 'active' ? 'var(--color-success)' : 'var(--bg-surface)',
                                color: tokenInfo.status === 'active' ? '#fff' : 'var(--text-secondary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                                <i className={`fas ${getStatusIcon()}`} style={{ fontSize: '1.25rem' }} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, color: tokenInfo.status === 'active' ? 'var(--color-success)' : 'var(--text-primary)' }}>
                                    {tokenInfo.status === 'active' ? 'Please proceed to the desk' :
                                        tokenInfo.status === 'waiting' ? 'Please wait for your turn' :
                                            tokenInfo.status.charAt(0).toUpperCase() + tokenInfo.status.slice(1)}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    {tokenInfo.status === 'active' ? 'Counter is ready for you' : `Estimated wait time: ${queueState?.estimatedWaitMinutes || 0} mins`}
                                </div>
                            </div>
                        </div>

                        {/* Experience Rating Prompt for Completed Tickets */}
                        {tokenInfo.status === 'completed' && (
                            <div style={{
                                marginTop: '1.5rem',
                                padding: '1.5rem',
                                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(99, 102, 241, 0.12))',
                                border: '1px solid rgba(139, 92, 246, 0.25)',
                                borderRadius: 'var(--radius-lg)',
                                textAlign: 'center',
                                boxShadow: '0 8px 32px 0 rgba(139, 92, 246, 0.08)'
                            }}>
                                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <span>✨</span> Rate Your Experience <span>✨</span>
                                </div>
                                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.4 }}>
                                    Your opinion matters! Please take a moment to rate the service provided by <strong>{tokenInfo.operatorName || 'our operator'}</strong>.
                                </p>
                                <a href={`/feedback/${tokenId}`} style={{
                                    display: 'inline-block',
                                    padding: '0.625rem 1.25rem',
                                    background: 'var(--color-primary)',
                                    color: 'white',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                                    transition: 'all 0.2s ease',
                                }}>
                                    Submit Review Rating
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Experience Fast-Pass Upgrades Promo Banner */}
                {tokenInfo.status === 'waiting' && !tokenInfo.isFastPass && tokenInfo.allowPriorityFastPass && (
                    <div style={{
                        marginTop: '1.5rem',
                        padding: '1.25rem',
                        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(217, 119, 6, 0.12))',
                        border: '1px solid rgba(251, 191, 36, 0.3)',
                        borderRadius: 'var(--radius-lg)',
                        textAlign: 'center',
                        boxShadow: '0 8px 32px 0 rgba(251, 191, 36, 0.08)'
                    }}>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fbbf24', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <span>🚀</span> Skip the Queue!
                        </div>
                        <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
                            Don't wait in line! Upgrade to a **VIP Fast-Pass** now for just **₹{tokenInfo.fastPassPrice || 99}** and skip ahead of everyone.
                        </p>
                        <button
                            onClick={() => {
                                setSimulatedTxnId('UPI_TXN_' + Math.random().toString(36).substring(2, 11).toUpperCase());
                                setShowFastPassModal(true);
                            }}
                            style={{
                                display: 'inline-block',
                                padding: '0.5rem 1rem',
                                background: '#fbbf24',
                                color: '#000',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.825rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)',
                            }}
                        >
                            Upgrade to VIP Fast-Pass
                        </button>
                    </div>
                )}

                {/* Bento Spot-Offers waiting room deals */}
                {spotOffers.length > 0 && (tokenInfo.status === 'waiting' || tokenInfo.status === 'active') && (
                    <div style={{ marginTop: '2rem' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <i className="fas fa-tags" style={{ color: 'var(--color-primary-light)' }} /> Exclusive Deals While You Wait
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {spotOffers.map((offer: any) => (
                                <div key={offer.id} className="card" style={{
                                    padding: '1rem',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-lg)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    gap: '0.5rem'
                                }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        <img src={offer.imageUrl} alt={offer.title} style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
                                        <div>
                                            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.125rem' }}>{offer.title}</h4>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fbbf24' }}>₹{offer.price}</div>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.675rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>{offer.description}</p>
                                    <button
                                        onClick={() => handleBuyOffer(offer)}
                                        style={{
                                            width: '100%',
                                            padding: '0.375rem',
                                            background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid var(--border-color)',
                                            color: 'var(--text-primary)',
                                            fontSize: '0.725rem',
                                            fontWeight: 600,
                                            borderRadius: 'var(--radius-md)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        Buy with UPI
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* MODAL 1: VIP Fast-Pass Scan-to-Pay overlay drawer */}
                {showFastPassModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
                    }}>
                        <div className="card animate-fade-in" style={{
                            maxWidth: '420px', width: '100%', padding: '2.5rem',
                            background: 'rgba(19, 19, 31, 0.95)', border: '1px solid rgba(251, 191, 36, 0.3)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)', textAlign: 'center'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ textAlign: 'left' }}>
                                    <span className="badge" style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.3)', fontSize: '0.65rem' }}>
                                        VIP FAST PASS UPGRADE
                                    </span>
                                    <h3 style={{ fontWeight: 800, marginTop: '0.25rem', color: 'var(--text-primary)', fontSize: '1.25rem' }}>Skip The Queue</h3>
                                </div>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '0.4rem 0.5rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: 'none' }}
                                    onClick={() => setShowFastPassModal(false)}
                                >
                                    <i className="fas fa-xmark" />
                                </button>
                            </div>

                            <div style={{ margin: '1.5rem 0' }}>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    Fast-Pass Price:
                                </div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fbbf24', margin: '0.25rem 0' }}>
                                    ₹{tokenInfo.fastPassPrice || 99}
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                    Elevates Token #{tokenInfo.tokenNumber} to absolute front of line!
                                </p>
                            </div>

                            {/* Simulated QR Code */}
                            <div style={{
                                background: '#fff',
                                padding: '1.25rem',
                                borderRadius: 'var(--radius-lg)',
                                display: 'inline-block',
                                margin: '0 auto 1.5rem auto',
                                boxShadow: '0 0 25px rgba(255,255,255,0.1)'
                            }}>
                                <div style={{ width: '160px', height: '160px', position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '40px', height: '40px', border: '10px solid #000' }} />
                                    <div style={{ position: 'absolute', top: 0, right: 0, width: '40px', height: '40px', border: '10px solid #000' }} />
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '40px', height: '40px', border: '10px solid #000' }} />
                                    <div style={{ position: 'absolute', top: '55px', left: '55px', width: '50px', height: '50px', border: '8px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontSize: '0.5rem', fontWeight: 900, color: '#000' }}>SkipQ</span>
                                    </div>
                                    <div style={{ position: 'absolute', top: '15px', left: '60px', width: '20px', height: '20px', background: '#000' }} />
                                    <div style={{ position: 'absolute', bottom: '15px', right: '60px', width: '25px', height: '15px', background: '#000' }} />
                                    <div style={{ position: 'absolute', bottom: '40px', right: '15px', width: '15px', height: '25px', background: '#000' }} />
                                    <div style={{ position: 'absolute', top: '60px', right: '25px', width: '20px', height: '20px', background: '#000' }} />
                                    <div style={{ position: 'absolute', bottom: '60px', left: '15px', width: '20px', height: '20px', background: '#000' }} />
                                </div>
                            </div>

                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '2rem' }}>
                                Scan this QR using **GPAY, PhonePe, Paytm, or BHIM** to skip wait times.
                                <br />
                                <span style={{ fontSize: '0.725rem', color: 'var(--text-tertiary)' }}>Reference ID: <code>{simulatedTxnId}</code></span>
                            </p>

                            <button
                                type="button"
                                className="btn btn-primary btn-full"
                                onClick={handleUpgradeFastPass}
                                disabled={purchasing}
                                style={{
                                    padding: '0.875rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    boxShadow: '0 4px 15px rgba(251, 191, 36, 0.3)',
                                    cursor: 'pointer'
                                }}
                            >
                                {purchasing ? (
                                    <><i className="fas fa-circle-notch fa-spin" /> Promoting Token...</>
                                ) : (
                                    <><i className="fas fa-bolt" /> Skip Queue Now</>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* MODAL 2: Spot-Offer Scan-to-Pay overlay drawer */}
                {showOfferModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
                    }}>
                        <div className="card animate-fade-in" style={{
                            maxWidth: '420px', width: '100%', padding: '2.5rem',
                            background: 'rgba(19, 19, 31, 0.95)', border: '1px solid rgba(139, 92, 246, 0.3)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)', textAlign: 'center'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ textAlign: 'left' }}>
                                    <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--color-primary-light)', border: '1px solid rgba(139, 92, 246, 0.3)', fontSize: '0.65rem' }}>
                                        WAITING ROOM SPOT DEAL
                                    </span>
                                    <h3 style={{ fontWeight: 800, marginTop: '0.25rem', color: 'var(--text-primary)', fontSize: '1.25rem' }}>Buy Deal</h3>
                                </div>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '0.4rem 0.5rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: 'none' }}
                                    onClick={() => setShowOfferModal(false)}
                                >
                                    <i className="fas fa-xmark" />
                                </button>
                            </div>

                            <div style={{ margin: '1.5rem 0' }}>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    Special Promo Price:
                                </div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
                                    ₹{selectedOffer?.price}
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                    {selectedOffer?.title}
                                </p>
                            </div>

                            {/* Simulated QR Code */}
                            <div style={{
                                background: '#fff',
                                padding: '1.25rem',
                                borderRadius: 'var(--radius-lg)',
                                display: 'inline-block',
                                margin: '0 auto 1.5rem auto',
                                boxShadow: '0 0 25px rgba(255,255,255,0.1)'
                            }}>
                                <div style={{ width: '160px', height: '160px', position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '40px', height: '40px', border: '10px solid #000' }} />
                                    <div style={{ position: 'absolute', top: 0, right: 0, width: '40px', height: '40px', border: '10px solid #000' }} />
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '40px', height: '40px', border: '10px solid #000' }} />
                                    <div style={{ position: 'absolute', top: '55px', left: '55px', width: '50px', height: '50px', border: '8px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontSize: '0.5rem', fontWeight: 900, color: '#000' }}>SkipQ</span>
                                    </div>
                                    <div style={{ position: 'absolute', top: '15px', left: '60px', width: '20px', height: '20px', background: '#000' }} />
                                    <div style={{ position: 'absolute', bottom: '15px', right: '60px', width: '25px', height: '15px', background: '#000' }} />
                                    <div style={{ position: 'absolute', bottom: '40px', right: '15px', width: '15px', height: '25px', background: '#000' }} />
                                    <div style={{ position: 'absolute', top: '60px', right: '25px', width: '20px', height: '20px', background: '#000' }} />
                                    <div style={{ position: 'absolute', bottom: '60px', left: '15px', width: '20px', height: '20px', background: '#000' }} />
                                </div>
                            </div>

                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '2rem' }}>
                                Scan this QR using **GPAY, PhonePe, Paytm, or BHIM** to finalize simulated payment.
                                <br />
                                <span style={{ fontSize: '0.725rem', color: 'var(--text-tertiary)' }}>Reference ID: <code>{simulatedTxnId}</code></span>
                            </p>

                            <button
                                type="button"
                                className="btn btn-primary btn-full"
                                onClick={executeOfferBuy}
                                disabled={purchasing}
                                style={{
                                    padding: '0.875rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                                    color: '#white',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)',
                                    cursor: 'pointer'
                                }}
                            >
                                {purchasing ? (
                                    <><i className="fas fa-circle-notch fa-spin" /> Finalizing Deal...</>
                                ) : (
                                    <><i className="fas fa-shopping-bag" /> Buy Deal with UPI</>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        <i className="fas fa-arrows-rotate" style={{ marginRight: '0.25rem' }} />
                        Updates automatically in real-time
                    </p>
                </div>
            </div>
        </div>
    );
}

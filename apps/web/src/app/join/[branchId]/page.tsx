'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';

interface BranchInfo {
    id: string;
    name: string;
    description: string;
    address: string;
}

interface ServiceInfo {
    id: string;
    name: string;
    description: string;
    estimatedWaitTime: number;
    peopleWaiting: number;
    isActive: boolean;
    price?: number;
}

export default function JoinQueuePage() {
    const params = useParams();
    const router = useRouter();
    const branchId = params?.branchId as string;

    const [branch, setBranch] = useState<BranchInfo | null>(null);
    const [services, setServices] = useState<ServiceInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [groupSize, setGroupSize] = useState(1);
    const [showUpiModal, setShowUpiModal] = useState(false);
    const [simulatedTxnId, setSimulatedTxnId] = useState('');

    useEffect(() => {
        if (branchId) {
            fetchBranchData();
        }
    }, [branchId]);

    const fetchBranchData = async () => {
        try {
            const [branchRes, servicesRes] = await Promise.all([
                apiGet<BranchInfo>(`/api/org/branches/${branchId}`),
                apiGet<ServiceInfo[]>(`/api/org/branches/${branchId}/services`)
            ]);

            if (branchRes.success && branchRes.data) {
                setBranch(branchRes.data);
            }
            if (servicesRes.success && servicesRes.data) {
                setServices(servicesRes.data.filter(s => s.isActive));
            }
        } catch (err) {
            console.error('Failed to fetch data', err);
            setError('Unable to load branch information');
        } finally {
            setLoading(false);
        }
    };

    const selectedServiceDetails = services.find(s => s.id === selectedService);
    const selectedServicePrice = (selectedServiceDetails as any)?.price || 0;
    const totalAmount = selectedServicePrice * groupSize;

    const initiateJoinFlow = () => {
        if (!selectedService) {
            setError('Please select a service');
            return;
        }
        if (!name.trim() || !phone.trim() || phone.trim().length < 10) {
            setError('Please enter your name and a valid phone number');
            return;
        }

        setError('');
        if (selectedServicePrice > 0) {
            setSimulatedTxnId('UPI_TXN_' + Math.random().toString(36).substring(2, 11).toUpperCase());
            setShowUpiModal(true);
        } else {
            executeBooking('free', 0, null);
        }
    };

    const executeBooking = async (paymentStatus: string, amount: number, txnId: string | null) => {
        setJoining(true);
        setError('');
        
        try {
            const res = await apiPost<{ tokenId: string }>('/api/queue/book', {
                serviceId: selectedService,
                name: name.trim(),
                phone: phone.trim(),
                groupSize,
                paymentStatus,
                amountPaid: amount,
                transactionId: txnId
            });

            if (res.success && res.data) {
                setShowUpiModal(false);
                router.push(`/q/${res.data.tokenId}`);
            } else {
                setError(res.error || 'Failed to join queue');
                setJoining(false);
            }
        } catch (err: any) {
            setError('Connection failed. Please retry.');
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--color-primary)' }} />
            </div>
        );
    }

    if (!branch) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                    <div style={{
                        width: '64px', height: '64px', background: 'var(--bg-surface)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem auto', border: '1px solid var(--border-color)'
                    }}>
                        <i className="fas fa-building-circle-xmark" style={{ fontSize: '1.5rem', color: 'var(--text-tertiary)' }} />
                    </div>
                    <h2 style={{ marginBottom: '0.5rem' }}>Branch Not Found</h2>
                    <p className="text-muted">The location you are looking for does not exist or has been removed.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '2rem 1rem' }}>
            <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '56px', height: '56px',
                        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(139, 92, 246, 0.1))',
                        border: '1px solid rgba(124, 58, 237, 0.3)',
                        borderRadius: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.25rem auto',
                        boxShadow: '0 0 20px -5px rgba(124, 58, 237, 0.3)'
                    }}>
                        <i className="fas fa-building" style={{ fontSize: '1.5rem', color: 'var(--color-primary-light)' }} />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', textShadow: '0 0 10px rgba(0,0,0,0.5)' }}>{branch.name}</h1>
                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                        <i className="fas fa-location-dot" style={{ marginRight: '0.5rem' }} />
                        {branch.address}
                    </p>
                </div>

                {error && (
                    <div style={{
                        padding: '1rem', background: 'rgba(239, 68, 68, 0.1)',
                        color: '#fca5a5', borderRadius: 'var(--radius-md)',
                        marginBottom: '1.5rem', fontSize: '0.875rem',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                        <i className="fas fa-circle-exclamation" />
                        {error}
                    </div>
                )}

                {/* Form Card */}
                <div className="card" style={{
                    background: 'rgba(19, 19, 31, 0.6)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.08)'
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="input-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                id="name"
                                type="text"
                                placeholder="Your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="name"
                                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="phone">Mobile Number</label>
                            <input
                                id="phone"
                                type="tel"
                                placeholder="10 digits"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                autoComplete="tel"
                                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}
                            />
                        </div>
                    </div>

                    {/* Group/Family Size Selector */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.875rem 1.25rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1.5rem'
                    }}>
                        <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                Group / Family Size
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                Number of people joining together
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                type="button"
                                onClick={() => setGroupSize(prev => Math.max(1, prev - 1))}
                                disabled={groupSize <= 1}
                                style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)',
                                    border: '1px solid var(--border-color)', cursor: groupSize <= 1 ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
                                }}
                            >
                                -
                            </button>
                            <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary-light)', minWidth: '20px', textAlign: 'center' }}>
                                {groupSize}
                            </span>
                            <button
                                type="button"
                                onClick={() => setGroupSize(prev => Math.min(5, prev + 1))}
                                disabled={groupSize >= 5}
                                style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)',
                                    border: '1px solid var(--border-color)', cursor: groupSize >= 5 ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
                                }}
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div style={{ margin: '1.5rem 0 1rem 0' }}>
                        <label className="text-sm font-medium text-secondary" style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', fontWeight: 600, color: 'var(--text-tertiary)' }}>Select Service</label>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {services.length === 0 ? (
                            <div className="text-center text-muted" style={{ padding: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
                                No services available right now.
                            </div>
                        ) : (
                            services.map(service => (
                                <div
                                    key={service.id}
                                    onClick={() => setSelectedService(service.id)}
                                    style={{
                                        border: `1px solid ${selectedService === service.id ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)'}`,
                                        background: selectedService === service.id ? 'rgba(124, 58, 237, 0.15)' : 'rgba(255,255,255,0.03)',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: '1rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        boxShadow: selectedService === service.id ? '0 0 15px -5px rgba(124, 58, 237, 0.3)' : 'none'
                                    }}
                                >
                                    <div style={{
                                        width: '20px', height: '20px', borderRadius: '50%',
                                        border: `2px solid ${selectedService === service.id ? 'var(--color-primary)' : 'var(--text-tertiary)'}`,
                                        background: selectedService === service.id ? 'var(--color-primary)' : 'transparent',
                                        flexShrink: 0,
                                        position: 'relative'
                                    }}>
                                        {selectedService === service.id && (
                                            <div style={{
                                                position: 'absolute', inset: '4px', background: '#fff', borderRadius: '50%'
                                            }} />
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: selectedService === service.id ? 'var(--color-primary-light)' : 'var(--text-primary)' }}>{service.name}</h3>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                {service.price && service.price > 0 && (
                                                    <span className="badge" style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.25)', fontSize: '0.75rem', fontWeight: 700 }}>
                                                        ₹{service.price}
                                                    </span>
                                                )}
                                                <div className="badge badge-neutral" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)', border: 'none' }}>
                                                    <i className="fas fa-clock" style={{ fontSize: '0.7em', color: 'var(--text-secondary)', marginRight: '4px' }} />
                                                    {service.estimatedWaitTime || 5}m
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-secondary" style={{ lineHeight: 1.4 }}>{service.description || 'Standard service queue'}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <button
                            className="btn btn-primary btn-lg btn-full"
                            onClick={initiateJoinFlow}
                            disabled={joining || !selectedService}
                            style={{ height: '3.25rem', fontSize: '1rem', boxShadow: '0 0 20px -5px rgba(124, 58, 237, 0.5)' }}
                        >
                            {joining ? (
                                <><i className="fas fa-circle-notch fa-spin" /> Processing...</>
                            ) : selectedServicePrice > 0 ? (
                                <><i className="fas fa-credit-card" /> Scan & Pay (₹{totalAmount})</>
                            ) : (
                                <><i className="fas fa-ticket" /> Get Ticket</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Simulated UPI QR Pay Drawer Modal */}
                {showUpiModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
                    }}>
                        <div className="card animate-fade-in" style={{
                            maxWidth: '440px', width: '100%', padding: '2.5rem',
                            background: 'rgba(19, 19, 31, 0.95)', border: '1px solid rgba(139, 92, 246, 0.3)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)', textAlign: 'center'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ textAlign: 'left' }}>
                                    <span className="badge" style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.3)', fontSize: '0.65rem' }}>
                                        UPI SECURE GATEWAY
                                    </span>
                                    <h3 style={{ fontWeight: 800, marginTop: '0.25rem', color: 'var(--text-primary)', fontSize: '1.25rem' }}>Scan & Pay</h3>
                                </div>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '0.4rem 0.5rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: 'none' }}
                                    onClick={() => setShowUpiModal(false)}
                                >
                                    <i className="fas fa-xmark" />
                                </button>
                            </div>

                            <div style={{ margin: '1.5rem 0' }}>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    Amount to Pay:
                                </div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
                                    ₹{totalAmount}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                    {selectedServiceDetails?.name} • {groupSize} {groupSize > 1 ? 'People' : 'Person'}
                                </div>
                            </div>

                            {/* Beautiful Simulated QR Code */}
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

                            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '2rem' }}>
                                Scan this QR using **GPAY, PhonePe, Paytm, or BHIM** app to transfer securely.
                                <br />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Simulated Transaction ID: <code>{simulatedTxnId}</code></span>
                            </p>

                            <button
                                type="button"
                                className="btn btn-primary btn-full"
                                onClick={() => executeBooking('paid', totalAmount, simulatedTxnId)}
                                disabled={joining}
                                style={{
                                    padding: '0.875rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, var(--color-success), #059669)',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                                    color: '#white',
                                    cursor: 'pointer'
                                }}
                            >
                                {joining ? (
                                    <><i className="fas fa-circle-notch fa-spin" /> Verifying UPI...</>
                                ) : (
                                    <><i className="fas fa-check-circle" /> Confirm Simulated UPI App Payment</>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                <div className="text-center text-muted" style={{ marginTop: '2rem', fontSize: '0.75rem' }}>
                    Powered by <strong style={{ color: 'var(--text-primary)' }}>SkipQ Enterprise</strong>
                </div>
            </div>
        </div>
    );
}

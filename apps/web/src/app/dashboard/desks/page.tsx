'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import styles from '../dashboard.module.css';

interface Desk {
    id: string;
    name: string;
    serviceId: string;
    isActive: boolean;
    assignedOperatorId: string | null;
    approvalStatus?: string; // pending, approved
    tier?: string; // normal, vip, priority
    requestDetails?: string;
}

interface Service {
    id: string;
    name: string;
    branchId: string;
}

interface Branch {
    id: string;
    name: string;
}

export default function DesksManagementPage() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [services, setServices] = useState<Service[]>([]);
    const [selectedService, setSelectedService] = useState('');
    const [desks, setDesks] = useState<Desk[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newDeskName, setNewDeskName] = useState('');
    const [selectedTier, setSelectedTier] = useState<'normal' | 'vip' | 'priority'>('normal');
    const [specifications, setSpecifications] = useState('');
    const [cardNumber, setCardNumber] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState<string | null>(null);

    // 1. Fetch Branches on mount
    const fetchBranches = useCallback(async () => {
        setLoading(true);
        try {
            const orgRes = await apiGet<any[]>('/api/org/orgs');
            if (orgRes.success && orgRes.data && orgRes.data.length > 0) {
                const orgId = orgRes.data[0].id;
                const branchRes = await apiGet<Branch[]>(`/api/org/orgs/${orgId}/branches`);
                if (branchRes.success && branchRes.data) {
                    setBranches(branchRes.data);
                    if (branchRes.data.length > 0) {
                        setSelectedBranch(branchRes.data[0].id);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to load branches:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // 2. Fetch Services when branch changes
    const fetchServices = useCallback(async () => {
        if (!selectedBranch) return;
        try {
            const res = await apiGet<Service[]>(`/api/org/branches/${selectedBranch}/services`);
            if (res.success && res.data) {
                setServices(res.data);
                if (res.data.length > 0) {
                    setSelectedService(res.data[0].id);
                } else {
                    setServices([]);
                    setSelectedService('');
                    setDesks([]);
                }
            }
        } catch (err) {
            console.error('Failed to load services:', err);
        }
    }, [selectedBranch]);

    // 3. Fetch Desks when service changes
    const fetchDesks = useCallback(async () => {
        if (!selectedService) {
            setDesks([]);
            return;
        }
        try {
            const res = await apiGet<Desk[]>(`/api/org/services/${selectedService}/desks`);
            if (res.success && res.data) {
                setDesks(res.data);
            }
        } catch (err) {
            console.error('Failed to load desks:', err);
        }
    }, [selectedService]);

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices, selectedBranch]);

    useEffect(() => {
        fetchDesks();
    }, [fetchDesks, selectedService]);

    // Request Paid Desk Counter Action (Client CANNOT create directly anymore)
    const handleRequestDesk = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDeskName.trim() || !selectedService) {
            setError('Please enter a desk name');
            return;
        }
        if (!cardNumber.trim()) {
            setError('Please provide simulated card details for checkout.');
            return;
        }
        setError('');
        setSubmitting(true);

        try {
            const apiHost = window.location.hostname;
            const res = await fetch(`http://${apiHost}:3001/api/billing/request-desk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceId: selectedService,
                    deskName: newDeskName.trim(),
                    tier: selectedTier,
                    requestDetails: specifications.trim()
                })
            });

            const data = await res.json();
            if (data.success) {
                setNewDeskName('');
                setSpecifications('');
                setCardNumber('');
                setSelectedTier('normal');
                setShowForm(false);
                setToast('Counter Expansion requested! Awaiting Super-Admin manual approval.');
                setTimeout(() => setToast(null), 4000);
                fetchDesks();
            } else {
                setError(data.error || 'Failed to submit desk request');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setSubmitting(false);
        }
    };

    const getPriceByTier = (tier: string) => {
        if (tier === 'vip') return '₹999/mo';
        if (tier === 'priority') return '₹1,499/mo';
        return '₹499/mo';
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '6rem' }}>
                <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2.5rem', color: 'var(--color-primary)' }} />
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            
            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000,
                    padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)',
                    background: 'var(--color-primary)', color: '#ffffff', fontWeight: 600,
                    boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    animation: 'fadeIn 0.3s ease-out'
                }}>
                    <i className="fas fa-circle-check" />
                    {toast}
                </div>
            )}

            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontWeight: 800 }}>Counter Station Desks</h1>
                    <p className="text-secondary" style={{ fontSize: 'var(--fs-sm)' }}>Edit service priorities, configure QRs, or request counter station expansion packages.</p>
                </div>
                <button 
                    className="btn btn-primary" 
                    onClick={() => { setShowForm(true); setError(''); }}
                    disabled={!selectedService}
                >
                    <i className="fas fa-credit-card" /> Request Desk Expansion
                </button>
            </div>

            {/* Filter Panel (Branch + Service selection) */}
            <div className="card" style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div className="input-group" style={{ flex: 1, minWidth: '220px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>1. Select Branch</label>
                    <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>

                <div className="input-group" style={{ flex: 1, minWidth: '220px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>2. Select Service Queue</label>
                    {services.length === 0 ? (
                        <select disabled><option>No services found</option></select>
                    ) : (
                        <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
                            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    )}
                </div>
            </div>

            {/* Desk Station List Grid */}
            {desks.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem', border: '1px dashed var(--border-color)' }}>
                    <i className="fas fa-desktop" style={{ fontSize: '2.5rem', marginBottom: '1.25rem', color: 'var(--text-tertiary)', display: 'block' }} />
                    <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>No Counter Stations Configured</h3>
                    <p className="text-secondary" style={{ fontSize: 'var(--fs-sm)', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
                        To keep operations secure and billing integral, new countertops must be requested and paid for based on desk priority levels.
                    </p>
                    <button 
                        className="btn btn-secondary" 
                        onClick={() => { setShowForm(true); setError(''); }}
                        disabled={!selectedService}
                    >
                        Request Counter expansion
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {desks.map(desk => (
                        <div key={desk.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <div style={{
                                        width: '40px', height: '40px',
                                        background: 'var(--color-primary-subtle)', color: 'var(--color-primary)',
                                        borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '1px solid rgba(124, 58, 237, 0.12)'
                                    }}>
                                        <i className="fas fa-desktop" />
                                    </div>
                                    <div>
                                        <h4 style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{desk.name}</h4>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>Tier: <strong style={{ color: 'var(--color-primary-light)' }}>{desk.tier || 'Normal'}</strong></span>
                                    </div>
                                </div>
                                <span className={`badge ${
                                    desk.approvalStatus === 'pending' ? 'badge-warning' :
                                    desk.isActive ? 'badge-success' : 'badge-danger'
                                }`}>
                                    {desk.approvalStatus === 'pending' ? 'Awaiting Approval' : desk.isActive ? 'Approved' : 'Offline'}
                                </span>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

                            {/* Operator info section */}
                            <div>
                                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Active Station Operator</span>
                                {desk.approvalStatus === 'pending' ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', padding: '0.75rem 1rem', border: '1px dashed var(--color-warning)', background: 'var(--color-warning-bg)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem' }}>
                                        <i className="fas fa-lock" />
                                        <span>Station locked until billing is verified</span>
                                    </div>
                                ) : desk.assignedOperatorId ? (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <i className="fas fa-circle-user" style={{ color: 'var(--color-primary)' }} />
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{desk.assignedOperatorId}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-tertiary)', padding: '0.75rem 1rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.825rem' }}>
                                        <i className="fas fa-user-slash" />
                                        <span>No Operator Logged In</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Request Desk Modal Overlay */}
            {showForm && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }} onClick={() => setShowForm(false)}>
                    <div className="card animate-fade-in" style={{
                        maxWidth: '480px', width: '100%', padding: '2.5rem',
                        background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-lg)'
                    }} onClick={(e) => e.stopPropagation()}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontWeight: 800 }}>Request Counter Station</h3>
                            <button className="btn btn-secondary btn-sm" style={{ padding: '0.4rem 0.5rem', borderRadius: '50%' }} onClick={() => setShowForm(false)}>
                                <i className="fas fa-xmark" />
                            </button>
                        </div>

                        {error && (
                            <div style={{
                                padding: '0.6rem 0.8rem', background: 'var(--color-danger-bg)',
                                color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.15)',
                                borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.825rem',
                                display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}>
                                <i className="fas fa-triangle-exclamation" /> {error}
                            </div>
                        )}

                        <form onSubmit={handleRequestDesk}>
                            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Requested Station Name</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Counter 3, Consulting Suite B" 
                                    value={newDeskName}
                                    onChange={(e) => setNewDeskName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Select Priority Tier</label>
                                <select value={selectedTier} onChange={(e) => setSelectedTier(e.target.value as any)}>
                                    <option value="normal">Normal Counter — (₹499/mo)</option>
                                    <option value="vip">VIP priority Counter — (₹999/mo)</option>
                                    <option value="priority">Priority triage Counter — (₹1,499/mo)</option>
                                </select>
                            </div>

                            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Specialized Counter Specifications</label>
                                <textarea 
                                    placeholder="Provide counter physical parameters or dedicated services mapping requests..." 
                                    value={specifications}
                                    onChange={(e) => setSpecifications(e.target.value)}
                                    rows={3}
                                    style={{ resize: 'none', padding: '0.75rem', fontSize: '0.875rem' }}
                                />
                            </div>

                            {/* Secure Billing Checkout */}
                            <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                                    <span>Recurring Monthly Charge:</span>
                                    <span style={{ color: 'var(--color-primary-light)' }}>{getPriceByTier(selectedTier)}</span>
                                </div>
                                <div className="input-group">
                                    <label style={{ fontSize: '0.65rem' }}>Verify Checkout Corporate Card Number</label>
                                    <input 
                                        type="text" 
                                        placeholder="4111 2222 3333 4444" 
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(e.target.value)}
                                        style={{ height: '38px', fontSize: '0.85rem' }}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting || !newDeskName.trim()}>
                                    {submitting ? (
                                        <><i className="fas fa-circle-notch fa-spin" /> Submitting...</>
                                    ) : (
                                        'Request Counter'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '@/lib/api';

interface SupportTicket {
    id: string;
    orgId: string;
    orgName: string;
    subject: string;
    description: string;
    status: string; // open, resolved
    createdAt: string;
}

interface UserProfile {
    organizations: {
        orgId: string;
        orgName: string;
        role: string;
    }[];
}

export default function SupportTicketsPage() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [orgId, setOrgId] = useState('');
    const [orgName, setOrgName] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState<string | null>(null);

    const loadTickets = useCallback(async () => {
        try {
            // Get user profile to extract org
            const profileRes = await apiGet<UserProfile>('/api/users/me');
            if (profileRes.success && profileRes.data && profileRes.data.organizations.length > 0) {
                const targetOrg = profileRes.data.organizations[0];
                setOrgId(targetOrg.orgId);
                setOrgName(targetOrg.orgName);

                // Fetch support tickets
                const ticketsRes = await apiGet<SupportTicket[]>('/api/billing/support-tickets');
                if (ticketsRes.success && ticketsRes.data) {
                    // Filter tickets belonging to this organization
                    const orgTickets = ticketsRes.data.filter(t => t.orgId === targetOrg.orgId);
                    setTickets(orgTickets.reverse());
                }
            }
        } catch (err) {
            console.error('Failed to load support tickets:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    const handleRaiseTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !description.trim()) {
            setError('Please provide a subject and details.');
            return;
        }
        setError('');
        setSubmitting(true);

        try {
            const res = await apiPost('/api/billing/support-ticket', {
                orgId,
                orgName,
                subject: subject.trim(),
                description: description.trim()
            });

            if (res.success) {
                setSubject('');
                setDescription('');
                setShowForm(false);
                setToast('Support query raised successfully!');
                setTimeout(() => setToast(null), 3000);
                loadTickets();
            } else {
                setError(res.error || 'Failed to submit support ticket.');
            }
        } catch (err) {
            setError('Connection failed.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '6rem' }}>
                <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2.5rem', color: 'var(--color-primary)' }} />
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ padding: '1rem 0' }}>
            
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

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontWeight: 800 }}>Help Desk & Support</h1>
                    <p className="text-secondary" style={{ fontSize: 'var(--fs-sm)' }}>
                        Raise technical tickets directly to the SkipQ systems engineering group.
                    </p>
                </div>
                <button 
                    className="btn btn-primary" 
                    onClick={() => { setShowForm(true); setError(''); }}
                    disabled={!orgId}
                >
                    <i className="fas fa-ticket" /> Raise Ticket
                </button>
            </div>

            {/* Support Ticket list */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '1.125rem' }}>Open Support Queries</h3>
                    <span className="badge badge-primary">{tickets.length} Tickets</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
                                <th style={{ padding: '1.25rem 1.5rem' }}>Ticket ID</th>
                                <th style={{ padding: '1.25rem 1.5rem' }}>Subject Query</th>
                                <th style={{ padding: '1.25rem 1.5rem' }}>Raised Date</th>
                                <th style={{ padding: '1.25rem 1.5rem' }}>Description Details</th>
                                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                        <i className="fas fa-life-ring" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }} />
                                        <span>No support tickets raised yet. Everything is running smoothly!</span>
                                    </td>
                                </tr>
                            ) : (
                                tickets.map(ticket => (
                                    <tr key={ticket.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                                        <td style={{ padding: '1.25rem 1.5rem', fontFamily: 'monospace', color: 'var(--color-primary-light)' }}>
                                            #{ticket.id.slice(0, 8)}
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {ticket.subject}
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>
                                            {new Date(ticket.createdAt).toLocaleDateString(undefined, {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {ticket.description}
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                            <span className={`badge ${ticket.status === 'resolved' ? 'badge-success' : 'badge-warning'}`}>
                                                {ticket.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Raise Support Ticket Modal */}
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
                            <h3 style={{ fontWeight: 800 }}>Raise Support Query</h3>
                            <button className="btn btn-secondary btn-sm" style={{ padding: '0.4rem 0.5rem', borderRadius: '50%' }} onClick={() => setShowForm(false)}>
                                <i className="fas fa-xmark" />
                            </button>
                        </div>

                        {error && (
                            <div style={{
                                padding: '0.6rem 0.8rem', background: 'var(--color-danger-bg)',
                                color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.15)',
                                borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.825rem',
                                display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}>
                                <i className="fas fa-circle-exclamation" /> {error}
                            </div>
                        )}

                        <form onSubmit={handleRaiseTicket}>
                            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                                <label>Subject Summary</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. WebSocket connection lag at Counter 2" 
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="input-group" style={{ marginBottom: '2rem' }}>
                                <label>Technical details & Specifications</label>
                                <textarea 
                                    placeholder="Please describe the issue or custom layout request in detail so our engineering team can audit..." 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                    rows={5}
                                    style={{ resize: 'none', padding: '0.75rem', lineHeight: 1.5 }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting || !subject.trim() || !description.trim()}>
                                    {submitting ? (
                                        <><i className="fas fa-circle-notch fa-spin" /> Submitting...</>
                                    ) : (
                                        'Submit Ticket'
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

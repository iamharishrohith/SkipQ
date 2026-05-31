'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '@/lib/api';

interface TokenHistory {
    id: string;
    tokenNumber: number;
    status: string;
    serviceId: string;
    serviceName: string;
    customerName: string;
    customerPhone: string;
    bookedAt: string;
}

export default function HistoryPage() {
    const [tokens, setTokens] = useState<TokenHistory[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    const loadHistory = useCallback(async () => {
        try {
            const res = await apiGet<TokenHistory[]>('/api/analytics/tokens');
            if (res.success && res.data) {
                setTokens(res.data);
            }
        } catch (err) {
            console.error('Failed to load queue history:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadHistory();
        const interval = setInterval(loadHistory, 6000); // pull history updates
        return () => clearInterval(interval);
    }, [loadHistory]);

    // Filters
    const filteredTokens = tokens.filter(token => {
        const matchesSearch = 
            token.tokenNumber.toString().includes(searchTerm) ||
            token.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            token.customerPhone.includes(searchTerm) ||
            token.serviceName.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || token.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const totalCount = tokens.length;
    const completedCount = tokens.filter(t => t.status === 'completed').length;
    const noShowCount = tokens.filter(t => t.status === 'no_show').length;
    const waitingCount = tokens.filter(t => t.status === 'waiting').length;

    return (
        <div className="animate-fade-in" style={{ padding: '1rem 0' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontWeight: 800 }}>Queue Auditing & History</h1>
                    <p className="text-secondary" style={{ fontSize: 'var(--fs-sm)' }}>Review and audit customer tokens, booking metrics, and station shifting logs.</p>
                </div>
                <button className="btn btn-secondary" onClick={() => { setLoading(true); loadHistory(); }}>
                    <i className="fas fa-rotate" /> Refresh Logs
                </button>
            </div>

            {/* Metrics Banner */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="stat-card">
                    <span className="stat-label">Total Logs Recorded</span>
                    <span className="stat-value">{totalCount}</span>
                    <span className="stat-sub">Lifetime queue tickets</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Completed Transactions</span>
                    <span className="stat-value" style={{ color: 'var(--color-success)' }}>{completedCount}</span>
                    <span className="stat-sub">Success rate: {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">No-Shows</span>
                    <span className="stat-value" style={{ color: 'var(--color-danger)' }}>{noShowCount}</span>
                    <span className="stat-sub">Missed calls</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Active Waiting</span>
                    <span className="stat-value" style={{ color: 'var(--color-primary)' }}>{waitingCount}</span>
                    <span className="stat-sub">In live queues</span>
                </div>
            </div>

            {/* Filters panel */}
            <div className="card" style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="input-group" style={{ flex: 2, minWidth: '260px' }}>
                    <input 
                        type="text" 
                        placeholder="Search by ticket #, visitor name, phone, or queue service..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ height: '46px', padding: '0 1rem' }}
                    />
                </div>
                <div className="input-group" style={{ flex: 1, minWidth: '160px' }}>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ height: '46px', padding: '0 1rem' }}
                    >
                        <option value="all">All Ticket Statuses</option>
                        <option value="waiting">Waiting</option>
                        <option value="serving">Serving</option>
                        <option value="completed">Completed</option>
                        <option value="no_show">No Show</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* History Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem' }}>
                        <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--color-primary)' }} />
                    </div>
                ) : filteredTokens.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-tertiary)' }}>
                        <i className="fas fa-clock-rotate-left" style={{ fontSize: '2.5rem', marginBottom: '1rem', display: 'block' }} />
                        <h3>No matching log history entries found</h3>
                        <p style={{ fontSize: '0.875rem', marginTop: '0.4rem' }}>Adjust your filters or book a ticket from the check-in queue gateway.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
                                    <th style={{ padding: '1.25rem 1.5rem' }}>Ticket</th>
                                    <th style={{ padding: '1.25rem 1.5rem' }}>Visitor Detail</th>
                                    <th style={{ padding: '1.25rem 1.5rem' }}>Service Queue</th>
                                    <th style={{ padding: '1.25rem 1.5rem' }}>Booked Timestamp</th>
                                    <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTokens.map(token => (
                                    <tr key={token.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                                        <td style={{ padding: '1.25rem 1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                            #{token.tokenNumber}
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{token.customerName}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{token.customerPhone}</div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                            {token.serviceName}
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>
                                            {new Date(token.bookedAt).toLocaleString(undefined, {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                                            })}
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                            <span className={`badge ${
                                                token.status === 'completed' ? 'badge-success' :
                                                token.status === 'no_show' ? 'badge-danger' :
                                                token.status === 'serving' ? 'badge-primary' :
                                                token.status === 'cancelled' ? 'badge-neutral' :
                                                'badge-warning'
                                            }`}>
                                                {token.status.toUpperCase().replace('_', ' ')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

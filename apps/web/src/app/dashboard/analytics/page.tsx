'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '@/lib/api';
import dashStyles from '../dashboard.module.css';

interface ServiceStats {
    serviceId: string;
    serviceName: string;
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    avgServiceTimeMin: number;
}

interface HourlyData {
    hour: number;
    count: number;
}

export default function AnalyticsPage() {
    const [stats, setStats] = useState<ServiceStats[]>([]);
    const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState('');

    const fetchAnalytics = useCallback(async () => {
        // Get branch overview (uses first org's first branch for demo)
        const orgRes = await apiGet<any>('/api/org/orgs');
        if (orgRes.success && orgRes.data?.length) {
            const branchRes = await apiGet<any>(`/api/org/orgs/${orgRes.data[0].id}/branches`);
            if (branchRes.success && branchRes.data?.length) {
                const branchId = branchRes.data[0].id;
                const overviewRes = await apiGet<any>(`/api/analytics/branch/${branchId}/overview`);
                if (overviewRes.success && overviewRes.data) {
                    setStats(overviewRes.data);
                    if (overviewRes.data.length > 0 && !selectedService) {
                        setSelectedService(overviewRes.data[0].serviceId);
                    }
                }
            }
        }
        setLoading(false);
    }, [selectedService]);

    const fetchHourly = useCallback(async () => {
        if (!selectedService) return;
        const res = await apiGet<HourlyData[]>(`/api/analytics/service/${selectedService}/hourly`);
        if (res.success && res.data) {
            setHourlyData(res.data);
        }
    }, [selectedService]);

    useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);
    useEffect(() => { fetchHourly(); }, [fetchHourly]);

    // Simple bar chart renderer
    const maxCount = Math.max(...hourlyData.map(d => d.count), 1);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '4rem' }}><i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }} /></div>;
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>Analytics</h1>
                    <p className="text-secondary" style={{ fontSize: 'var(--fs-sm)' }}>Queue performance overview</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid-4" style={{ marginBottom: 'var(--space-2xl)' }}>
                <div className="stat-card">
                    <span className="stat-label">Total Tokens</span>
                    <span className="stat-value">{stats.reduce((sum, s) => sum + s.total, 0)}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Completed</span>
                    <span className="stat-value" style={{ color: 'var(--color-success)' }}>
                        {stats.reduce((sum, s) => sum + s.completed, 0)}
                    </span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Cancelled</span>
                    <span className="stat-value" style={{ color: 'var(--color-warning)' }}>
                        {stats.reduce((sum, s) => sum + s.cancelled, 0)}
                    </span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">No Shows</span>
                    <span className="stat-value" style={{ color: 'var(--color-danger)' }}>
                        {stats.reduce((sum, s) => sum + s.noShow, 0)}
                    </span>
                </div>
            </div>

            {/* Service Breakdown Table */}
            <div className="card" style={{ marginBottom: 'var(--space-2xl)' }}>
                <div style={{ padding: 'var(--space-lg)', borderBottom: '1px solid var(--border-color)' }}>
                    <h3 style={{ margin: 0 }}>Service Breakdown</h3>
                </div>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Service</th>
                                <th>Total</th>
                                <th>Completed</th>
                                <th>Cancelled</th>
                                <th>No Show</th>
                                <th>Avg Time</th>
                                <th>Completion %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.map(stat => (
                                <tr key={stat.serviceId} onClick={() => setSelectedService(stat.serviceId)} style={{ cursor: 'pointer', background: selectedService === stat.serviceId ? 'var(--bg-elevated)' : undefined }}>
                                    <td><strong>{stat.serviceName}</strong></td>
                                    <td>{stat.total}</td>
                                    <td><span className="badge badge-success">{stat.completed}</span></td>
                                    <td><span className="badge badge-warning">{stat.cancelled}</span></td>
                                    <td><span className="badge badge-danger">{stat.noShow}</span></td>
                                    <td>{stat.avgServiceTimeMin.toFixed(1)} min</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                            <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                                                <div style={{ width: `${stat.total ? (stat.completed / stat.total) * 100 : 0}%`, height: '100%', borderRadius: '3px', background: 'var(--color-success)', transition: 'width 600ms ease' }} />
                                            </div>
                                            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                                                {stat.total ? Math.round((stat.completed / stat.total) * 100) : 0}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {stats.length === 0 && (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>No analytics data yet</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Hourly Chart */}
            {hourlyData.length > 0 && (
                <div className="card">
                    <div style={{ padding: 'var(--space-lg)', borderBottom: '1px solid var(--border-color)' }}>
                        <h3 style={{ margin: 0 }}>Peak Hours</h3>
                    </div>
                    <div style={{ padding: 'var(--space-lg)', display: 'flex', alignItems: 'flex-end', gap: '4px', height: '200px' }}>
                        {Array.from({ length: 24 }, (_, hour) => {
                            const data = hourlyData.find(d => d.hour === hour);
                            const count = data?.count || 0;
                            const heightPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                            return (
                                <div key={hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <div
                                        style={{
                                            width: '100%',
                                            height: `${Math.max(heightPct, 2)}%`,
                                            borderRadius: '3px 3px 0 0',
                                            background: count > 0 ? `linear-gradient(180deg, var(--color-primary), #7c3aed)` : 'var(--bg-elevated)',
                                            transition: 'height 600ms ease',
                                            minHeight: '4px',
                                        }}
                                        title={`${hour}:00 — ${count} tokens`}
                                    />
                                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                                        {hour % 3 === 0 ? `${hour}` : ''}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../management.module.css';

interface SystemStats {
    dbSize: number;
    aofSize: number;
    counts: Record<string, number>;
    memory: {
        heapUsed: number;
        heapTotal: number;
        rss: number;
    };
    activeWebSockets: number;
    uptime: number;
}

interface LogEntry {
    op: string;
    table: string;
    payload: any;
    timestamp: number;
    raw?: string;
}

interface ClientOrg {
    id: string;
    name: string;
    slug: string;
    branchesCount: number;
    servicesCount: number;
    createdAt: string;
}

interface PendingDesk {
    id: string;
    name: string;
    serviceId: string;
    serviceName?: string;
    orgName?: string;
    tier: string;
    requestDetails: string;
    approvalStatus: string;
}

interface SupportTicket {
    id: string;
    orgId: string;
    orgName: string;
    subject: string;
    description: string;
    status: string; // open, resolved
    createdAt: string;
}

interface SaaSPlan {
    id: string;
    name: string;
    monthlyPrice: number;
    maxBranches: number;
    maxDesks: number;
    features: string[];
}

export default function ManagementDashboardPage() {
    const router = useRouter();
    
    // Core telemetry
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [clients, setClients] = useState<ClientOrg[]>([]);
    const [loading, setLoading] = useState(true);
    const [compacting, setCompacting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // SaaS revenue operations states
    const [pendingDesks, setPendingDesks] = useState<PendingDesk[]>([]);
    const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
    const [plans, setPlans] = useState<SaaSPlan[]>([]);
    
    // UPI transaction & Balancer states
    const [transactions, setTransactions] = useState<any[]>([]);
    const [balancerLogs, setBalancerLogs] = useState<any[]>([]);
    const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
    
    // Pricing editor states
    const [starterPrice, setStarterPrice] = useState(1999);
    const [proPrice, setProPrice] = useState(4999);
    const [enterprisePrice, setEnterprisePrice] = useState(12999);
    
    const [actionLoading, setActionLoading] = useState(false);

    // Format bytes to readable size
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Format uptime seconds to string
    const formatUptime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h}h ${m}m ${s}s`;
    };

    const fetchAllData = useCallback(async () => {
        try {
            const apiHost = window.location.hostname;
            const port = '3001';

            // Get Stats
            const statsRes = await fetch(`http://${apiHost}:${port}/api/system/stats`);
            const statsData = await statsRes.json();
            if (statsData.success) setStats(statsData.data);

            // Get AOF Logs
            const logsRes = await fetch(`http://${apiHost}:${port}/api/system/logs`);
            const logsData = await logsRes.json();
            if (logsData.success) setLogs(logsData.data);

            // Get Clients
            const clientsRes = await fetch(`http://${apiHost}:${port}/api/system/clients`);
            const clientsData = await clientsRes.json();
            if (clientsData.success) setClients(clientsData.data);

            // Get UPI Transactions
            const txRes = await fetch(`http://${apiHost}:${port}/api/billing/transactions`);
            const txData = await txRes.json();
            if (txData.success && txData.data) {
                setTransactions(txData.data);
            }

            // Get Balancer Audit Logs from database table
            const auditRes = await fetch(`http://${apiHost}:${port}/api/system/table/auditLogs`);
            const auditData = await auditRes.json();
            if (auditData.success && auditData.data) {
                const balancerOnly = auditData.data.filter((l: any) => l.type === 'balancer_auto_route').reverse();
                setBalancerLogs(balancerOnly);
            }

            // Get Pending Desks Counter Requests
            const desksRes = await fetch(`http://${apiHost}:${port}/api/system/table/desks`);
            const desksData = await desksRes.json();
            if (desksData.success && desksData.data) {
                const pending = desksData.data.filter((d: any) => d.approvalStatus === 'pending');
                
                // Map desk meta details
                const mappedPending = pending.map((d: any) => {
                    return {
                        id: d.id,
                        name: d.name,
                        serviceId: d.serviceId,
                        serviceName: 'Core Triage Queue',
                        orgName: 'Registered Merchant',
                        tier: d.tier || 'normal',
                        requestDetails: d.requestDetails || '',
                        approvalStatus: d.approvalStatus
                    };
                });
                setPendingDesks(mappedPending);
            }

            // Get Support Tickets
            const ticketsRes = await fetch(`http://${apiHost}:${port}/api/billing/support-tickets`);
            const ticketsData = await ticketsRes.json();
            if (ticketsData.success && ticketsData.data) {
                setSupportTickets(ticketsData.data.reverse());
            }

            // Get Subscription Packages
            const pkgRes = await fetch(`http://${apiHost}:${port}/api/billing/packages`);
            const pkgData = await pkgRes.json();
            if (pkgData.success && pkgData.data) {
                setPlans(pkgData.data);
                const starter = pkgData.data.find((p: any) => p.id === 'starter');
                const pro = pkgData.data.find((p: any) => p.id === 'pro');
                const enterprise = pkgData.data.find((p: any) => p.id === 'enterprise');
                if (starter) setStarterPrice(starter.monthlyPrice);
                if (pro) setProPrice(pro.monthlyPrice);
                if (enterprise) setEnterprisePrice(enterprise.monthlyPrice);
            }

        } catch (err) {
            console.error('Failed to load super-admin panel data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Check Authentication on mount
    useEffect(() => {
        const isAuth = localStorage.getItem('mgmt_authenticated') === 'true';
        if (!isAuth) {
            router.push('/management/login');
            return;
        }

        fetchAllData();
        const interval = setInterval(fetchAllData, 3000); // pull updates every 3s
        return () => clearInterval(interval);
    }, [router, fetchAllData]);

    const handleCompaction = async () => {
        setCompacting(true);
        try {
            const apiHost = window.location.hostname;
            const res = await fetch(`http://${apiHost}:3001/api/system/compact`, {
                method: 'POST'
            });
            const data = await res.json();
            if (data.success) {
                setToast({ message: 'Compaction successful! Log file truncated, snapshot consolidated to db.json.', type: 'success' });
                fetchAllData();
            } else {
                setToast({ message: data.error || 'Compaction failed', type: 'error' });
            }
        } catch (err) {
            setToast({ message: 'Network connection failed', type: 'error' });
        } finally {
            setCompacting(false);
            setTimeout(() => setToast(null), 4000);
        }
    };

    // Approve Desk Request Action
    const handleApproveDesk = async (deskId: string) => {
        setActionLoading(true);
        try {
            const apiHost = window.location.hostname;
            // Purge pending and set approved and active
            const res = await fetch(`http://${apiHost}:3001/api/system/table/desks/${deskId}`, {
                method: 'DELETE'
            });
            const delData = await res.json();
            if (delData.success) {
                // Reinsert as approved & active counter!
                const deskName = pendingDesks.find(d => d.id === deskId)?.name || 'Approved Counter';
                const serviceId = pendingDesks.find(d => d.id === deskId)?.serviceId || '';
                const tier = pendingDesks.find(d => d.id === deskId)?.tier || 'normal';

                const reInsertRes = await fetch(`http://${apiHost}:3001/api/org/services/${serviceId}/desks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: deskName })
                });
                const reData = await reInsertRes.json();
                if (reData.success) {
                    setToast({ message: 'Counter Station approved and manual service mapped successfully!', type: 'success' });
                    fetchAllData();
                }
            }
        } catch (err) {
            setToast({ message: 'Failed to approve desk.', type: 'error' });
        } finally {
            setActionLoading(false);
            setTimeout(() => setToast(null), 4000);
        }
    };

    // Resolve Support Ticket Action
    const handleResolveTicket = async (ticketId: string) => {
        setActionLoading(true);
        try {
            const apiHost = window.location.hostname;
            // Update ticket status to resolved in db
            await fetch(`http://${apiHost}:3001/api/system/table/supportTickets/${ticketId}`, {
                method: 'DELETE'
            });
            setToast({ message: 'Support ticket resolved and archived successfully!', type: 'success' });
            fetchAllData();
        } catch (err) {
            setToast({ message: 'Failed to resolve ticket.', type: 'error' });
        } finally {
            setActionLoading(false);
            setTimeout(() => setToast(null), 3000);
        }
    };

    // Update SaaS package rates dynamically
    const handleUpdateRates = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const apiHost = window.location.hostname;
            const updatedPackages = plans.map(p => {
                if (p.id === 'starter') return { ...p, monthlyPrice: starterPrice };
                if (p.id === 'pro') return { ...p, monthlyPrice: proPrice };
                if (p.id === 'enterprise') return { ...p, monthlyPrice: enterprisePrice };
                return p;
            });

            const res = await fetch(`http://${apiHost}:3001/api/billing/update-packages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ packages: updatedPackages })
            });
            const data = await res.json();
            if (data.success) {
                setToast({ message: 'Ecosystem SaaS subscription rates updated successfully!', type: 'success' });
                fetchAllData();
            }
        } catch (err) {
            setToast({ message: 'Failed to update packages rates.', type: 'error' });
        } finally {
            setActionLoading(false);
            setTimeout(() => setToast(null), 3000);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('mgmt_authenticated');
        router.push('/');
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2.5rem', color: 'var(--color-primary)' }} />
            </div>
        );
    }

    const totalRows = stats ? Object.values(stats.counts).reduce((a, b) => a + b, 0) : 0;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
            
            {/* Header */}
            <header style={{
                background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)',
                padding: '1.25rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'sticky', top: 0, zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '40px', height: '40px', background: 'var(--color-warning-bg)',
                        color: 'var(--color-warning)', borderRadius: 'var(--radius-md)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(245, 158, 11, 0.15)'
                    }}>
                        <i className="fas fa-sliders" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 900 }}>SkipQ Telemetry Dashboard</h1>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Super-Admin Platform Operations</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Link href="/management/database" className="btn btn-secondary">
                        <i className="fas fa-database" /> Visual DB Explorer
                    </Link>
                    <button className="btn btn-secondary" onClick={fetchAllData}>
                        <i className="fas fa-arrows-rotate" /> Sync
                    </button>
                    <button className="btn btn-danger" onClick={handleLogout}>
                        <i className="fas fa-right-from-bracket" /> Exit
                    </button>
                </div>
            </header>

            {/* Notification Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000,
                    padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)',
                    background: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
                    color: '#ffffff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem',
                    boxShadow: 'var(--shadow-lg)', animation: 'fadeIn 0.3s ease-out'
                }}>
                    <i className={toast.type === 'success' ? 'fas fa-circle-check' : 'fas fa-triangle-exclamation'} />
                    {toast.message}
                </div>
            )}

            <main className={styles['mgmt-container']} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Core metrics */}
                <div className={styles['telemetry-grid']} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.25rem' }}>
                    <div className="stat-card">
                        <span className="stat-label">Snapshot Space</span>
                        <span className="stat-value">{stats ? formatBytes(stats.dbSize) : '—'}</span>
                        <span className="stat-sub">db.json disk baseline</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">AOF log volume</span>
                        <span className="stat-value" style={{ color: stats && stats.aofSize > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                            {stats ? formatBytes(stats.aofSize) : '—'}
                        </span>
                        <span className="stat-sub">uncompacted transactions</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">WebSocket traffic</span>
                        <span className="stat-value" style={{ color: 'var(--color-primary-light)' }}>
                            {stats?.activeWebSockets ?? 0} listeners
                        </span>
                        <span className="stat-sub">active mobile tickets</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">SaaS MRR Load</span>
                        <span className="stat-value" style={{ color: 'var(--color-success)' }}>
                            ₹{clients.length * 4999 + pendingDesks.length * 999}
                        </span>
                        <span className="stat-sub">simulated ARR footprint</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Gross UPI Receipts</span>
                        <span className="stat-value" style={{ color: '#fbbf24' }}>
                            ₹{transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0)}
                        </span>
                        <span className="stat-sub">Booking, fast-passes & spot-offers</span>
                    </div>
                </div>

                {/* Approvals section & Pricing package adjuster */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
                    
                    {/* Desk Station approvals queue */}
                    <div className="card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ fontWeight: 800 }}>Desk Counter Expansion Approvals</h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manual service mapping requests submitted by clients.</span>
                            </div>
                            <span className="badge badge-warning">{pendingDesks.length} Pending</span>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                                        <th style={{ padding: '0.75rem 1rem' }}>Merchant / Queue</th>
                                        <th style={{ padding: '0.75rem 1rem' }}>Requested Counter</th>
                                        <th style={{ padding: '0.75rem 1rem' }}>Paid Tier</th>
                                        <th style={{ padding: '0.75rem 1rem' }}>Custom Specs</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingDesks.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                                                <i className="fas fa-desktop" style={{ fontSize: '1.5rem', marginBottom: '0.4rem', display: 'block' }} />
                                                No pending counter station approvals.
                                            </td>
                                        </tr>
                                    ) : (
                                        pendingDesks.map(desk => (
                                            <tr key={desk.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.825rem' }}>
                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                    <div style={{ fontWeight: 600 }}>{desk.orgName}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{desk.serviceName}</div>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                                                    {desk.name}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                    <span className={`badge ${desk.tier === 'vip' ? 'badge-primary' : desk.tier === 'priority' ? 'badge-danger' : 'badge-neutral'}`}>
                                                        {desk.tier.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {desk.requestDetails}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                                    <button 
                                                        className="btn btn-success btn-sm" 
                                                        onClick={() => handleApproveDesk(desk.id)}
                                                        disabled={actionLoading}
                                                    >
                                                        <i className="fas fa-check" /> Approve
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Subscription pricing package price editor */}
                    <div className="card" style={{ padding: '2rem' }}>
                        <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Ecosystem SaaS Rates</h3>
                        <p className="text-secondary" style={{ fontSize: '0.8rem', marginBottom: '1.5rem' }}>Update monthly pricing tiers dynamically across all multi-tenant databases.</p>

                        <form onSubmit={handleUpdateRates} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="input-group">
                                <label style={{ fontSize: '0.7rem' }}>Starter Monthly Price (INR)</label>
                                <input 
                                    type="number" 
                                    value={starterPrice} 
                                    onChange={(e) => setStarterPrice(parseInt(e.target.value))}
                                    required 
                                />
                            </div>

                            <div className="input-group">
                                <label style={{ fontSize: '0.7rem' }}>Professional Monthly Price (INR)</label>
                                <input 
                                    type="number" 
                                    value={proPrice} 
                                    onChange={(e) => setProPrice(parseInt(e.target.value))}
                                    required 
                                />
                            </div>

                            <div className="input-group">
                                <label style={{ fontSize: '0.7rem' }}>Enterprise Base Price (INR)</label>
                                <input 
                                    type="number" 
                                    value={enterprisePrice} 
                                    onChange={(e) => setEnterprisePrice(parseInt(e.target.value))}
                                    required 
                                />
                            </div>

                            <button type="submit" className="btn btn-primary btn-full" disabled={actionLoading} style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', borderColor: 'transparent', height: '3rem', fontWeight: 600 }}>
                                <i className="fas fa-floppy-disk" /> Save Plan Rates
                            </button>
                        </form>
                    </div>

                </div>

                {/* Live Client Queue monitor & Help Desk tickets */}
                <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '2rem' }}>
                    
                    {/* Live queue health grid */}
                    <div className="card" style={{ padding: '2rem' }}>
                        <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Ecosystem Queue Monitor</h3>
                        <p className="text-secondary" style={{ fontSize: '0.8rem', marginBottom: '1.5rem' }}>Live tracking of active token wait queues across merchant branches.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {clients.map(client => (
                                <div key={client.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{client.name}</div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{client.servicesCount} Services active</span>
                                    </div>
                                    <div className="badge badge-success">
                                        <span className="live-dot pulsing" style={{ marginRight: '4px' }} /> ONLINE
                                    </div>
                                </div>
                            ))}
                            {clients.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                                    No active merchants online.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Support Help Desk tickets resolver */}
                    <div className="card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ fontWeight: 800 }}>Platform Support Tickets</h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Merchant administrative queries raised to platform group.</span>
                            </div>
                            <span className="badge badge-primary">{supportTickets.length} Raised</span>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                                        <th style={{ padding: '0.75rem' }}>Merchant</th>
                                        <th style={{ padding: '0.75rem' }}>Subject Query</th>
                                        <th style={{ padding: '0.75rem' }}>Description details</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {supportTickets.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                                                <i className="fas fa-circle-check" style={{ fontSize: '1.5rem', marginBottom: '0.4rem', display: 'block', color: 'var(--color-success)' }} />
                                                All support tickets resolved!
                                            </td>
                                        </tr>
                                    ) : (
                                        supportTickets.map(ticket => (
                                            <tr key={ticket.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.825rem' }}>
                                                <td style={{ padding: '0.75rem', fontWeight: 600 }}>{ticket.orgName}</td>
                                                <td style={{ padding: '0.75rem', fontWeight: 600 }}>{ticket.subject}</td>
                                                <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {ticket.description}
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => handleResolveTicket(ticket.id)} disabled={actionLoading}>
                                                        <i className="fas fa-check-double" /> Resolve
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                {/* UPI Transactions Ledger & Balancer Re-routing Logs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* UPI Ledger */}
                    <div className="card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ fontWeight: 800 }}>UPI Payments Transaction Ledger</h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Live payment logs captured via simulated UPI gateway ecosystem.</span>
                            </div>
                            <span className="badge badge-success" style={{ fontWeight: 800 }}>₹{transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0)} Total</span>
                        </div>

                        <div style={{ overflowX: 'auto', maxHeight: '380px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                                        <th style={{ padding: '0.75rem 0.5rem' }}>Client / Token</th>
                                        <th style={{ padding: '0.75rem 0.5rem' }}>Purpose</th>
                                        <th style={{ padding: '0.75rem 0.5rem' }}>Amount</th>
                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Invoice</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                                                No UPI transactions recorded yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.map((tx, idx) => (
                                            <tr key={tx.id || idx} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.825rem' }}>
                                                <td style={{ padding: '0.75rem 0.5rem' }}>
                                                    <div style={{ fontWeight: 600 }}>{tx.orgName || 'External Venue'}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Token: #{tx.tokenNumber || '—'}</div>
                                                </td>
                                                <td style={{ padding: '0.75rem 0.5rem' }}>
                                                    <span className={`badge ${
                                                        tx.purpose === 'fast_pass' ? 'badge-primary' :
                                                        tx.purpose === 'spot_offer' ? 'badge-warning' :
                                                        'badge-success'
                                                    }`} style={{ fontSize: '0.7rem' }}>
                                                        {tx.purpose?.replace('_', ' ').toUpperCase() || 'PAYMENT'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--color-success)' }}>
                                                    ₹{tx.amount}
                                                </td>
                                                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => setSelectedTransaction(tx)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                                                        <i className="fas fa-file-invoice" /> Receipt
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Deterministic Queue Balancer Allocations */}
                    <div className="card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ fontWeight: 800 }}>LBTDA Load Balancing Audit</h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Deterministic triage routing decisions compiled from queue rates.</span>
                            </div>
                            <span className="badge badge-primary">{balancerLogs.length} Re-routes</span>
                        </div>

                        <div style={{ overflowX: 'auto', maxHeight: '380px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                                        <th style={{ padding: '0.75rem 0.5rem' }}>Timestamp / Route</th>
                                        <th style={{ padding: '0.75rem 0.5rem' }}>QBI Ratio</th>
                                        <th style={{ padding: '0.75rem 0.5rem' }}>Operator Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {balancerLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                                                LBTDA running. Queues are currently balanced.
                                            </td>
                                        </tr>
                                    ) : (
                                        balancerLogs.map((log, idx) => (
                                            <tr key={log.id || idx} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.825rem' }}>
                                                <td style={{ padding: '0.75rem 0.5rem' }}>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                                                        {new Date(log.createdAt).toLocaleTimeString()}
                                                    </div>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                                                        Token #{log.details?.tokenNumber || '—'} re-routed
                                                    </div>
                                                    <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                                                        {log.details?.fromServiceName} ➔ {log.details?.toServiceName}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.75rem 0.5rem' }}>
                                                    <span className="badge badge-danger" style={{ fontStyle: 'normal', fontWeight: 'bold', fontSize: '0.725rem' }} title={`Max Triage: ${log.details?.maxTokenTriageScore}`}>
                                                        QBI: {log.details?.peerQBI || '2.00'}
                                                    </span>
                                                    <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
                                                        Primary: {log.details?.primaryQBI || '0.00'}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                                    <div><strong>{log.details?.operatorName || 'Desk Operator'}</strong></div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' }} title={log.details?.formula}>
                                                        SLA: {log.details?.targetSLA || '20 min'}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Operations Compactor & Terminal console logs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1rem' }}>
                    
                    {/* Database Operations */}
                    <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>SkipQ-DB Snapshots Compactor</h3>
                            <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>Consolidate transactions append-only log manually. Truncates transaction journal and writes consolidated state schema back to baseline JSON.</p>
                            
                            <div style={{ display: 'grid', gap: '0.8rem', background: 'var(--bg-elevated)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                                    <span>Client Organizations count:</span>
                                    <strong>{stats?.counts.organizations ?? 0}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                                    <span>Active branch networks:</span>
                                    <strong>{stats?.counts.branches ?? 0}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                                    <span>Live Queue tickets booked:</span>
                                    <strong>{stats?.counts.tokens ?? 0}</strong>
                                </div>
                            </div>
                        </div>

                        <button className="btn btn-primary btn-lg btn-full" onClick={handleCompaction} disabled={compacting || !stats || stats.aofSize === 0} style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', color: '#ffffff', borderColor: 'transparent', height: '3.5rem' }}>
                            {compacting ? (
                                <><i className="fas fa-circle-notch fa-spin" /> Consolidating Log...</>
                            ) : (
                                <><i className="fas fa-compress" /> Compact Append-Only Journal</>
                            )}
                        </button>
                    </div>

                    {/* Monospace terminal logs */}
                    <div className={styles['terminal-card']}>
                        <div className={styles['terminal-header']}>
                            <div className={styles['terminal-dots']}>
                                <span className={`${styles['terminal-dot']} ${styles['dot-red']}`} />
                                <span className={`${styles['terminal-dot']} ${styles['dot-yellow']}`} />
                                <span className={`${styles['terminal-dot']} ${styles['dot-green']}`} />
                            </div>
                            <span>AOF Transaction Log Stream</span>
                        </div>

                        <div className={styles['terminal-content']}>
                            {logs.length === 0 ? (
                                <div style={{ color: '#64748b', fontSize: '0.8rem', padding: '1.25rem', textAlign: 'center' }}>
                                    No logged transactions in AOF. Baseline consolidated.
                                </div>
                            ) : (
                                logs.map((log, index) => (
                                    <div key={index} className={styles['terminal-line']}>
                                        <span className={styles['line-time']}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        <span className={`${styles['line-op']} ${
                                            log.op === 'insert' ? styles['op-insert'] :
                                            log.op === 'update' ? styles['op-update'] :
                                            log.op === 'remove' ? styles['op-remove'] :
                                            styles['op-set']
                                        }`}>{log.op.toUpperCase()}</span>
                                        <span style={{ color: '#e2e8f0', fontSize: '0.8rem' }}>{log.table} → {JSON.stringify(log.payload)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>

            </main>

            {/* Indian localized UPI Transaction Invoice Drawer */}
            {selectedTransaction && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }} onClick={() => setSelectedTransaction(null)}>
                    <div className="card animate-fade-in" style={{
                        maxWidth: '460px', width: '100%', padding: '2.5rem',
                        background: '#ffffff', color: '#1e293b', border: '1px solid #e2e8f0',
                        boxShadow: 'var(--shadow-xl)', borderRadius: 'var(--radius-lg)', position: 'relative'
                    }} onClick={(e) => e.stopPropagation()}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px dashed #cbd5e1', paddingBottom: '1rem' }}>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem', color: '#7c3aed' }}>SKIPQ PAYMENTS</h3>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Ecosystem Transaction Receipt</span>
                            </div>
                            <button className="btn btn-secondary btn-sm" style={{ padding: '0.4rem 0.5rem', borderRadius: '50%', color: '#64748b', background: '#f1f5f9', border: 'none' }} onClick={() => setSelectedTransaction(null)}>
                                <i className="fas fa-xmark" />
                            </button>
                        </div>

                        {/* Invoice Metadata */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8rem', color: '#475569', marginBottom: '1.5rem' }}>
                            <div>
                                <strong>Invoice No:</strong>
                                <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#0f172a', fontWeight: 'bold' }}>
                                    SQ-{selectedTransaction.id.slice(0, 8).toUpperCase()}
                                </div>
                            </div>
                            <div>
                                <strong>Date & Time:</strong>
                                <div style={{ color: '#0f172a' }}>
                                    {new Date(selectedTransaction.createdAt).toLocaleString()}
                                </div>
                            </div>
                            <div>
                                <strong>Merchant Venue:</strong>
                                <div style={{ color: '#0f172a', fontWeight: 600 }}>
                                    {selectedTransaction.orgName || 'SkipQ Client Hub'}
                                </div>
                            </div>
                            <div>
                                <strong>HSN/SAC Code:</strong>
                                <div style={{ color: '#0f172a' }}>
                                    998311 (Queue Management)
                                </div>
                            </div>
                        </div>

                        {/* Invoice Table Grid */}
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1.5rem' }}>
                            <div style={{ background: '#f8fafc', display: 'grid', gridTemplateColumns: '2fr 1fr', padding: '0.75rem', fontSize: '0.75rem', fontWeight: 700, borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase' }}>
                                <span>Description / Token</span>
                                <span style={{ textAlign: 'right' }}>Amount</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', padding: '0.75rem', fontSize: '0.825rem', borderBottom: '1px dashed #e2e8f0' }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>
                                        {selectedTransaction.purpose === 'fast_pass' ? 'VIP Fast-Pass Line Skipping' :
                                         selectedTransaction.purpose === 'spot_offer' ? 'Waiting Room Spot-Offer Deal' : 'Queue Consultation Booking Fee'}
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Token Reference: #{selectedTransaction.tokenNumber}</span>
                                </div>
                                <span style={{ textAlign: 'right', fontWeight: 600 }}>₹{(selectedTransaction.amount / 1.18).toFixed(2)}</span>
                            </div>

                            {/* CGST / SGST split calculations */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
                                <span>CGST (9.0%):</span>
                                <span style={{ textAlign: 'right' }}>₹{(selectedTransaction.amount * 0.0762).toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                                <span>SGST (9.0%):</span>
                                <span style={{ textAlign: 'right' }}>₹{(selectedTransaction.amount * 0.0762).toFixed(2)}</span>
                            </div>

                            {/* Total bill */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', padding: '0.75rem', fontSize: '0.9rem', fontWeight: 800, background: '#f8fafc', color: '#0f172a' }}>
                                <span>Total Paid (INR):</span>
                                <span style={{ textAlign: 'right', color: '#16a34a' }}>₹{selectedTransaction.amount}</span>
                            </div>
                        </div>

                        {/* Approved Stamp logo */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a' }}>
                                <i className="fas fa-circle-check" style={{ fontSize: '1.25rem' }} />
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>BHIM UPI SUCCESS</div>
                                    <div style={{ fontSize: '0.65rem', color: '#15803d' }}>Txn Hash: {selectedTransaction.id.slice(0, 16)}</div>
                                </div>
                            </div>
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#16a34a', border: '1px solid #16a34a', padding: '0.2rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                                Verified
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className="btn btn-secondary" onClick={() => window.print()} style={{ flex: 1, background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#0f172a' }}>
                                <i className="fas fa-print" /> Print Receipt
                            </button>
                            <button className="btn btn-primary" onClick={() => setSelectedTransaction(null)} style={{ flex: 1 }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

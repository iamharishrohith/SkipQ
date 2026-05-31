'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../management.module.css';

interface SystemStats {
    dbSize: number;
    aofSize: number;
    counts: Record<string, number>;
}

export default function VisualDatabaseManagementPage() {
    const router = useRouter();
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [selectedTable, setSelectedTable] = useState<string>('organizations');
    const [tableRecords, setTableRecords] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [recordsLoading, setRecordsLoading] = useState(false);
    const [compacting, setCompacting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [inspectedRow, setInspectedRow] = useState<any | null>(null);

    const tables = [
        { id: 'organizations', label: 'Organizations', icon: 'fa-building' },
        { id: 'branches', label: 'Branches', icon: 'fa-network-wired' },
        { id: 'services', label: 'Services', icon: 'fa-concierge-bell' },
        { id: 'desks', label: 'Desks / Counters', icon: 'fa-desktop' },
        { id: 'tokens', label: 'Queue Tickets', icon: 'fa-ticket' },
        { id: 'user', label: 'Auth Accounts', icon: 'fa-user-lock' },
        { id: 'session', label: 'Active Sessions', icon: 'fa-key' }
    ];

    const fetchStats = useCallback(async () => {
        try {
            const apiHost = window.location.hostname;
            const res = await fetch(`http://${apiHost}:3001/api/system/stats`);
            const data = await res.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    }, []);

    const fetchTableRecords = useCallback(async (tableName: string) => {
        setRecordsLoading(true);
        setInspectedRow(null);
        try {
            const apiHost = window.location.hostname;
            const res = await fetch(`http://${apiHost}:3001/api/system/table/${tableName}`);
            const data = await res.json();
            if (data.success) {
                setTableRecords(data.data || []);
            }
        } catch (err) {
            console.error('Failed to load table records:', err);
        } finally {
            setRecordsLoading(false);
        }
    }, []);

    useEffect(() => {
        const isAuth = localStorage.getItem('mgmt_authenticated') === 'true';
        if (!isAuth) {
            router.push('/management/login');
            return;
        }

        (async () => {
            await fetchStats();
            await fetchTableRecords(selectedTable);
            setLoading(false);
        })();
    }, [router, selectedTable, fetchStats, fetchTableRecords]);

    const handleCompaction = async () => {
        setCompacting(true);
        try {
            const apiHost = window.location.hostname;
            const res = await fetch(`http://${apiHost}:3001/api/system/compact`, {
                method: 'POST'
            });
            const data = await res.json();
            if (data.success) {
                setToast({ message: 'Compaction successful! Snapshot db.json consolidates and truncates the AOF journal.', type: 'success' });
                fetchStats();
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

    const handleDeleteRecord = async (id: string) => {
        if (!confirm('Are you sure you want to delete this record? This action will append a delete transaction to the AOF log.')) return;
        try {
            const apiHost = window.location.hostname;
            const res = await fetch(`http://${apiHost}:3001/api/system/table/${selectedTable}/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                setToast({ message: 'Record deleted from database!', type: 'success' });
                fetchStats();
                fetchTableRecords(selectedTable);
            } else {
                setToast({ message: data.error || 'Failed to delete record', type: 'error' });
            }
        } catch (err) {
            setToast({ message: 'Network error', type: 'error' });
        } finally {
            setTimeout(() => setToast(null), 3000);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2.5rem', color: 'var(--color-primary)' }} />
            </div>
        );
    }

    // Format sizes
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Filter table records
    const filteredRecords = tableRecords.filter(record => {
        const query = searchTerm.toLowerCase();
        return Object.entries(record).some(([key, val]) => {
            if (val === null || val === undefined) return false;
            return val.toString().toLowerCase().includes(query);
        });
    });

    // Get all unique headers for current records
    const tableHeaders = tableRecords.length > 0 
        ? Object.keys(tableRecords[0]).filter(k => k !== 'createdAt' && k !== 'updatedAt' && k !== 'passwordHash')
        : [];

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
                        width: '40px', height: '40px', background: 'var(--color-primary-subtle)',
                        color: 'var(--color-primary)', borderRadius: 'var(--radius-md)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(124, 58, 237, 0.12)'
                    }}>
                        <i className="fas fa-database" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 900 }}>SkipQ-DB Visual Manager</h1>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Relational Inspector & AOF Engine Controller</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Link href="/management/dashboard" className="btn btn-secondary">
                        <i className="fas fa-chart-line" /> Telemetry Center
                    </Link>
                    <button className="btn btn-danger" onClick={handleCompaction} disabled={compacting || (stats?.aofSize || 0) === 0}>
                        <i className="fas fa-compress" /> Compact Snapshot
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

            {/* Main grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: 'calc(100vh - 80px)' }}>
                
                {/* Left Table Switcher */}
                <div style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border-color)', padding: '2rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Database Health Card */}
                    <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Engine Health</span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                            <span>Baseline Snapshot:</span>
                            <strong>{stats ? formatBytes(stats.dbSize) : '—'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>AOF Log journal:</span>
                            <strong style={{ color: stats && stats.aofSize > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                                {stats ? formatBytes(stats.aofSize) : '—'}
                            </strong>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-tertiary)', paddingLeft: '0.5rem', marginBottom: '0.4rem' }}>Database Tables</span>
                        
                        {tables.map(table => {
                            const rowCount = stats?.counts[table.id] ?? 0;
                            return (
                                <button
                                    key={table.id}
                                    className="btn"
                                    onClick={() => setSelectedTable(table.id)}
                                    style={{
                                        justifyContent: 'space-between',
                                        background: selectedTable === table.id ? 'var(--color-primary-subtle)' : 'transparent',
                                        color: selectedTable === table.id ? 'var(--color-primary)' : 'var(--text-secondary)',
                                        fontWeight: selectedTable === table.id ? 700 : 500,
                                        border: '1px solid transparent',
                                        padding: '0.6rem 0.8rem',
                                        textAlign: 'left'
                                    }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <i className={`fas ${table.icon}`} style={{ width: '16px' }} />
                                        {table.label}
                                    </span>
                                    <span className="badge badge-neutral" style={{ fontSize: '0.65rem', background: selectedTable === table.id ? 'rgba(124, 58, 237, 0.15)' : 'var(--bg-elevated)' }}>
                                        {rowCount}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right Viewer Panel */}
                <div style={{ padding: '2.5rem', overflowY: 'auto' }}>
                    
                    {/* Search and Table header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h2 style={{ fontWeight: 800, fontSize: '1.75rem', textTransform: 'capitalize' }}>{selectedTable} Records</h2>
                            <p className="text-secondary" style={{ fontSize: '0.875rem' }}>View, inspect, and delete raw data nodes inside the `{selectedTable}` database segment.</p>
                        </div>
                        
                        <input 
                            type="text" 
                            placeholder={`Search ${selectedTable}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ maxWidth: '300px', height: '44px', padding: '0 1rem' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: inspectedRow ? '1fr 360px' : '1fr', gap: '2rem' }}>
                        
                        {/* Table Records List */}
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            {recordsLoading ? (
                                <div style={{ padding: '6rem', textAlign: 'center' }}>
                                    <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--color-primary)' }} />
                                </div>
                            ) : filteredRecords.length === 0 ? (
                                <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                    <i className="fas fa-folder-open" style={{ fontSize: '2.5rem', marginBottom: '1rem', display: 'block' }} />
                                    <h3>No records found in this table</h3>
                                    <p style={{ fontSize: '0.875rem', marginTop: '0.4rem' }}>Table is empty or filters have excluded all entries.</p>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700 }}>
                                                <th style={{ padding: '1rem' }}>ID</th>
                                                {tableHeaders.slice(0, 4).map(head => (
                                                    <th key={head} style={{ padding: '1rem' }}>{head}</th>
                                                ))}
                                                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredRecords.map(record => (
                                                <tr key={record.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.825rem', cursor: 'pointer', background: inspectedRow?.id === record.id ? 'var(--bg-hover)' : 'transparent' }} onClick={() => setInspectedRow(record)}>
                                                    <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'var(--color-primary-light)' }}>
                                                        {record.id.slice(0, 8)}...
                                                    </td>
                                                    {tableHeaders.slice(0, 4).map(head => {
                                                        const val = record[head];
                                                        return (
                                                            <td key={head} style={{ padding: '1rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {val === null || val === undefined ? '—' : val.toString()}
                                                            </td>
                                                        );
                                                    })}
                                                    <td style={{ padding: '1rem', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                            <button className="btn btn-secondary btn-sm" style={{ padding: '0.3rem 0.5rem' }} onClick={() => setInspectedRow(record)}>
                                                                <i className="fas fa-eye" />
                                                            </button>
                                                            <button className="btn btn-danger btn-sm" style={{ padding: '0.3rem 0.5rem' }} onClick={() => handleDeleteRecord(record.id)}>
                                                                <i className="fas fa-trash-can" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Inspect Panel Overlay */}
                        {inspectedRow && (
                            <div className="card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid var(--border-hover)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4 style={{ fontWeight: 800 }}>Inspect Node Row</h4>
                                    <button className="btn btn-secondary btn-sm" style={{ borderRadius: '50%', padding: '0.3rem 0.4rem' }} onClick={() => setInspectedRow(null)}>
                                        <i className="fas fa-xmark" />
                                    </button>
                                </div>

                                <div style={{ background: '#0f172a', color: '#38bdf8', padding: '1.25rem', borderRadius: 'var(--radius-md)', fontFamily: 'monospace', fontSize: '0.8rem', overflowX: 'auto', maxHeight: '350px' }}>
                                    <pre style={{ margin: 0 }}>{JSON.stringify(inspectedRow, null, 2)}</pre>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Row ID:</span>
                                        <strong style={{ fontFamily: 'monospace' }}>{inspectedRow.id}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Created:</span>
                                        <strong>{inspectedRow.createdAt ? new Date(inspectedRow.createdAt).toLocaleString() : 'N/A'}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Updated:</span>
                                        <strong>{inspectedRow.updatedAt ? new Date(inspectedRow.updatedAt).toLocaleString() : 'N/A'}</strong>
                                    </div>
                                </div>

                                <button className="btn btn-danger btn-full" onClick={() => handleDeleteRecord(inspectedRow.id)}>
                                    <i className="fas fa-trash-can" style={{ marginRight: '0.4rem' }} /> Delete Record Node
                                </button>
                            </div>
                        )}

                    </div>

                </div>

            </div>

        </div>
    );
}

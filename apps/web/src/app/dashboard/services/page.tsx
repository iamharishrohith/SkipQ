'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import dashStyles from '../dashboard.module.css';

interface Service {
    id: string;
    name: string;
    description: string | null;
    estimatedDurationMin: number;
    maxTokens: number;
    deskType: string;
    tokenPrice: string;
    isActive: boolean;
    allowPriorityFastPass?: boolean;
    fastPassPrice?: number;
}

interface Branch {
    id: string;
    name: string;
}

export default function ServicesPage() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);

    // Form state
    const [form, setForm] = useState({
        name: '',
        description: '',
        estimatedDurationMin: 15,
        maxTokens: 100,
        deskType: 'free',
        tokenPrice: '0',
        allowPriorityFastPass: true,
        fastPassPrice: 99,
    });

    const fetchBranches = useCallback(async () => {
        // For demo — fetch first org's branches
        const res = await apiGet<any>('/api/org/orgs');
        if (res.success && res.data?.length) {
            const branchRes = await apiGet<Branch[]>(`/api/org/orgs/${res.data[0].id}/branches`);
            if (branchRes.success && branchRes.data?.length) {
                setBranches(branchRes.data);
                setSelectedBranch(branchRes.data[0].id);
            }
        }
        setLoading(false);
    }, []);

    const fetchServices = useCallback(async () => {
        if (!selectedBranch) return;
        const res = await apiGet<Service[]>(`/api/org/branches/${selectedBranch}/services`);
        if (res.success && res.data) {
            setServices(res.data);
        }
    }, [selectedBranch]);

    useEffect(() => { fetchBranches(); }, [fetchBranches]);
    useEffect(() => { fetchServices(); }, [fetchServices]);

    const handleSave = async () => {
        const payload = {
            ...form,
            fastPassPrice: Number(form.fastPassPrice),
        };
        if (editingService) {
            await apiPut(`/api/org/services/${editingService.id}`, payload);
        } else {
            await apiPost(`/api/org/branches/${selectedBranch}/services`, payload);
        }
        setShowForm(false);
        setEditingService(null);
        setForm({ 
            name: '', 
            description: '', 
            estimatedDurationMin: 15, 
            maxTokens: 100, 
            deskType: 'free', 
            tokenPrice: '0',
            allowPriorityFastPass: true,
            fastPassPrice: 99
        });
        fetchServices();
    };

    const handleEdit = (service: Service) => {
        setEditingService(service);
        setForm({
            name: service.name,
            description: service.description || '',
            estimatedDurationMin: service.estimatedDurationMin,
            maxTokens: service.maxTokens,
            deskType: service.deskType,
            tokenPrice: service.tokenPrice,
            allowPriorityFastPass: service.allowPriorityFastPass !== false,
            fastPassPrice: service.fastPassPrice || 99,
        });
        setShowForm(true);
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '4rem' }}><i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }} /></div>;
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>Services</h1>
                    <p className="text-secondary" style={{ fontSize: 'var(--fs-sm)' }}>Manage your queue services</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingService(null); setForm({ name: '', description: '', estimatedDurationMin: 15, maxTokens: 100, deskType: 'free', tokenPrice: '0', allowPriorityFastPass: true, fastPassPrice: 99 }); }}>
                    <i className="fas fa-plus" /> Add Service
                </button>
            </div>

            {/* Branch selector */}
            {branches.length > 1 && (
                <div className="input-group" style={{ maxWidth: '300px', marginBottom: 'var(--space-lg)' }}>
                    <label>Branch</label>
                    <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="input">
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
            )}

            {/* Services list */}
            <div className="table-responsive">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Duration</th>
                            <th>Max Tokens</th>
                            <th>Type</th>
                            <th>Base Price</th>
                            <th>VIP Fast-Pass</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services.map(service => (
                            <tr key={service.id}>
                                <td><strong>{service.name}</strong></td>
                                <td>{service.estimatedDurationMin} min</td>
                                <td>{service.maxTokens}</td>
                                <td>
                                    <span className={`badge ${service.deskType === 'vip' ? 'badge-primary' : service.deskType === 'paid' ? 'badge-warning' : 'badge-success'}`}>
                                        {service.deskType.toUpperCase()}
                                    </span>
                                </td>
                                <td>{parseFloat(service.tokenPrice) > 0 ? `₹${service.tokenPrice}` : 'Free'}</td>
                                <td>
                                    {service.allowPriorityFastPass !== false ? (
                                        <span className="badge badge-warning" style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)', border: 'none', color: '#111827', fontWeight: 800 }}>
                                            ⚡ Active (₹{service.fastPassPrice || 99})
                                        </span>
                                    ) : (
                                        <span className="badge badge-neutral">Disabled</span>
                                    )}
                                </td>
                                <td>
                                    <span className={`badge ${service.isActive ? 'badge-success' : 'badge-danger'}`}>
                                        {service.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <button className="btn btn-ghost" style={{ fontSize: 'var(--fs-sm)' }} onClick={() => handleEdit(service)}>
                                        <i className="fas fa-pen" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {services.length === 0 && (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>No services yet. Click &ldquo;Add Service&rdquo; to create one.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingService ? 'Edit Service' : 'Add Service'}</h3>
                            <button className="btn btn-ghost" onClick={() => setShowForm(false)}><i className="fas fa-xmark" /></button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div className="input-group">
                                <label>Service Name</label>
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. General" />
                            </div>
                            <div className="input-group">
                                <label>Description</label>
                                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
                            </div>
                            <div className="grid-2" style={{ gap: 'var(--space-md)' }}>
                                <div className="input-group">
                                    <label>Duration (min)</label>
                                    <input type="number" value={form.estimatedDurationMin} onChange={(e) => setForm({ ...form, estimatedDurationMin: parseInt(e.target.value) || 15 })} />
                                </div>
                                <div className="input-group">
                                    <label>Max Tokens</label>
                                    <input type="number" value={form.maxTokens} onChange={(e) => setForm({ ...form, maxTokens: parseInt(e.target.value) || 100 })} />
                                </div>
                            </div>
                            <div className="grid-2" style={{ gap: 'var(--space-md)' }}>
                                <div className="input-group">
                                    <label>Desk Type</label>
                                    <select value={form.deskType} onChange={(e) => setForm({ ...form, deskType: e.target.value })} className="input">
                                        <option value="free">Free</option>
                                        <option value="paid">Paid</option>
                                        <option value="vip">VIP</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Token Price (₹)</label>
                                    <input type="number" step="1" value={form.tokenPrice} onChange={(e) => setForm({ ...form, tokenPrice: e.target.value })} />
                                </div>
                            </div>

                            {/* Dynamic VIP Fast-Pass parameters */}
                            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.25rem 0' }} />
                            <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <input 
                                        type="checkbox" 
                                        id="allowPriorityFastPass"
                                        checked={form.allowPriorityFastPass} 
                                        onChange={(e) => setForm({ ...form, allowPriorityFastPass: e.target.checked })} 
                                        style={{ width: 'auto', margin: 0 }}
                                    />
                                    <label htmlFor="allowPriorityFastPass" style={{ margin: 0, fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                                        Allow Premium VIP Fast-Pass Skipping
                                    </label>
                                </div>
                                {form.allowPriorityFastPass && (
                                    <div className="input-group" style={{ margin: 0 }}>
                                        <label style={{ fontSize: '0.7rem' }}>VIP Fast-Pass Instant Skipping Upgrade Price (₹)</label>
                                        <input 
                                            type="number" 
                                            value={form.fastPassPrice} 
                                            onChange={(e) => setForm({ ...form, fastPassPrice: parseInt(e.target.value) || 99 })} 
                                            placeholder="99"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave}>
                                <i className="fas fa-save" /> {editingService ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '@/lib/api';

interface OrgMember {
    id: string;
    userId: string;
    role: string;
    userName: string;
    userEmail: string;
    createdAt: string;
}

interface UserProfile {
    id: string;
    name: string;
    email: string;
    organizations: {
        orgId: string;
        orgName: string;
        role: string;
    }[];
}

export default function TeamPage() {
    const [members, setMembers] = useState<OrgMember[]>([]);
    const [orgId, setOrgId] = useState('');
    const [orgName, setOrgName] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Form inputs
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState<'operator' | 'admin'>('operator');

    const loadTeam = useCallback(async () => {
        try {
            // Get profile and find active organization
            const profileRes = await apiGet<UserProfile>('/api/users/me');
            if (profileRes.success && profileRes.data && profileRes.data.organizations.length > 0) {
                const targetOrg = profileRes.data.organizations[0];
                setOrgId(targetOrg.orgId);
                setOrgName(targetOrg.orgName);

                // Get members of this org
                const membersRes = await apiGet<OrgMember[]>(`/api/users/org/${targetOrg.orgId}/members`);
                if (membersRes.success && membersRes.data) {
                    setMembers(membersRes.data);
                }
            } else {
                setError('No active organization associated with your account.');
            }
        } catch (err) {
            console.error('Failed to load team members:', err);
            setError('Failed to fetch team records.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTeam();
    }, [loadTeam]);

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !name.trim()) {
            setError('Please provide a name and email.');
            return;
        }
        setError('');
        setSubmitting(true);

        try {
            const res = await apiPost(`/api/users/org/${orgId}/members`, {
                email: email.trim(),
                name: name.trim(),
                phone: phone.trim(),
                role
            });

            if (res.success) {
                setEmail('');
                setName('');
                setPhone('');
                setRole('operator');
                setShowForm(false);
                loadTeam();
            } else {
                setError(res.error || 'Failed to register team member.');
            }
        } catch (err) {
            setError('Connection error occurred.');
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
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontWeight: 800 }}>Team Management</h1>
                    <p className="text-secondary" style={{ fontSize: 'var(--fs-sm)' }}>
                        Manage administrative roles and register operators for {orgName || 'your organization'}.
                    </p>
                </div>
                <button 
                    className="btn btn-primary" 
                    onClick={() => { setShowForm(true); setError(''); }}
                    disabled={!orgId}
                >
                    <i className="fas fa-user-plus" /> Onboard Operator
                </button>
            </div>

            {error && !showForm && (
                <div style={{
                    padding: '1rem', background: 'var(--color-danger-bg)',
                    color: 'var(--color-danger)', borderRadius: 'var(--radius-md)',
                    marginBottom: '1.5rem', fontSize: '0.875rem',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                    <i className="fas fa-triangle-exclamation" /> {error}
                </div>
            )}

            {/* Members Data Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '1.125rem' }}>Active Operators & Administrators</h3>
                    <span className="badge badge-primary">{members.length} Members</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
                                <th style={{ padding: '1.25rem 1.5rem' }}>Operator Name</th>
                                <th style={{ padding: '1.25rem 1.5rem' }}>Corporate Email</th>
                                <th style={{ padding: '1.25rem 1.5rem' }}>Onboard Date</th>
                                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>Security Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map(member => (
                                <tr key={member.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                                    <td style={{ padding: '1.25rem 1.5rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            background: 'var(--color-primary-subtle)', color: 'var(--color-primary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 'bold', fontSize: '0.8rem'
                                        }}>
                                            {member.userName.charAt(0).toUpperCase()}
                                        </div>
                                        {member.userName}
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>
                                        {member.userEmail}
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>
                                        {new Date(member.createdAt).toLocaleDateString(undefined, {
                                            year: 'numeric', month: 'short', day: 'numeric'
                                        })}
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                        <span className={`badge ${member.role === 'admin' ? 'badge-primary' : 'badge-success'}`}>
                                            {member.role.toUpperCase()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Operator Modal */}
            {showForm && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }} onClick={() => setShowForm(false)}>
                    <div className="card animate-fade-in" style={{
                        maxWidth: '460px', width: '100%', padding: '2rem',
                        background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-lg)'
                    }} onClick={(e) => e.stopPropagation()}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontWeight: 800 }}>Onboard New Operator</h3>
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
                                <i className="fas fa-circle-exclamation" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleAddMember}>
                            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                                <label>Operator Full Name</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. David Miller" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                                <label>Corporate Email Address</label>
                                <input 
                                    type="email" 
                                    placeholder="david@company.com" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                                <label>Contact Phone Number</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. 555-019-3890" 
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>

                            <div className="input-group" style={{ marginBottom: '2rem' }}>
                                <label>Ecosystem Security Role</label>
                                <select 
                                    value={role} 
                                    onChange={(e) => setRole(e.target.value as any)}
                                >
                                    <option value="operator">Counter Desk Operator</option>
                                    <option value="admin">Branch Administrator</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting || !email.trim() || !name.trim()}>
                                    {submitting ? (
                                        <><i className="fas fa-circle-notch fa-spin" /> Onboarding...</>
                                    ) : (
                                        'Register Member'
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

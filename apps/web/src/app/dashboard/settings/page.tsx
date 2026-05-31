'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPut } from '@/lib/api';

interface UserProfile {
    organizations: {
        orgId: string;
        orgName: string;
        role: string;
    }[];
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'profile' | 'queue' | 'branding'>('profile');
    const [orgName, setOrgName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [waitTime, setWaitTime] = useState(5);
    const [bufferCapacity, setBufferCapacity] = useState(10);
    const [enableBuffer, setEnableBuffer] = useState(true);
    const [enableSms, setEnableSms] = useState(false);
    const [autoCall, setAutoCall] = useState(false);
    const [themeColor, setThemeColor] = useState('#7c3aed');
    const [receiptText, setReceiptText] = useState('Welcome to SkipQ! Track your ticket position on your mobile.');
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const profileRes = await apiGet<UserProfile>('/api/users/me');
                if (profileRes.success && profileRes.data && profileRes.data.organizations.length > 0) {
                    setOrgName(profileRes.data.organizations[0].orgName);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        
        // Simulate save settings
        setTimeout(() => {
            setSaving(false);
            setToast('Settings saved successfully!');
            setTimeout(() => setToast(null), 3000);
        }, 800);
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
                    <h1 style={{ fontWeight: 800 }}>Ecosystem Settings</h1>
                    <p className="text-secondary" style={{ fontSize: 'var(--fs-sm)' }}>
                        Manage organization profiles, customize waiting parameters, and select brand aesthetics.
                    </p>
                </div>
            </div>

            {toast && (
                <div style={{
                    position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000,
                    padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)',
                    background: 'var(--color-success)', color: '#ffffff', fontWeight: 600,
                    boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    animation: 'fadeIn 0.3s ease-out'
                }}>
                    <i className="fas fa-circle-check" />
                    {toast}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2.5rem' }}>
                
                {/* Navigation Sidebar for tabs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button
                        className="btn"
                        onClick={() => setActiveTab('profile')}
                        style={{
                            justifyContent: 'flex-start',
                            background: activeTab === 'profile' ? 'var(--color-primary-subtle)' : 'var(--bg-surface)',
                            color: activeTab === 'profile' ? 'var(--color-primary)' : 'var(--text-secondary)',
                            fontWeight: activeTab === 'profile' ? 700 : 500,
                            border: activeTab === 'profile' ? '1px solid rgba(124, 58, 237, 0.15)' : '1px solid var(--border-color)',
                            textAlign: 'left'
                        }}
                    >
                        <i className="fas fa-building" style={{ width: '20px' }} /> Organization Profile
                    </button>
                    <button
                        className="btn"
                        onClick={() => setActiveTab('queue')}
                        style={{
                            justifyContent: 'flex-start',
                            background: activeTab === 'queue' ? 'var(--color-primary-subtle)' : 'var(--bg-surface)',
                            color: activeTab === 'queue' ? 'var(--color-primary)' : 'var(--text-secondary)',
                            fontWeight: activeTab === 'queue' ? 700 : 500,
                            border: activeTab === 'queue' ? '1px solid rgba(124, 58, 237, 0.15)' : '1px solid var(--border-color)',
                            textAlign: 'left'
                        }}
                    >
                        <i className="fas fa-gears" style={{ width: '20px' }} /> Queueing Regulations
                    </button>
                    <button
                        className="btn"
                        onClick={() => setActiveTab('branding')}
                        style={{
                            justifyContent: 'flex-start',
                            background: activeTab === 'branding' ? 'var(--color-primary-subtle)' : 'var(--bg-surface)',
                            color: activeTab === 'branding' ? 'var(--color-primary)' : 'var(--text-secondary)',
                            fontWeight: activeTab === 'branding' ? 700 : 500,
                            border: activeTab === 'branding' ? '1px solid rgba(124, 58, 237, 0.15)' : '1px solid var(--border-color)',
                            textAlign: 'left'
                        }}
                    >
                        <i className="fas fa-palette" style={{ width: '20px' }} /> Brand & Customization
                    </button>
                </div>

                {/* Tab Forms */}
                <div className="card" style={{ padding: '2.5rem' }}>
                    <form onSubmit={handleSave}>

                        {activeTab === 'profile' && (
                            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Organization Profile</h3>
                                
                                <div className="input-group">
                                    <label>Company Name</label>
                                    <input 
                                        type="text" 
                                        value={orgName} 
                                        onChange={(e) => setOrgName(e.target.value)}
                                        required 
                                    />
                                </div>

                                <div className="input-group">
                                    <label>Billing & Admin Email Address</label>
                                    <input 
                                        type="email" 
                                        placeholder="admin@company.com" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <div className="input-group">
                                    <label>Contact Phone Number</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. 555-019-3290" 
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'queue' && (
                            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Queue Regulations</h3>
                                
                                <div className="input-group">
                                    <label>Average Service Time (Minutes)</label>
                                    <input 
                                        type="number" 
                                        min={1} 
                                        value={waitTime} 
                                        onChange={(e) => setWaitTime(parseInt(e.target.value))}
                                        required 
                                    />
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Used to calculate estimated queue wait times for mobile tickets.</span>
                                </div>

                                <div className="input-group">
                                    <label>Buffer Queue Max Capacity</label>
                                    <input 
                                        type="number" 
                                        min={1} 
                                        value={bufferCapacity} 
                                        onChange={(e) => setBufferCapacity(parseInt(e.target.value))}
                                        required 
                                    />
                                </div>

                                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }} />

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={enableBuffer} 
                                            onChange={(e) => setEnableBuffer(e.target.checked)}
                                            style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--color-primary)' }}
                                        />
                                        Enable Buffer Overflow Queue
                                    </label>

                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={enableSms} 
                                            onChange={(e) => setEnableSms(e.target.checked)}
                                            style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--color-primary)' }}
                                        />
                                        Send Automatic SMS updates
                                    </label>

                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={autoCall} 
                                            onChange={(e) => setAutoCall(e.target.checked)}
                                            style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--color-primary)' }}
                                        />
                                        Auto-call next client when counter is free
                                    </label>
                                </div>
                            </div>
                        )}

                        {activeTab === 'branding' && (
                            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Brand & Customization</h3>
                                
                                <div className="input-group">
                                    <label>Secondary Theme Color</label>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <input 
                                            type="color" 
                                            value={themeColor} 
                                            onChange={(e) => setThemeColor(e.target.value)}
                                            style={{ width: '60px', height: '46px', padding: '0', cursor: 'pointer', border: 'none', background: 'none' }}
                                        />
                                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{themeColor} (Hex Theme)</span>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Printed Ticket Receipt footer message</label>
                                    <textarea 
                                        rows={3} 
                                        value={receiptText} 
                                        onChange={(e) => setReceiptText(e.target.value)}
                                        style={{ resize: 'none', padding: '1rem', lineHeight: 1.5 }}
                                    />
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>This message appears at the bottom of physical ticket receipts and customer check-in screens.</span>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? (
                                    <><i className="fas fa-circle-notch fa-spin" /> Saving...</>
                                ) : (
                                    'Save Configuration'
                                )}
                            </button>
                        </div>

                    </form>
                </div>

            </div>

        </div>
    );
}

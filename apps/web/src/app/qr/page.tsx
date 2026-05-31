'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';

interface BranchInfo {
    id: string;
    name: string;
    address: string;
}

export default function QRSetupPage() {
    const [lanIp, setLanIp] = useState<string | null>(null);
    const [branches, setBranches] = useState<BranchInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                // Get LAN IP
                try {
                    const ipRes = await apiGet<{ lanIP: string }>('/api/lan-info');
                    if (ipRes.success && ipRes.data?.lanIP) {
                        setLanIp(ipRes.data.lanIP);
                    } else {
                        // Fallback to current hostname if API fails
                        setLanIp(window.location.hostname);
                    }
                } catch {
                    setLanIp(window.location.hostname);
                }

                // Get Branches
                const branchRes = await apiGet<BranchInfo[]>('/api/org/branches');
                if (branchRes.success && branchRes.data) {
                    setBranches(branchRes.data);
                    if (branchRes.data.length > 0) {
                        setSelectedBranchId(branchRes.data[0].id);
                    }
                }
            } catch (err) {
                console.error(err);
                // Ensure we at least have a fallback even on critical error
                if (!lanIp) setLanIp(window.location.hostname);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--color-primary)' }} />
            </div>
        );
    }

    const selectedBranch = branches.find(b => b.id === selectedBranchId);
    // Use window.location.port if available, else default to 3000
    const port = typeof window !== 'undefined' ? window.location.port : '3000';
    const joinUrl = lanIp && selectedBranch ? `http://${lanIp}:${port}/join/${selectedBranch.id}` : '';

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '2rem' }}>
            <div className="container" style={{ maxWidth: '900px' }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem',
                    background: 'rgba(19, 19, 31, 0.6)', backdropFilter: 'blur(10px)',
                    padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <i className="fas fa-qrcode" style={{ color: 'var(--color-primary-light)' }} />
                            QR Code Setup
                        </h1>
                        <p className="text-secondary">Generate and print QR codes for customer check-in.</p>
                    </div>
                    <div className="badge badge-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                        <i className="fas fa-network-wired" style={{ marginRight: '0.5rem' }} />
                        LAN: {lanIp || 'Detecting...'}
                    </div>
                </div>

                {/* Branch Selection */}
                <div className="card" style={{ marginBottom: '2rem', background: 'rgba(19, 19, 31, 0.6)', backdropFilter: 'blur(10px)' }}>
                    <div style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)' }}>
                        Select Branch
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {branches.map(branch => (
                            <button
                                key={branch.id}
                                onClick={() => setSelectedBranchId(branch.id)}
                                className={`btn ${selectedBranchId === branch.id ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ transition: 'all 0.2s ease', borderRadius: 'var(--radius-md)' }}
                            >
                                <i className="fas fa-building" />
                                {branch.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* QR Display */}
                {selectedBranch && joinUrl && (
                    <div className="card" style={{
                        display: 'grid', gridTemplateColumns: '1fr 320px', gap: '3rem',
                        background: 'rgba(19, 19, 31, 0.8)', border: '1px solid rgba(124, 58, 237, 0.2)'
                    }}>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>{selectedBranch.name}</h2>
                            <p className="text-secondary" style={{ marginBottom: '2rem', lineHeight: 1.6 }}>
                                Scan this QR code to join the queue at this branch. Ensure your customers are connected to the same Wi-Fi network or that the server is publicly accessible.
                            </p>

                            <div className="input-group" style={{ marginBottom: '2rem' }}>
                                <label style={{ color: 'var(--text-secondary)' }}>Join URL</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={joinUrl}
                                        readOnly
                                        style={{
                                            background: 'rgba(0,0,0,0.3)',
                                            fontFamily: 'var(--font-mono)',
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            color: 'var(--color-primary-light)'
                                        }}
                                    />
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => navigator.clipboard.writeText(joinUrl)}
                                        title="Copy URL"
                                    >
                                        <i className="fas fa-copy" />
                                    </button>
                                    <a
                                        href={joinUrl}
                                        target="_blank"
                                        className="btn btn-secondary"
                                        title="Open in new tab"
                                    >
                                        <i className="fas fa-external-link-alt" />
                                    </a>
                                </div>
                            </div>

                            <button className="btn btn-primary btn-lg" onClick={() => window.print()}>
                                <i className="fas fa-print" /> Print QR Code
                            </button>
                        </div>

                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            background: 'white', padding: '2rem', borderRadius: 'var(--radius-xl)',
                            boxShadow: '0 0 40px -10px rgba(0,0,0,0.5)'
                        }}>
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(joinUrl)}&color=000000&bgcolor=ffffff&margin=0`}
                                alt="QR Code"
                                width={250}
                                height={250}
                                style={{ display: 'block' }}
                            />
                            <div style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: '#111', fontWeight: 600, textAlign: 'center' }}>
                                Scan to Join Queue
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                                Powered by SkipQ
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Links */}
                <div style={{
                    display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap'
                }}>
                    <a href="/dashboard" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                        <i className="fas fa-th-large" /> Dashboard
                    </a>
                    <a href="/desk" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                        <i className="fas fa-desktop" /> Desk Operator
                    </a>
                    <a href="/login" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                        <i className="fas fa-right-to-bracket" /> Login
                    </a>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body { background: white; color: black; }
                    body * { visibility: hidden; }
                    .card, .card * { visibility: visible; }
                    .card { 
                        position: absolute; left: 0; top: 0; width: 100%; 
                        border: none; box-shadow: none; background: white !important; color: black !important;
                    }
                    .btn, .input-group, .badge { display: none !important; }
                    h2 { color: black !important; font-size: 24pt !important; }
                    p { color: #444 !important; }
                }
            `}</style>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

export default function HomePage() {
    const router = useRouter();
    
    // Onboarding Wizard States
    const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
    const [wizardStep, setWizardStep] = useState(1);
    const [companyName, setCompanyName] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [industryCategory, setIndustryCategory] = useState('medical');
    
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Dynamic Live Telemetry Stats
    const [telemetry, setTelemetry] = useState({
        processedTokens: 9482,
        activeDesks: 142,
        meanSla: 240,
        breachRatio: 99.82
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setTelemetry(prev => ({
                processedTokens: prev.processedTokens + Math.floor(Math.random() * 2) + 1,
                activeDesks: prev.activeDesks + (Math.random() > 0.85 ? (Math.random() > 0.5 ? 1 : -1) : 0),
                meanSla: Math.max(210, Math.min(265, prev.meanSla + Math.floor(Math.random() * 5) - 2)),
                breachRatio: Number(Math.max(99.42, Math.min(99.94, prev.breachRatio + (Math.random() > 0.5 ? 0.01 : -0.01))).toFixed(2))
            }));
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    const handleOnboardSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (wizardStep < 3) {
            setWizardStep(prev => prev + 1);
            return;
        }

        setError('');
        setSubmitting(true);

        try {
            const apiHost = window.location.hostname;
            const res = await fetch(`http://${apiHost}:3001/api/billing/buy-package`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim(),
                    name: name.trim(),
                    companyName: companyName.trim(),
                    packageId: selectedPackage,
                    cardNumber: cardNumber.trim(),
                    industryCategory
                })
            });

            const data = await res.json();
            if (data.success) {
                setSuccessMsg('Account created and base queues auto-provisioned successfully! Logging in...');
                
                localStorage.setItem('client_onboarded', 'true');
                localStorage.setItem('client_email', email);
                localStorage.setItem('client_company', companyName);
                
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
            } else {
                setError(data.error || 'Failed to complete registration.');
                setSubmitting(false);
            }
        } catch (err) {
            setError('Connection failed. Verify Elysia API server is active.');
            setSubmitting(false);
        }
    };

    const cancelWizard = () => {
        setSelectedPackage(null);
        setWizardStep(1);
        setCompanyName('');
        setName('');
        setEmail('');
        setCardNumber('');
        setCardExpiry('');
        setCardCvv('');
        setIndustryCategory('medical');
        setError('');
    };

    return (
        <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', background: '#040409' }}>
            
            {/* Background Radial Backlight and Dynamic Grid Glows */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '800px',
                backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(124, 58, 237, 0.16), rgba(59, 130, 246, 0.04), transparent 75%)',
                pointerEvents: 'none', zIndex: 0
            }} />
            <div style={{
                position: 'absolute', top: '400px', left: '8%', width: '450px', height: '450px',
                backgroundImage: 'radial-gradient(circle, rgba(139, 92, 246, 0.06), transparent 70%)',
                pointerEvents: 'none', zIndex: 0, filter: 'blur(60px)'
            }} />
            <div style={{
                position: 'absolute', top: '1000px', right: '8%', width: '550px', height: '550px',
                backgroundImage: 'radial-gradient(circle, rgba(244, 114, 182, 0.05), transparent 70%)',
                pointerEvents: 'none', zIndex: 0, filter: 'blur(70px)'
            }} />

            {/* Immersive Space Hero Section */}
            <section className={styles.hero}>
                <div className={styles['hero-content']}>
                    <div className={styles['hero-badge']}>
                        <span className="live-dot pulsing" style={{ background: '#c084fc', boxShadow: '0 0 12px #c084fc' }} />
                        SkipQ-LBTDA Balancer Core Active
                    </div>

                    <h1 className={styles['hero-title']}>
                        Indian Branch Queue Flow
                        <br />
                        <span className={styles['gradient-text']}>With Extreme Precision</span>
                    </h1>

                    <p className={styles['hero-subtitle']}>
                        Transform high-friction waiting queues into highly-efficient revenue streams. SkipQ combines dynamic 100% deterministic SLA balancing, in-venue bento merchant offers, and premium UPI line-skipping models.
                    </p>

                    <div className={styles['hero-actions']}>
                        <a href="#pricing-tiers" className="btn btn-primary btn-lg" style={{ borderRadius: 'var(--radius-xl)', padding: '0.9rem 2.5rem', fontSize: '0.95rem' }}>
                            <i className="fa-solid fa-bolt-lightning" style={{ marginRight: '6px' }} /> Buy SaaS Packages
                        </a>
                        <Link href="/join" className="btn btn-secondary btn-lg" style={{ borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#fff', padding: '0.9rem 2.5rem', fontSize: '0.95rem' }}>
                            <i className="fa-solid fa-ticket-simple" style={{ marginRight: '6px' }} /> Join a Queue (Client Demo)
                        </Link>
                    </div>

                    {/* Live Telemetry Ticker Dashboard */}
                    <div className={styles['hero-stats']}>
                        <div className={styles['hero-stat-item']}>
                            <span className={styles['hero-stat-value']} style={{ color: '#fff', textShadow: '0 0 15px rgba(255,255,255,0.2)' }}>
                                {telemetry.processedTokens.toLocaleString()}
                            </span>
                            <span className={styles['hero-stat-label']}>Tokens Served</span>
                        </div>
                        <div className={styles['hero-stat-item']}>
                            <span className={styles['hero-stat-value']} style={{ color: '#c084fc', textShadow: '0 0 15px rgba(192, 132, 252, 0.2)' }}>
                                {telemetry.activeDesks}
                            </span>
                            <span className={styles['hero-stat-label']}>Live Station Desks</span>
                        </div>
                        <div className={styles['hero-stat-item']}>
                            <span className={styles['hero-stat-value']} style={{ color: '#10b981', textShadow: '0 0 15px rgba(16, 185, 129, 0.2)' }}>
                                {telemetry.breachRatio}%
                            </span>
                            <span className={styles['hero-stat-label']}>SLA Breach Prevention</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Solid Symmetric Bento Grid Showcase (NO visual clashing or uneven margins) */}
            <section className={styles['features-section']}>
                <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
                    <span className={styles['section-tag']}>Engine Highlights</span>
                    <h2 className={styles['section-title']}>Re-engineering Queue Economics</h2>
                    <p className={styles['section-desc']}>
                        Highly localized queue triage systems crafted specifically to scale service limits in Indian institutions and branches.
                    </p>
                </div>

                <div className={styles['bento-grid']}>
                    
                    {/* Bento Box 1: Deterministic LBTDA Pro (Colspan 2) */}
                    <div className={`${styles['bento-item']} ${styles['bento-colspan-2']}`}>
                        <div className={styles['bento-badge']} style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                            <i className="fa-solid fa-circle-check" /> 100% Deterministic
                        </div>
                        <div style={{ display: 'flex', gap: '1.75rem', alignItems: 'flex-start', height: '100%' }}>
                            <div className={styles['bento-icon']}>
                                <i className="fa-solid fa-code-fork" />
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                                <div>
                                    <h3 className={styles['bento-title']}>SkipQ-LBTDA Pro Balancer</h3>
                                    <p className={styles['bento-desc']}>
                                        Our proprietary Load-Balanced Ticket Distribution Algorithm (LBTDA) dynamically triages priorities based on active SLA limits. Strictly deterministic math preventing venue deadlocks and processing delays without fuzzy artificial latency.
                                    </p>
                                </div>
                                
                                {/* Micro Telemetry Ledger */}
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                    <div style={{ padding: '0.45rem 0.85rem', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '10px', fontSize: '0.72rem', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <i className="fa-regular fa-clock" /> Target SLA: 15m
                                    </div>
                                    <div style={{ padding: '0.45rem 0.85rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '10px', fontSize: '0.72rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <i className="fa-solid fa-chart-line" /> QBI Score: 0.14
                                    </div>
                                    <div style={{ padding: '0.45rem 0.85rem', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '10px', fontSize: '0.72rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <i className="fa-solid fa-microchip" /> Triage: 238ms
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bento Box 2: UPI Fast-Pass Line Skipping (Rowspan 2) */}
                    <div className={`${styles['bento-item']} ${styles['bento-rowspan-2']}`}>
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div className={styles['bento-badge']} style={{ color: '#c084fc', background: 'rgba(192, 132, 252, 0.08)', borderColor: 'rgba(192, 132, 252, 0.2)' }}>
                                    Instant Revenue
                                </div>
                                <div className={styles['bento-icon']} style={{ marginBottom: '1.25rem' }}>
                                    <i className="fa-solid fa-mobile-screen" />
                                </div>
                                <h3 className={styles['bento-title']}>UPI Fast-Pass Line Skipping</h3>
                                <p className={styles['bento-desc']}>
                                    Monetize high demand natively. Patrons bypass traditional waiting lines instantly by completing dynamized scans supporting Paytm, GPay, PhonePe, and BHIM engines.
                                </p>
                            </div>

                            {/* Ultra High-Fidelity Phone Screen Mockup */}
                            <div style={{
                                marginTop: '1.5rem', padding: '1.25rem', background: 'rgba(5, 5, 12, 0.6)',
                                border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px',
                                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.05em' }}>BHIM UPI GATEWAY</span>
                                    <span className="live-dot" style={{ background: '#10b981', width: '6px', height: '6px' }} />
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', marginBottom: '0.2rem' }}>₹99.00 <span style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 600 }}>VIP PASS</span></div>
                                <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: '0.85rem' }}>SLA auto-prioritization splits applied</div>
                                
                                <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                                    <span style={{ padding: '0.3rem 0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', fontSize: '0.58rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}><i className="fa-brands fa-google-pay" style={{ color: '#fff' }} /> GPay</span>
                                    <span style={{ padding: '0.3rem 0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', fontSize: '0.58rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}><i className="fa-solid fa-money-bill-transfer" /> PhonePe</span>
                                    <span style={{ padding: '0.3rem 0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', fontSize: '0.58rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}><i className="fa-solid fa-wallet" /> Paytm</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bento Box 3: Wait-Room Spot-Offers (Normal) */}
                    <div className={styles['bento-item']}>
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div className={styles['bento-icon']}>
                                    <i className="fa-solid fa-bag-shopping" />
                                </div>
                                <h3 className={styles['bento-title']}>Bento Spot-Offers</h3>
                                <p className={styles['bento-desc']}>
                                    Unlock waiting-room conversions by serving high-margin contextual deals (e.g. snack combos, priority laminations).
                                </p>
                            </div>

                            {/* Dotted Merchant Coupon Mini Mockup */}
                            <div style={{
                                padding: '0.85rem', border: '1px dashed rgba(245,158,11,0.3)',
                                borderRadius: '12px', background: 'rgba(245,158,11,0.02)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff' }}>Samosa & Chai Combo</div>
                                    <div style={{ fontSize: '0.62rem', color: '#fbbf24' }}>Counter 3 Merchant Deal</div>
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fbbf24' }}>₹49</div>
                            </div>
                        </div>
                    </div>

                    {/* Bento Box 4: Cohort Wait-Room Group Merges (Normal) */}
                    <div className={styles['bento-item']}>
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div className={styles['bento-icon']} style={{ color: '#3b82f6' }}>
                                    <i className="fa-solid fa-people-group" />
                                </div>
                                <h3 className={styles['bento-title']}>Group Token Merging</h3>
                                <p className={styles['bento-desc']}>
                                    Dynamic family and group pass merges. Cohesively bundles 1–5 patrons to adjacent counter operators.
                                </p>
                            </div>

                            {/* Stacked Token Visuals */}
                            <div style={{ display: 'flex', gap: '0.35rem', overflow: 'hidden' }}>
                                <span style={{ flex: 1, padding: '0.4rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: '#60a5fa', fontSize: '0.65rem', fontWeight: 800, textAlign: 'center' }}>TK-081</span>
                                <span style={{ flex: 1, padding: '0.4rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: '#60a5fa', fontSize: '0.65rem', fontWeight: 800, textAlign: 'center' }}>TK-082</span>
                                <span style={{ flex: 1, padding: '0.4rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: '#60a5fa', fontSize: '0.65rem', fontWeight: 800, textAlign: 'center' }}>TK-083</span>
                            </div>
                        </div>
                    </div>

                    {/* Bento Box 5: Custom Industry Baseline Queues (Colspan 2) */}
                    <div className={`${styles['bento-item']} ${styles['bento-colspan-2']}`}>
                        <div className={styles['bento-badge']} style={{ color: '#fbbf24', background: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                            <i className="fa-solid fa-globe" /> Indian Locales
                        </div>
                        <div style={{ display: 'flex', gap: '1.75rem', alignItems: 'flex-start', height: '100%' }}>
                            <div className={styles['bento-icon']} style={{ color: '#f472b6' }}>
                                <i className="fa-solid fa-cubes" />
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                                <div>
                                    <h3 className={styles['bento-title']}>Auto-Generated Industry Lanes</h3>
                                    <p className={styles['bento-desc']}>
                                        Instantly configures service parameters mapped to local high-pressure spaces. Pre-seeded queues load baseline metrics for medical clinics, utility E-Sevaim center, PUC automobile lanes, salons, food kiosks, and transit booking lobbies.
                                    </p>
                                </div>
                                
                                {/* Micro Icon Row */}
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}><i className="fa-solid fa-hospital" style={{ color: '#f87171' }} /> OPD OPD</span>
                                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}><i className="fa-solid fa-landmark" style={{ color: '#60a5fa' }} /> Govt E-Sevai</span>
                                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}><i className="fa-solid fa-scissors" style={{ color: '#f472b6' }} /> Hair Styling</span>
                                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}><i className="fa-solid fa-gas-pump" style={{ color: '#fbbf24' }} /> Auto PUC</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bento Box 6: WhatsApp Trackers & Ledgers (Normal) */}
                    <div className={styles['bento-item']}>
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div className={styles['bento-icon']} style={{ color: '#10b981' }}>
                                    <i className="fa-brands fa-whatsapp" />
                                </div>
                                <h3 className={styles['bento-title']}>WhatsApp Broadcasts</h3>
                                <p className={styles['bento-desc']}>
                                    Dynamic SMS and notifications keep patrons informed exactly when to make their counter approaches.
                                </p>
                            </div>

                            {/* Dialogue Box Micro Mockup */}
                            <div style={{
                                padding: '0.75rem', background: 'rgba(16,185,129,0.04)',
                                border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px 10px 10px 0'
                            }}>
                                <span style={{ fontSize: '0.62rem', color: '#34d399', fontWeight: 800, display: 'block', marginBottom: '0.15rem' }}>SKIPQ STATUS</span>
                                <p style={{ fontSize: '0.7rem', color: '#fff', margin: 0, lineHeight: 1.3 }}>Token TK-014: Please proceed to OPD Desk 2 now!</p>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Beautiful Portal Pathways Cards Grid */}
            <section style={{ padding: '6rem var(--space-6)', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
                <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
                    <span className={styles['section-tag']} style={{ color: '#60a5fa', background: 'rgba(59, 130, 246, 0.08)', borderColor: 'rgba(59, 130, 246, 0.25)' }}>Interactive Pathways</span>
                    <h2 className={styles['section-title']}>Three Gateways. One Fluid Engine.</h2>
                    <p className={styles['section-desc']}>Access specialized terminals mapped specifically to your administrative role in the SkipQ ecosystem.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2.5rem' }}>
                    
                    {/* Portal 1: Client Admin */}
                    <div className={styles['pricing-card']}>
                        <div>
                            <div style={{
                                width: '56px', height: '56px', background: 'rgba(139, 92, 246, 0.1)',
                                color: '#c084fc', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '1px solid rgba(139, 92, 246, 0.25)', marginBottom: '2rem'
                            }}>
                                <i className="fa-solid fa-house-laptop" style={{ fontSize: '1.4rem' }} />
                            </div>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.85rem', color: '#fff' }}>Business Client Dashboard</h3>
                            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '2rem' }}>
                                Register businesses, create physical branches, define queue service parameters, adjust priority rates, provision operators, and review customer feedback scoring sheets.
                            </p>
                        </div>
                        <Link href="/login" className="btn btn-primary btn-full" style={{ padding: '1rem', borderRadius: 'var(--radius-xl)', fontWeight: 700, fontSize: '0.9rem' }}>
                            Admin Terminal <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.8em', marginLeft: '8px' }} />
                        </Link>
                    </div>

                    {/* Portal 2: Desk Operator */}
                    <div className={styles['pricing-card']}>
                        <div>
                            <div style={{
                                width: '56px', height: '56px', background: 'rgba(16, 185, 129, 0.1)',
                                color: '#34d399', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '1px solid rgba(16, 185, 129, 0.25)', marginBottom: '2rem'
                            }}>
                                <i className="fa-solid fa-desktop" style={{ fontSize: '1.4rem' }} />
                            </div>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.85rem', color: '#fff' }}>Desk Station Operator</h3>
                            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '2rem' }}>
                                Log directly into physical station counters, claim operator roles, trigger dynamic audio calls for next clients, process feedback scoring forms, or transfer buffer tokens.
                            </p>
                        </div>
                        <Link href="/desk" className="btn btn-secondary btn-full" style={{ padding: '1rem', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
                            Operator Panel <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.8em', marginLeft: '8px' }} />
                        </Link>
                    </div>

                    {/* Portal 3: Super Management */}
                    <div className={styles['pricing-card']} style={{ border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                        <div>
                            <div style={{
                                width: '56px', height: '56px', background: 'rgba(245, 158, 11, 0.1)',
                                color: '#fbbf24', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '1px solid rgba(245, 158, 11, 0.25)', marginBottom: '2rem'
                            }}>
                                <i className="fa-solid fa-gauge-high" style={{ fontSize: '1.4rem' }} />
                            </div>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.85rem', color: '#fff' }}>SkipQ Telemetry Center</h3>
                            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '2rem' }}>
                                Access deep-system telemetry logs. Monitor transactional memory pools, trigger manual db journal compaction cycles, authorize pending branch queues, and manage ARR/MRR SaaS plans.
                            </p>
                        </div>
                        <Link href="/management/login" className="btn btn-secondary btn-full" style={{ padding: '1rem', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(245,158,11,0.02)', color: '#fbbf24', fontWeight: 700, fontSize: '0.9rem' }}>
                            Telemetry Portal <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.8em', marginLeft: '8px' }} />
                        </Link>
                    </div>

                </div>
            </section>

            {/* SaaS Subscription Packaging & CGST/SGST Ledger Details */}
            <section id="pricing-tiers" style={{ padding: '6rem var(--space-6)', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
                <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
                    <span className={styles['section-tag']} style={{ color: '#f472b6', background: 'rgba(244, 114, 182, 0.08)', borderColor: 'rgba(244, 114, 182, 0.2)' }}>Ecosystem Subscriptions</span>
                    <h2 className={styles['section-title']}>Flexible SaaS Subscriptions</h2>
                    <p className={styles['section-desc']}>
                        Set up branches instantly. Base services auto-generate with 18% HSN/SAC GST invoicing compliant models.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
                    
                    {/* Plan 1: Starter Kit */}
                    <div className={styles['pricing-card']}>
                        <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Boutique Venues</span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', margin: '1rem 0 1.5rem 0' }}>
                                <span className={styles['plan-price-large']}>₹1,999</span>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>/ month</span>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                                Best suited for single boutique retail shops, local diagnostic clinics, or dining outlets.
                            </p>
                            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: '2.5rem' }} />
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem', color: '#cbd5e1' }}>
                                <li><i className="fa-solid fa-circle-check" style={{ color: '#10b981', marginRight: '10px' }} /> 1 Active Venue Branch</li>
                                <li><i className="fa-solid fa-circle-check" style={{ color: '#10b981', marginRight: '10px' }} /> 2 Station Desks Limit</li>
                                <li><i className="fa-solid fa-circle-check" style={{ color: '#10b981', marginRight: '10px' }} /> Auto-provisioned Industry Lanes</li>
                                <li><i className="fa-solid fa-circle-check" style={{ color: '#10b981', marginRight: '10px' }} /> SAC-998311 Compliant Ledger</li>
                            </ul>
                        </div>
                        <button className="btn btn-secondary btn-full" style={{ padding: '1rem', borderRadius: 'var(--radius-xl)', marginTop: '3.5rem', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontWeight: 700 }} onClick={() => setSelectedPackage('starter')}>
                            Select Starter Plan
                        </button>
                    </div>

                    {/* Plan 2: Pro Core (Featured) */}
                    <div className={`${styles['pricing-card']} ${styles['pricing-featured']}`}>
                        <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Highly Popular</span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', margin: '1rem 0 1.5rem 0' }}>
                                <span className={styles['plan-price-large']}>₹4,999</span>
                                <span style={{ fontSize: '0.9rem', color: '#c084fc' }}>/ month</span>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: '#c084fc', opacity: 0.85, lineHeight: 1.6, marginBottom: '2.5rem' }}>
                                Engineered for larger clinics, high-volume government utility centers, and multiple branch sites.
                            </p>
                            <hr style={{ border: 'none', borderTop: '1px solid rgba(139,92,246,0.15)', marginBottom: '2.5rem' }} />
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem', color: '#fff' }}>
                                <li><i className="fa-solid fa-circle-check" style={{ color: '#34d399', marginRight: '10px' }} /> 3 Active Venue Branches</li>
                                <li><i className="fa-solid fa-circle-check" style={{ color: '#34d399', marginRight: '10px' }} /> 6 Station Desks Limit</li>
                                <li><i className="fa-solid fa-circle-check" style={{ color: '#34d399', marginRight: '10px' }} /> Dynamic LBTDA Pro Active</li>
                                <li><i className="fa-solid fa-circle-check" style={{ color: '#34d399', marginRight: '10px' }} /> Priority SLA Desk Approvals</li>
                                <li><i className="fa-solid fa-circle-check" style={{ color: '#34d399', marginRight: '10px' }} /> Live In-Venue Bento Spot-Offers</li>
                            </ul>
                        </div>
                        <button className="btn btn-primary btn-full" style={{ padding: '1rem', borderRadius: 'var(--radius-xl)', marginTop: '3.5rem', fontWeight: 800, fontSize: '0.95rem' }} onClick={() => setSelectedPackage('pro')}>
                            Select Professional Plan
                        </button>
                    </div>

                    {/* Plan 3: Enterprise Plus */}
                    <div className={styles['pricing-card']}>
                        <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Large Chains</span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', margin: '1rem 0 1.5rem 0' }}>
                                <span className={styles['plan-price-large']}>Custom</span>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                                Designed for major municipal offices, airport terminals, and multi-state medical networks.
                            </p>
                            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: '2.5rem' }} />
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem', color: '#cbd5e1' }}>
                                <li><i className="fa-solid fa-circle-check" style={{ color: '#10b981', marginRight: '10px' }} /> Unlimited Venue Branches</li>
                                <li><i className="fa-solid fa-circle-check" style={{ color: '#10b981', marginRight: '10px' }} /> Unlimited Station Desks</li>
                                <li><i className="fa-solid fa-circle-check" style={{ color: '#10b981', marginRight: '10px' }} /> Custom Customer Feedback Forms</li>
                                <li><i className="fa-solid fa-circle-check" style={{ color: '#10b981', marginRight: '10px' }} /> Dedicated Regional Server Node</li>
                            </ul>
                        </div>
                        <button className="btn btn-secondary btn-full" style={{ padding: '1rem', borderRadius: 'var(--radius-xl)', marginTop: '3.5rem', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontWeight: 700 }} onClick={() => setSelectedPackage('enterprise')}>
                            Contact Enterprise
                        </button>
                    </div>

                </div>
            </section>

            {/* Sleek Dark-Mode Onboarding Wizard Modal Overlay */}
            {selectedPackage && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(5, 5, 11, 0.85)', backdropFilter: 'blur(16px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card animate-fade-in" style={{
                        maxWidth: '520px', width: '90%', padding: '2.5rem',
                        background: 'rgba(15, 15, 30, 0.95)', border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '24px', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 50px rgba(124, 58, 237, 0.15)'
                    }}>
                        
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div>
                                <span className="badge badge-primary" style={{ textTransform: 'uppercase', color: '#c084fc', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', fontSize: '0.65rem', fontWeight: 800 }}>
                                    {selectedPackage} Onboarding Wizard
                                </span>
                                <h3 style={{ fontWeight: 900, marginTop: '0.5rem', fontSize: '1.5rem', color: '#fff' }}>Ecosystem Provisioning</h3>
                            </div>
                            <button className="btn btn-secondary btn-sm" style={{ padding: '0.45rem', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }} onClick={cancelWizard}>
                                <i className="fa-solid fa-xmark" style={{ width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                            </button>
                        </div>

                        {/* Progress Stepper Line */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.25rem' }}>
                            <div style={{ flex: 1, height: '4px', background: '#7c3aed', borderRadius: '2px' }} />
                            <div style={{ flex: 1, height: '4px', background: wizardStep >= 2 ? '#7c3aed' : 'rgba(255,255,255,0.08)', borderRadius: '2px', transition: 'all 0.25s' }} />
                            <div style={{ flex: 1, height: '4px', background: wizardStep >= 3 ? '#7c3aed' : 'rgba(255,255,255,0.08)', borderRadius: '2px', transition: 'all 0.25s' }} />
                        </div>

                        {error && (
                            <div style={{
                                padding: '0.85rem', background: 'rgba(239, 68, 68, 0.08)',
                                color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.25)',
                                borderRadius: '12px', marginBottom: '1.75rem', fontSize: '0.85rem',
                                display: 'flex', alignItems: 'center', gap: '0.6rem'
                            }}>
                                <i className="fa-solid fa-circle-exclamation" /> {error}
                            </div>
                        )}

                        {successMsg && (
                            <div style={{
                                padding: '0.85rem', background: 'rgba(16, 185, 129, 0.08)',
                                color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.25)',
                                borderRadius: '12px', marginBottom: '1.75rem', fontSize: '0.85rem',
                                display: 'flex', alignItems: 'center', gap: '0.6rem'
                            }}>
                                <i className="fa-solid fa-circle-check" /> {successMsg}
                            </div>
                        )}

                        <form onSubmit={handleOnboardSubmit}>
                            
                            {/* STEP 1: Account Creation */}
                            {wizardStep === 1 && (
                                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <h4 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span className={styles['step-number']}>1</span> Admin Account
                                    </h4>
                                    
                                    <div className="input-group">
                                        <label style={{ color: '#a78bfa', fontSize: '0.7rem', fontWeight: 800 }}>Admin Full Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Richard Hendricks" 
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            autoFocus
                                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '12px' }}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label style={{ color: '#a78bfa', fontSize: '0.7rem', fontWeight: 800 }}>Corporate Email Address</label>
                                        <input 
                                            type="email" 
                                            placeholder="richard@hooli.com" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '12px' }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Business Configuration */}
                            {wizardStep === 2 && (
                                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <h4 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span className={styles['step-number']}>2</span> Venue Settings
                                    </h4>
                                    
                                    <div className="input-group">
                                        <label style={{ color: '#a78bfa', fontSize: '0.7rem', fontWeight: 800 }}>Company Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Hooli Medical Center" 
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            required
                                            autoFocus
                                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '12px' }}
                                        />
                                    </div>

                                    <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ color: '#a78bfa', fontSize: '0.7rem', fontWeight: 800 }}>Branch Queue Lane Category</label>
                                        <select
                                            value={industryCategory}
                                            onChange={(e) => setIndustryCategory(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.875rem 1rem',
                                                background: 'rgba(255,255,255,0.02)',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                borderRadius: '12px',
                                                color: '#fff',
                                                outline: 'none',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            <option value="medical" style={{ background: '#0e0e1a' }}>Medical / OPD Clinics 🏥</option>
                                            <option value="e-sevai" style={{ background: '#0e0e1a' }}>E-Sevai & Govt Utility Centers 🏛️</option>
                                            <option value="salon" style={{ background: '#0e0e1a' }}>Salons & Hair Detailing 💇</option>
                                            <option value="dining" style={{ background: '#0e0e1a' }}>Fine Dining & Live Food Outlets 🍔</option>
                                            <option value="transport" style={{ background: '#0e0e1a' }}>Transport Hubs & Physical Ticketing 🚆</option>
                                            <option value="automobile" style={{ background: '#0e0e1a' }}>Automobile Servicing & PUC Emission Lanes 🚗</option>
                                            <option value="custom" style={{ background: '#0e0e1a' }}>Other / Custom Queue Lane 📁</option>
                                        </select>
                                    </div>

                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
                                        Ecosystem baseline branch and specialized industry service queues will auto-provision instantly under this title.
                                    </span>
                                </div>
                            )}

                            {/* STEP 3: Payment Card Checkout */}
                            {wizardStep === 3 && (
                                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <h4 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span className={styles['step-number']}>3</span> Dynamic Checkout
                                    </h4>
                                    
                                    <div className="input-group">
                                        <label style={{ color: '#a78bfa', fontSize: '0.7rem', fontWeight: 800 }}>Simulated Card Number</label>
                                        <input 
                                            type="text" 
                                            placeholder="4111 2222 3333 4444" 
                                            value={cardNumber}
                                            onChange={(e) => setCardNumber(e.target.value)}
                                            maxLength={19}
                                            required
                                            autoFocus
                                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '12px' }}
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="input-group">
                                            <label style={{ color: '#a78bfa', fontSize: '0.7rem', fontWeight: 800 }}>Expiry Date</label>
                                            <input 
                                                type="text" 
                                                placeholder="MM/YY" 
                                                value={cardExpiry}
                                                onChange={(e) => setCardExpiry(e.target.value)}
                                                maxLength={5}
                                                required
                                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '12px' }}
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label style={{ color: '#a78bfa', fontSize: '0.7rem', fontWeight: 800 }}>CVV Secure Pin</label>
                                            <input 
                                                type="password" 
                                                placeholder="•••" 
                                                value={cardCvv}
                                                onChange={(e) => setCardCvv(e.target.value)}
                                                maxLength={3}
                                                required
                                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '12px' }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ fontSize: '0.725rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>SaaS Plan Fee:</span>
                                            <span>₹{selectedPackage === 'pro' ? '4,999.00' : '1,999.00'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>CGST (9.0%):</span>
                                            <span>₹{(selectedPackage === 'pro' ? 449.91 : 179.91).toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>SGST (9.0%):</span>
                                            <span>₹{(selectedPackage === 'pro' ? 449.91 : 179.91).toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.3rem', fontWeight: 800, color: '#fff' }}>
                                            <span>Total (Incl. Taxes):</span>
                                            <span>₹{(selectedPackage === 'pro' ? 5898.82 : 2358.82).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Wizard Footer Navigation Actions */}
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '2.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                {wizardStep > 1 && (
                                    <button type="button" className="btn btn-secondary" style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#fff' }} onClick={() => setWizardStep(prev => prev - 1)}>
                                        Back
                                    </button>
                                )}
                                <button type="button" className="btn btn-secondary" style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#94a3b8' }} onClick={cancelWizard}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ borderRadius: '12px', fontWeight: 800 }} disabled={submitting}>
                                    {submitting ? (
                                        <><i className="fa-solid fa-spinner fa-spin" /> Provisioning...</>
                                    ) : wizardStep === 3 ? (
                                        'Finalize Onboarding'
                                    ) : (
                                        'Continue'
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

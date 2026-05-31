'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

// ==========================================================
// 1. PLAYGROUND PRESETS FOR GEMINI AI STUDIO
// ==========================================================
interface Preset {
    sysInst: string;
    json: Record<string, any>;
    output: string;
}

const presets: Record<string, Preset> = {
    aiims: {
        sysInst: `You are the SkipQ AI Medical Triage Waiting Assistant.
Your goal is to reassure visitors and explain their ticket status warmly.
Address the patient context in India (OPD crowding).
Format advice clearly in English and Hindi (हिन्दी).
Detail specific desk requirements: Patients need their OP Card and Aadhaar Card.`,
        json: {
            organization: "AIIMS New Delhi",
            branch: "OPD General Medicine",
            desk: "Counter 4 (Dr. A. Sharma)",
            currentServingToken: "H-101",
            visitorToken: "H-104",
            peopleAhead: 3,
            estimatedWaitMinutes: 24,
            priorityTag: "Senior Citizen (Needs seating assistance)",
            metadata: {
                aadhaarVerified: true,
                hospitalCardStatus: "Active"
            }
        },
        output: `<p><strong>English:</strong> You are <strong>3rd in line</strong> at Desk 4 for Dr. Sharma. Your estimated wait time is <strong>24 minutes</strong>. Since you require seating assistance, please feel free to wait inside the Priority Lounge (Area B), where comfortable seating is reserved. Make sure you have your OP Card and Aadhaar Card ready for rapid consultation.</p>
<p style="margin-top: 12px;"><strong>Hindi (हिन्दी):</strong> आप डॉ. शर्मा के काउंटर 4 पर लाइन में <strong>तीसरे स्थान</strong> पर हैं। आपकी प्रतीक्षा का अनुमानित समय <strong>24 मिनट</strong> है। आपकी सुविधा के लिए, कृपया एरिया बी के प्रायोरिटी लाउंज में बैठें, जहाँ विश्राम की सुविधा उपलब्ध है। तुरंत जाँच के लिए अपना ओपीडी कार्ड और आधार कार्ड तैयार रखें।</p>`
    },
    iit: {
        sysInst: `You are the SkipQ Academic Desk Triage Guide.
Format advice for busy college students waiting for transcripts or fee certificates.
Optimize response to keep desk time under 2 minutes.
Translate status to Marathi (मराठी) and English.
Detail required documents: Student ID, Grade Sheets, Dean's approval slip.`,
        json: {
            organization: "IIT Bombay",
            branch: "Registrar Office",
            desk: "Desk 2 (Transcripts & Certificates)",
            currentServingToken: "S-038",
            visitorToken: "S-044",
            peopleAhead: 6,
            estimatedWaitMinutes: 18,
            priorityTag: "Urgent scholarship deadline today",
            metadata: {
                feeCleared: true,
                transcriptCopiesRequested: 3
            }
        },
        output: `<p><strong>English:</strong> You are <strong>6th in line</strong> for Desk 2. Your transcript will be called in roughly <strong>18 minutes</strong>. Because you have an active scholarship deadline today, our registrar team has been alerted for priority processing. Keep your Student ID, Grade Sheets, and the Dean's approval slip ready to complete your submission in under 2 minutes.</p>
<p style="margin-top: 12px;"><strong>Marathi (मराठी):</strong> तुम्ही डेस्क २ साठी <strong>६ व्या क्रमांकावर</strong> आहात. १८ मिनिटांत तुमचा नंबर येईल. आज स्कॉलरशिपची शेवटची तारीख असल्याने रजिस्ट्रार टीमला सूचित केले आहे. जलद पडताळणीसाठी तुमचे आयडी कार्ड, गुणपत्रिका आणि डीनचे मंजुरी पत्र सोबत ठेवा.</p>`
    },
    sbi: {
        sysInst: `You are the SkipQ Banking Desk Guide.
Format advice to keep banking operations smooth and secure.
Address queue issues like printer delays or cash drawer limits.
Provide clear details in Hindi (हिन्दी) and English.
Remind customers about PAN cards and original passbooks.`,
        json: {
            organization: "State Bank of India",
            branch: "Lucknow Regional Desk",
            desk: "Counter 3 (Accounts & Passbook Updates)",
            currentServingToken: "B-140",
            visitorToken: "B-142",
            peopleAhead: 2,
            estimatedWaitMinutes: 12,
            priorityTag: "Passbook printer backlog",
            metadata: {
                accountType: "Savings",
                updateType: "Passbook Printing"
            }
        },
        output: `<p><strong>English:</strong> You are <strong>2nd in line</strong> at Counter 3. Estimated wait is <strong>12 minutes</strong>. Note: There is a minor printer queue backlog, so your update might take 3 additional minutes at the counter. Please have your original passbook and PAN Card open and ready to save transaction time.</p>
<p style="margin-top: 12px;"><strong>Hindi (हिन्दी):</strong> आप काउंटर 3 पर लाइन में <strong>दूसरे स्थान</strong> पर हैं। अनुमानित समय <strong>12 मिनट</strong> है। पासबुक प्रिंटर में थोड़ी व्यस्तता है, इसलिए काउंटर पर 3 मिनट का अतिरिक्त समय लग सकता है। कृपया अपनी मूल पासबुक और पैन कार्ड तैयार रखें ताकि आपका काम जल्दी हो सके।</p>`
    }
};

// ==========================================================
// 2. LIVE QUEUE SIMULATOR SEED DATA
// ==========================================================
interface QueueItem {
    token: string;
    name: string;
    lang: string;
    priority: string;
    status: 'serving' | 'waiting' | 'benched';
}

const initialQueue: QueueItem[] = [
    { token: "H-101", name: "Sparrow Dev", lang: "English", priority: "Urgent Case", status: "serving" },
    { token: "H-102", name: "Priya Sharma", lang: "Hindi", priority: "Standard", status: "waiting" },
    { token: "H-103", name: "Rajesh Patel", lang: "Hindi", priority: "Senior Citizen", status: "waiting" },
    { token: "H-104", name: "Harish (You)", lang: "English", priority: "Senior Citizen", status: "waiting" },
    { token: "H-105", name: "Anand Iyer", lang: "Tamil", priority: "Standard", status: "waiting" }
];

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

    // Toast Notification System
    const [toastMsg, setToastMsg] = useState('');
    const [toastVisible, setToastVisible] = useState(false);
    const [toastTimeoutId, setToastTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const triggerToast = (msg: string) => {
        setToastMsg(msg);
        setToastVisible(true);
        if (toastTimeoutId) clearTimeout(toastTimeoutId);
        const newId = setTimeout(() => {
            setToastVisible(false);
        }, 2200);
        setToastTimeoutId(newId);
    };

    // ==========================================================
    // 3. PLAYGROUND STATE MACHINE
    // ==========================================================
    const [activePresetKey, setActivePresetKey] = useState('aiims');
    const [sysInstVal, setSysInstVal] = useState(presets.aiims.sysInst);
    const [jsonVal, setJsonVal] = useState(JSON.stringify(presets.aiims.json, null, 4));
    const [playgroundOutput, setPlaygroundOutput] = useState('Click "Run Model Prompt" to execute the Gemini query.');
    const [playgroundRunning, setPlaygroundRunning] = useState(false);
    const [temperature, setTemperature] = useState(0.40);
    const [outputTokens, setOutputTokens] = useState(0);

    const handlePresetChange = (key: string) => {
        setActivePresetKey(key);
        const p = presets[key];
        if (p) {
            setSysInstVal(p.sysInst);
            setJsonVal(JSON.stringify(p.json, null, 4));
            setPlaygroundOutput('Click "Run Model Prompt" to execute the Gemini query.');
            setOutputTokens(0);
        }
    };

    const handlePlaygroundRun = () => {
        if (playgroundRunning) return;
        setPlaygroundRunning(true);
        setPlaygroundOutput('<span style="color: var(--text-soft); font-family: monospace;">Executing LLM Prompt Triage... Pinging Google Cloud Vertex AI endpoint...</span>');

        setTimeout(() => {
            setPlaygroundRunning(false);
            const p = presets[activePresetKey];
            if (p) {
                setOutputTokens(Math.floor(p.output.length / 5));
                
                // Simulate typewriter output streaming
                setPlaygroundOutput('');
                const mockHtml = p.output;
                let currentStr = '';
                const parts = mockHtml.split(/(<[^>]*>)/g); // split keeping tags
                let partIndex = 0;

                const streamInterval = setInterval(() => {
                    if (partIndex < parts.length) {
                        currentStr += parts[partIndex];
                        setPlaygroundOutput(currentStr);
                        partIndex++;
                    } else {
                        clearInterval(streamInterval);
                    }
                }, 100);
            }
        }, 1200);
    };

    // ==========================================================
    // 4. LIVE QUEUE SIMULATOR STATE
    // ==========================================================
    const [queue, setQueue] = useState<QueueItem[]>(initialQueue);
    const [completedCount, setCompletedCount] = useState(102);
    const [tokenCounter, setTokenCounter] = useState(105);

    // Join queue inputs
    const [addName, setAddName] = useState('');
    const [addLang, setAddLang] = useState('English');
    const [addPriority, setAddPriority] = useState('Standard');

    const handleCallNext = () => {
        const servingIdx = queue.findIndex(item => item.status === 'serving');
        let newQueue = [...queue];
        if (servingIdx !== -1) {
            setCompletedCount(prev => prev + 1);
            newQueue.splice(servingIdx, 1);
        }

        const waitingIdx = newQueue.findIndex(item => item.status === 'waiting');
        if (waitingIdx !== -1) {
            newQueue[waitingIdx].status = 'serving';
        }

        setQueue(newQueue);
        triggerToast('Queue advanced! Next visitor called.');
    };

    const handleMarkNoShow = () => {
        const servingIdx = queue.findIndex(item => item.status === 'serving');
        if (servingIdx !== -1) {
            let newQueue = [...queue];
            const item = { ...newQueue[servingIdx], status: 'benched' as const };
            newQueue.splice(servingIdx, 1);
            newQueue.push(item);

            const waitingIdx = newQueue.findIndex(item => item.status === 'waiting');
            if (waitingIdx !== -1) {
                newQueue[waitingIdx].status = 'serving';
            }

            setQueue(newQueue);
            triggerToast(`Token ${item.token} benched due to absence.`);
        } else {
            triggerToast('No active visitor to bench.');
        }
    };

    const handleCompleteService = () => {
        const servingIdx = queue.findIndex(item => item.status === 'serving');
        if (servingIdx !== -1) {
            const item = queue[servingIdx];
            setCompletedCount(prev => prev + 1);
            let newQueue = [...queue];
            newQueue.splice(servingIdx, 1);

            const waitingIdx = newQueue.findIndex(item => item.status === 'waiting');
            if (waitingIdx !== -1) {
                newQueue[waitingIdx].status = 'serving';
            }

            setQueue(newQueue);
            triggerToast(`Token ${item.token} consultation complete.`);
        } else {
            triggerToast('No active consultation to complete.');
        }
    };

    const handleAddSimulatedVisitor = () => {
        if (!addName.trim()) {
            triggerToast('Please enter a name first.');
            return;
        }

        const nextNum = tokenCounter + 1;
        setTokenCounter(nextNum);

        const newToken: QueueItem = {
            token: `H-${nextNum}`,
            name: addName.trim(),
            lang: addLang,
            priority: addPriority,
            status: queue.length === 0 ? ('serving' as const) : ('waiting' as const)
        };

        setQueue(prev => [...prev, newToken]);
        setAddName('');
        triggerToast(`Token ${newToken.token} registered! Joined waiting list.`);
    };

    // Calculate mobile ticket details (H-104)
    const myTicketIndex = queue.findIndex(item => item.token === 'H-104');
    let ticketStatusText = 'Waiting';
    let ticketPeopleAhead = '3 people';
    let ticketEstWait = '24 mins';
    let ticketAiAdviceText = 'Calculating status...';
    let isBenched = false;
    let isActiveServing = false;

    if (myTicketIndex !== -1) {
        const myTicket = queue[myTicketIndex];
        if (myTicket.status === 'serving') {
            ticketStatusText = 'Active';
            isActiveServing = true;
            ticketPeopleAhead = '0 people';
            ticketEstWait = '0 mins';
            ticketAiAdviceText = 'You are currently being called! Please step forward to Counter 4 for Dr. Sharma. Prepare your Aadhaar Card and Hospital OP card.';
        } else if (myTicket.status === 'benched') {
            ticketStatusText = 'Benched';
            isBenched = true;
            ticketPeopleAhead = 'Paused';
            ticketEstWait = 'Cooldown';
            ticketAiAdviceText = "Your number was called but you were not present. You have been placed on the no-show bench. Please alert the counter operator to resume.";
        } else {
            let peopleAhead = 0;
            for (let i = 0; i < myTicketIndex; i++) {
                if (queue[i].status === 'waiting') {
                    peopleAhead++;
                }
            }
            const waitTime = peopleAhead * 6;
            ticketStatusText = 'Waiting';
            ticketPeopleAhead = `${peopleAhead} people`;
            ticketEstWait = `${waitTime} mins`;
            if (peopleAhead === 0) {
                ticketAiAdviceText = "You are next in line! Your wait time is approximately 2 minutes. Please wait near Counter 4.";
            } else {
                ticketAiAdviceText = `You are ${peopleAhead} people ahead of your turn. Estimated wait is ${waitTime} mins. Gemini recommends: Grab a hot tea nearby, we will message you via WhatsApp when you are next!`;
            }
        }
    } else {
        ticketStatusText = 'Checked Out';
        ticketPeopleAhead = 'Finished';
        ticketEstWait = '0 mins';
        ticketAiAdviceText = 'Your service has been successfully completed! Thank you for using SkipQ. Aadhaar records saved in system.';
    }

    // WhatsApp Bubble Message Content Sync
    const getWhatsAppBubbleContent = () => {
        const waitingItems = queue.filter(item => item.status === 'waiting');
        const servingItem = queue.find(item => item.status === 'serving');

        if (servingItem) {
            return `नमस्कार <strong>${servingItem.name}</strong>! You are currently being called at Counter 4 for Dr. Sharma. Please step forward. Bring your Outpatient (OP) Card and Aadhaar Card.`;
        } else if (waitingItems.length > 0) {
            const nextInLine = waitingItems[0];
            const activeIdx = queue.findIndex(item => item.status === 'serving');
            const targetIdx = queue.indexOf(nextInLine);
            const peopleAhead = activeIdx !== -1 ? targetIdx - activeIdx : targetIdx;
            const waitTime = peopleAhead * 6;
            return `नमस्कार <strong>${nextInLine.name}</strong>! You are 1st in line at Counter 4. Estimated wait: ${waitTime} mins. Bring your Outpatient (OP) Card and Aadhaar Card. Reply [1] if present, [2] to postpone 5m, or [3] to cancel.`;
        } else {
            return `नमस्कार! All checkups completed at Counter 4. Thank you for using SkipQ queue triage!`;
        }
    };

    // ==========================================================
    // 5. ROI CALCULATOR STATE
    // ==========================================================
    const [roiVisitors, setRoiVisitors] = useState(300);
    const [roiWait, setRoiWait] = useState(20);
    const [roiWage, setRoiWage] = useState(120);

    const yearlyVisitors = roiVisitors * 300;
    const roiHoursSaved = Math.round((yearlyVisitors * roiWait) / 60);
    const roiValueSaved = roiHoursSaved * roiWage;

    // Onboard Submit Elysia Booking
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

    const copyCurrentLink = async () => {
        const link = window.location.origin;
        try {
            await navigator.clipboard.writeText(link);
            triggerToast('Launch link copied to clipboard!');
        } catch {
            triggerToast('Copy unavailable');
        }
    };

    const handleLinkedInShare = () => {
        const text = encodeURIComponent("I'm excited to share SkipQ! Powered by Google Cloud Gemini API, we're building digital waitlists to solve hospital and bank crowding in India. Check it out! #GoogleAI #SaaS #Waitlist #IndiaProduct");
        const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}&summary=${text}`;
        window.open(shareUrl, '_blank', 'width=600,height=500');
        triggerToast('Opening LinkedIn Share Portal!');
    };

    return (
        <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', background: 'var(--bg-base)' }}>
            
            {/* Background Ambient Glowing Backdrops */}
            <div className={styles['ambient-glows']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1600px', pointerEvents: 'none', zIndex: -1, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', width: '600px', height: '600px', top: '-150px', left: '-100px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(26, 115, 232, 0.08) 0%, transparent 70%)', filter: 'blur(50px)' }} />
                <div style={{ position: 'absolute', width: '600px', height: '600px', top: '200px', right: '-100px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />
                <div style={{ position: 'absolute', width: '800px', height: '800px', top: '800px', left: '50%', transform: 'translateX(-50%)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(236, 72, 153, 0.04) 0%, transparent 75%)', filter: 'blur(80px)' }} />
            </div>

            {/* Immersive Space Hero Section */}
            <section className={styles.hero}>
                <div className={styles['hero-content']}>
                    <div className={styles['hero-badge']}>
                        <span className="live-dot pulsing" style={{ background: 'var(--color-success)', boxShadow: '0 0 12px var(--color-success)' }} />
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
                        <Link href="/join" className="btn btn-secondary btn-lg" style={{ borderRadius: 'var(--radius-xl)', padding: '0.9rem 2.5rem', fontSize: '0.95rem' }}>
                            <i className="fa-solid fa-ticket-simple" style={{ marginRight: '6px' }} /> Join a Queue (Client Demo)
                        </Link>
                    </div>

                    {/* Live Telemetry Ticker Dashboard */}
                    <div className={styles['hero-stats']}>
                        <div className={styles['hero-stat-item']}>
                            <span className={styles['hero-stat-value']}>
                                {telemetry.processedTokens.toLocaleString()}
                            </span>
                            <span className={styles['hero-stat-label']}>Tokens Served</span>
                        </div>
                        <div className={styles['hero-stat-item']}>
                            <span className={styles['hero-stat-value']} style={{ color: 'var(--color-primary)' }}>
                                {telemetry.activeDesks}
                            </span>
                            <span className={styles['hero-stat-label']}>Live Station Desks</span>
                        </div>
                        <div className={styles['hero-stat-item']}>
                            <span className={styles['hero-stat-value']} style={{ color: 'var(--color-success)' }}>
                                {telemetry.breachRatio}%
                            </span>
                            <span className={styles['hero-stat-label']}>SLA Breach Prevention</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Solid Symmetric Bento Grid Showcase */}
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
                        <div className={styles['bento-badge']} style={{ color: 'var(--color-success)', background: 'var(--color-success-bg)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
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
                                
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                    <div style={{ padding: '0.45rem 0.85rem', background: 'var(--color-primary-subtle)', border: '1px solid rgba(124, 58, 237, 0.2)', borderRadius: '10px', fontSize: '0.72rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <i className="fa-regular fa-clock" /> Target SLA: 15m
                                    </div>
                                    <div style={{ padding: '0.45rem 0.85rem', background: 'var(--color-success-bg)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '10px', fontSize: '0.72rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <i className="fa-solid fa-chart-line" /> QBI Score: 0.14
                                    </div>
                                    <div style={{ padding: '0.45rem 0.85rem', background: 'var(--color-warning-bg)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '10px', fontSize: '0.72rem', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '5px' }}>
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
                                <div className={styles['bento-badge']} style={{ color: 'var(--color-primary)', background: 'var(--color-primary-subtle)', borderColor: 'rgba(192, 132, 252, 0.2)' }}>
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

                            {/* Phone Screen Mockup */}
                            <div style={{
                                marginTop: '1.5rem', padding: '1.25rem', background: '#f8fafc',
                                border: '1px solid var(--border-color)', borderRadius: '16px',
                                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', fontWeight: 800, letterSpacing: '0.05em' }}>BHIM UPI GATEWAY</span>
                                    <span className="live-dot" style={{ background: 'var(--color-success)', width: '6px', height: '6px' }} />
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>₹99.00 <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>VIP PASS</span></div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>SLA auto-prioritization splits applied</div>
                                
                                <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                                    <span style={{ padding: '0.3rem 0.5rem', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.58rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}><i className="fa-brands fa-google-pay" style={{ color: 'var(--color-info)' }} /> GPay</span>
                                    <span style={{ padding: '0.3rem 0.5rem', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.58rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}><i className="fa-solid fa-money-bill-transfer" /> PhonePe</span>
                                    <span style={{ padding: '0.3rem 0.5rem', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.58rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}><i className="fa-solid fa-wallet" /> Paytm</span>
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

                            {/* Merchant Coupon Mini Mockup */}
                            <div style={{
                                padding: '0.85rem', border: '1px dashed var(--color-warning)',
                                borderRadius: '12px', background: 'var(--color-warning-bg)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Samosa & Chai Combo</div>
                                    <div style={{ fontSize: '0.62rem', color: 'var(--color-warning)' }}>Counter 3 Merchant Deal</div>
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--color-warning)' }}>₹49</div>
                            </div>
                        </div>
                    </div>

                    {/* Bento Box 4: Cohort Wait-Room Group Merges (Normal) */}
                    <div className={styles['bento-item']}>
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div className={styles['bento-icon']} style={{ color: 'var(--color-info)' }}>
                                    <i className="fa-solid fa-people-group" />
                                </div>
                                <h3 className={styles['bento-title']}>Group Token Merging</h3>
                                <p className={styles['bento-desc']}>
                                    Dynamic family and group pass merges. Cohesively bundles 1–5 patrons to adjacent counter operators.
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '0.35rem', overflow: 'hidden' }}>
                                <span style={{ flex: 1, padding: '0.4rem', background: 'var(--color-info-bg)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', color: 'var(--color-info)', fontSize: '0.65rem', fontWeight: 800, textAlign: 'center' }}>TK-081</span>
                                <span style={{ flex: 1, padding: '0.4rem', background: 'var(--color-info-bg)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', color: 'var(--color-info)', fontSize: '0.65rem', fontWeight: 800, textAlign: 'center' }}>TK-082</span>
                                <span style={{ flex: 1, padding: '0.4rem', background: 'var(--color-info-bg)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', color: 'var(--color-info)', fontSize: '0.65rem', fontWeight: 800, textAlign: 'center' }}>TK-083</span>
                            </div>
                        </div>
                    </div>

                    {/* Bento Box 5: Custom Industry Baseline Queues (Colspan 2) */}
                    <div className={`${styles['bento-item']} ${styles['bento-colspan-2']}`}>
                        <div className={styles['bento-badge']} style={{ color: 'var(--color-warning)', background: 'var(--color-warning-bg)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                            <i className="fa-solid fa-globe" /> Indian Locales
                        </div>
                        <div style={{ display: 'flex', gap: '1.75rem', alignItems: 'flex-start', height: '100%' }}>
                            <div className={styles['bento-icon']} style={{ color: '#ec4899' }}>
                                <i className="fa-solid fa-cubes" />
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                                <div>
                                    <h3 className={styles['bento-title']}>Auto-Generated Industry Lanes</h3>
                                    <p className={styles['bento-desc']}>
                                        Instantly configures service parameters mapped to local high-pressure spaces. Pre-seeded queues load baseline metrics for medical clinics, utility E-Sevaim center, PUC automobile lanes, salons, food kiosks, and transit booking lobbies.
                                    </p>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><i className="fa-solid fa-hospital" style={{ color: 'var(--color-danger)' }} /> OPD Clinic</span>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><i className="fa-solid fa-landmark" style={{ color: 'var(--color-info)' }} /> Govt E-Sevai</span>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><i className="fa-solid fa-scissors" style={{ color: '#ec4899' }} /> Hair Styling</span>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><i className="fa-solid fa-gas-pump" style={{ color: 'var(--color-warning)' }} /> Auto PUC</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bento Box 6: WhatsApp Trackers & Ledgers (Normal) */}
                    <div className={styles['bento-item']}>
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div className={styles['bento-icon']} style={{ color: 'var(--color-success)' }}>
                                    <i className="fa-brands fa-whatsapp" />
                                </div>
                                <h3 className={styles['bento-title']}>WhatsApp Broadcasts</h3>
                                <p className={styles['bento-desc']}>
                                    Dynamic SMS and notifications keep patrons informed exactly when to make their counter approaches.
                                </p>
                            </div>

                            <div style={{
                                padding: '0.75rem', background: 'var(--color-success-bg)',
                                border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px 10px 10px 0'
                            }}>
                                <span style={{ fontSize: '0.62rem', color: 'var(--color-success)', fontWeight: 800, display: 'block', marginBottom: '0.15rem' }}>SKIPQ STATUS</span>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>Token TK-014: Please proceed to OPD Desk 2 now!</p>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* ==========================================================
               SECTION 3: INTERACTIVE GEMINI PROMPT PLAYGROUND
               ========================================================== */}
            <section className="container section" id="ai-playground" style={{ maxWidth: '1200px', margin: '0 auto', padding: '6rem var(--space-6)', position: 'relative', zIndex: 10 }}>
                <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
                    <span className={styles['section-tag']}>Innovation Showcase</span>
                    <h2 className={styles['section-title']}>Google AI Studio Prompt Playground</h2>
                    <p className={styles['section-desc']}>
                        Experience how SkipQ leverages Gemini to turn numbers into human guidance. Select a scenario preset below, inspect the <strong>System Instructions</strong> and <strong>Queue JSON Metrics</strong>, and hit **Run Prompt** to see Gemini generate real-time instructions.
                    </p>
                </div>

                <div className={styles['playground-wrapper']}>
                    <div className={styles['playground-header']}>
                        <div className={styles['playground-logo']}>
                            <span className={styles['studio-badge']}>Google</span>
                            <strong>AI Studio Sandbox</strong>
                        </div>
                        <div className={styles['playground-presets']}>
                            <span>Preset:</span>
                            <select 
                                className={styles['preset-select']} 
                                value={activePresetKey} 
                                onChange={(e) => handlePresetChange(e.target.value)}
                                aria-label="Select AI Studio Preset"
                            >
                                <option value="aiims">AIIMS Hospital OPD Clinic (New Delhi)</option>
                                <option value="iit">IIT Registrar Certificate Desk (Mumbai)</option>
                                <option value="sbi">SBI Counter 3 Accounts Branch (Lucknow)</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles['playground-body']}>
                        {/* Settings Sidebar */}
                        <aside className={styles['playground-sidebar']}>
                            <span className={styles['sidebar-title']}>Model Configuration</span>
                            
                            <div className={styles['control-group']}>
                                <label htmlFor="model-select">Model</label>
                                <select id="model-select" disabled>
                                    <option>gemini-2.5-flash (APAC Edition)</option>
                                </select>
                            </div>

                            <div className={styles['control-group']}>
                                <div className={styles['slider-header']}>
                                    <label htmlFor="temp-slider">Temperature</label>
                                    <span className={styles['slider-val']}>{temperature.toFixed(2)}</span>
                                </div>
                                <input 
                                    type="range" 
                                    id="temp-slider" 
                                    min="0" 
                                    max="1" 
                                    step="0.05" 
                                    value={temperature} 
                                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                    aria-label="Temperature slider"
                                    style={{ accentColor: 'var(--color-primary)' }}
                                />
                            </div>

                            <div className={styles['sys-inst-box']}>
                                <label htmlFor="sys-inst">System Instructions</label>
                                <textarea 
                                    id="sys-inst" 
                                    className={styles['sys-inst-textarea']} 
                                    value={sysInstVal} 
                                    onChange={(e) => setSysInstVal(e.target.value)}
                                    placeholder="Enter model system prompts..."
                                />
                            </div>
                        </aside>

                        {/* Workspace area */}
                        <div className={styles['playground-workspace']}>
                            <div className={styles['playground-editor-area']}>
                                <div className={styles['prompt-block']}>
                                    <span className={styles['prompt-block-label']}>
                                        <i className="fas fa-code"></i> Input JSON Queue State (Elysia API variables)
                                    </span>
                                    <div className={styles['prompt-input-mock']}>{jsonVal}</div>
                                </div>

                                <div className={styles['prompt-block']}>
                                    <span className={styles['prompt-block-label']}>
                                        <i className="fas fa-wand-magic-sparkles"></i> Gemini AI Response (Streamed Output)
                                    </span>
                                    <div className={styles['output-container']}>
                                        <div className={styles['output-header']}>
                                            <span>DYNAMIC VISITOR INSTRUCTIONS</span>
                                            <span className={styles['output-badge']}>Vertex AI API</span>
                                        </div>
                                        <div 
                                            className={styles['output-content']}
                                            dangerouslySetInnerHTML={{ __html: playgroundOutput }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles['playground-footer']}>
                                <span className={styles['playground-token-info']}>
                                    Input Tokens: <span>{Math.floor(sysInstVal.length / 4) + 120}</span> | Output Tokens: <span>{outputTokens}</span>
                                </span>
                                <div className={styles['action-bar']}>
                                    <button 
                                        className="btn btn-secondary" 
                                        onClick={() => handlePresetChange(activePresetKey)}
                                        disabled={playgroundRunning}
                                    >
                                        <i className="fas fa-rotate-left"></i> Reset Presets
                                    </button>
                                    <button 
                                        className={`${styles['btn-run']} btn ${playgroundRunning ? styles.loading : ''}`} 
                                        onClick={handlePlaygroundRun}
                                        disabled={playgroundRunning}
                                    >
                                        <span className={styles.spinner}></span>
                                        <i className="fas fa-play" style={{ display: playgroundRunning ? 'none' : 'inline-block' }}></i>
                                        <span>Run Model Prompt</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==========================================================
               SECTION 4: INTERACTIVE LIVE DUAL SIMULATOR
               ========================================================== */}
            <section className="container section" id="live-simulator" style={{ maxWidth: '1200px', margin: '0 auto', padding: '6rem var(--space-6)', position: 'relative', zIndex: 10 }}>
                <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
                    <span className={styles['section-tag']}>Interactive Walkthrough</span>
                    <h2 className={styles['section-title']}>Live Dual-View Queue Simulator</h2>
                    <p className={styles['section-desc']}>
                        Witness how SkipQ acts as a complete, live B2B SaaS platform. The simulator syncs a <strong>Customer's Mobile Ticket</strong> (left) with the <strong>Operator Desk Dashboard</strong> (right). Add new customers, call tokens, or bench no-shows, and see wait-times and Gemini advice recalculate instantly!
                    </p>
                </div>

                <div className={styles['simulator-layout']}>
                    {/* Left Customer Mobile view */}
                    <article className={styles['mobile-wrapper']} aria-label="Customer mobile ticket view">
                        <div className={styles['mobile-screen']}>
                            <header className={styles['mobile-header']}>
                                <strong><i className="fas fa-hospital" style={{ color: 'var(--color-primary)', marginRight: '6px' }}></i> AIIMS Delhi OPD</strong>
                                <span className={`${styles['ticket-status-dot']} ${isActiveServing ? styles.active : ''}`}>
                                    <i className={`fas ${isActiveServing ? 'fa-circle-check' : isBenched ? 'fa-user-clock' : 'fa-circle-nodes'}`}></i> {ticketStatusText}
                                </span>
                            </header>

                            <div className={styles['mobile-content']}>
                                <div className={styles['mobile-ticket']}>
                                    <div className={styles['ticket-header']}>
                                        <span>Outpatient Consultation</span>
                                        <h4>Dr. A. Sharma (General Medicine)</h4>
                                    </div>
                                    <div className={styles['ticket-body']}>
                                        <div className={styles['ticket-qr']}>
                                            <svg viewBox="0 0 100 100">
                                                <rect x="0" y="0" width="28" height="28" fill="var(--text-primary)"/>
                                                <rect x="4" y="4" width="20" height="20" fill="#ffffff"/>
                                                <rect x="8" y="8" width="12" height="12" fill="var(--text-primary)"/>
                                                
                                                <rect x="72" y="0" width="28" height="28" fill="var(--text-primary)"/>
                                                <rect x="76" y="4" width="20" height="20" fill="#ffffff"/>
                                                <rect x="80" y="8" width="12" height="12" fill="var(--text-primary)"/>
                                                
                                                <rect x="0" y="72" width="28" height="28" fill="var(--text-primary)"/>
                                                <rect x="4" y="76" width="20" height="20" fill="#ffffff"/>
                                                <rect x="8" y="80" width="12" height="12" fill="var(--text-primary)"/>
                                                
                                                <rect x="36" y="10" width="8" height="18" fill="var(--text-primary)"/>
                                                <rect x="50" y="4" width="12" height="8" fill="var(--text-primary)"/>
                                                <rect x="36" y="36" width="18" height="8" fill="var(--text-primary)"/>
                                                <rect x="72" y="36" width="20" height="10" fill="var(--text-primary)"/>
                                                <rect x="10" y="36" width="16" height="20" fill="var(--text-primary)"/>
                                                <rect x="36" y="72" width="12" height="18" fill="var(--text-primary)"/>
                                                <rect x="58" y="72" width="8" height="8" fill="var(--text-primary)"/>
                                                <rect x="76" y="58" width="20" height="28" fill="var(--text-primary)"/>
                                                <rect x="80" y="62" width="12" height="12" fill="#ffffff"/>
                                            </svg>
                                        </div>

                                        <span>YOUR TOKEN NUMBER</span>
                                        <strong className={styles['ticket-number']}>H-104</strong>

                                        <div className={styles['ticket-metrics']}>
                                            <div className={styles['metric-box']}>
                                                <span>Ahead of You</span>
                                                <strong>{ticketPeopleAhead}</strong>
                                            </div>
                                            <div className={styles['metric-box']}>
                                                <span>Est. Wait</span>
                                                <strong>{ticketEstWait}</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles['ticket-ai-guidance']}>
                                    <i className="fas fa-sparkles"></i>
                                    <div className={styles['guidance-text']}>
                                        <h5>Gemini Smart Advice</h5>
                                        <p>{ticketAiAdviceText}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </article>

                    {/* Right Operator Desk Dashboard */}
                    <article className={styles['console-wrapper']} aria-label="Operator desk view and controls">
                        <div className={styles['console-header-stats']}>
                            <div className="stat-card">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span className={styles['stat-label']}>Total in Queue</span>
                                    <strong className={styles['stat-value']}>{queue.length}</strong>
                                </div>
                                <div className={styles['stat-icon-wrapper']}><i className="fas fa-users"></i></div>
                            </div>
                            <div className="stat-card">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span className={styles['stat-label']}>Avg Wait Time</span>
                                    <strong className={styles['stat-value']}>8.5 mins</strong>
                                </div>
                                <div className={styles['stat-icon-wrapper']}><i className="fas fa-stopwatch"></i></div>
                            </div>
                            <div className="stat-card">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span className={styles['stat-label']}>Completed Today</span>
                                    <strong className={styles['stat-value']}>{completedCount}</strong>
                                </div>
                                <div className={styles['stat-icon-wrapper']}><i className="fas fa-circle-check"></i></div>
                            </div>
                        </div>

                        {/* Counter Controls */}
                        <div className={styles['desk-card']}>
                            <div className={styles['desk-header']}>
                                <h4>OPD Counter Desk 4 - Consultation Triage</h4>
                                <span className={styles['desk-status']}>Operator Active</span>
                            </div>
                            <div className={styles['desk-body']}>
                                <div className={styles['desk-current-serving']}>
                                    <span>Now Serving</span>
                                    <strong className={styles['active-serving-num']}>
                                        {queue.find(item => item.status === 'serving')?.token || 'None'}
                                    </strong>
                                    <p>{queue.find(item => item.status === 'serving')?.name || 'Counter Empty'}</p>
                                </div>
                                <div className={styles['desk-controls']}>
                                    <p><strong>Counter Queue Administration Panel:</strong> Call the next visitor, bench no-shows, or mark the current customer's checkup complete.</p>
                                    <div className={styles['desk-controls-row']}>
                                        <button 
                                            className="btn btn-primary" 
                                            onClick={handleCallNext} 
                                            style={{ background: 'var(--color-success)', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}
                                        >
                                            <i className="fas fa-bullhorn"></i> Call Next (Advance)
                                        </button>
                                        <button className="btn btn-secondary" onClick={handleMarkNoShow}>
                                            <i className="fas fa-user-clock"></i> Mark No-Show (Bench)
                                        </button>
                                        <button className="btn btn-secondary" onClick={handleCompleteService}>
                                            <i className="fas fa-check-double"></i> Complete Service
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Queue Table */}
                        <div className={styles['queue-table-card']}>
                            <div className={styles['queue-table-header']}>
                                <h4>Active Queue Checkouts</h4>
                                <span className={styles['playground-token-info']}>WebSocket Live Feed</span>
                            </div>
                            <div className={styles['queue-table-wrapper']}>
                                <table className={styles['queue-table']}>
                                    <thead>
                                        <tr>
                                            <th>Token</th>
                                            <th>Name</th>
                                            <th>Language</th>
                                            <th>Priority / Note</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {queue.map(item => (
                                            <tr key={item.token} style={{ background: item.status === 'serving' ? 'rgba(124, 58, 237, 0.04)' : undefined }}>
                                                <td><strong>{item.token}</strong></td>
                                                <td>{item.name}</td>
                                                <td>{item.lang}</td>
                                                <td><span className={styles['tech-tag']}>{item.priority}</span></td>
                                                <td>
                                                    <span className={`badge ${item.status === 'serving' ? 'badge-primary' : item.status === 'benched' ? 'badge-warning' : 'badge-neutral'}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Form join input */}
                        <div className={styles['join-form-wrapper']}>
                            <span><strong>Add Simulated Visitor:</strong></span>
                            <input 
                                type="text" 
                                placeholder="Enter Visitor Name (e.g. Priya Sharma)"
                                value={addName}
                                onChange={(e) => setAddName(e.target.value)}
                            />
                            <select 
                                className={styles['preset-select']}
                                value={addLang}
                                onChange={(e) => setAddLang(e.target.value)}
                                style={{ width: 'auto' }}
                                aria-label="Select visitor language"
                            >
                                <option value="English">English</option>
                                <option value="Hindi">Hindi (हिन्दी)</option>
                                <option value="Tamil">Tamil (தமிழ்)</option>
                            </select>
                            <select 
                                className={styles['preset-select']}
                                value={addPriority}
                                onChange={(e) => setAddPriority(e.target.value)}
                                style={{ width: 'auto' }}
                                aria-label="Select visitor priority tag"
                            >
                                <option value="Standard">Standard Visitor</option>
                                <option value="Senior Citizen">Senior Citizen (Seating assistance)</option>
                                <option value="Urgent Case">Urgent Scholarship / Medical Case</option>
                            </select>
                            <button className="btn btn-primary" onClick={handleAddSimulatedVisitor}>
                                <i className="fas fa-user-plus"></i> Join Queue
                            </button>
                        </div>
                    </article>
                </div>
            </section>

            {/* ==========================================================
               SECTION 6: WHATSAPP SYNC & DIGITAL INCLUSION
               ========================================================== */}
            <section className="container section" id="whatsapp-inclusion" style={{ maxWidth: '1200px', margin: '0 auto', padding: '6rem var(--space-6)', position: 'relative', zIndex: 10 }}>
                <div className={styles['impact-showcase-grid']}>
                    <div>
                        <span className={styles['section-tag']}>Market & Scalability</span>
                        <h2 className={styles['section-title']} style={{ textAlign: 'left' }}>Targeting the Heart of Digital Inclusion</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.65', marginBottom: '16px' }}>
                            India is a mobile-first country, yet high-speed data connectivity can be inconsistent, especially inside thick-walled public concrete buildings. Furthermore, digital literacy varies extensively.
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '24px', lineHeight: '1.6' }}>
                            SkipQ bridges this digital divide. By utilizing <strong>Gemini’s ultra-compact semantic processing</strong>, we translate heavy status metrics into standard offline notifications. When a citizen scans a QR code at an SBI Counter or government hospital, they can opt to close the browser entirely and receive live updates and ticket alerts natively via WhatsApp message updates.
                        </p>
                        <div className={styles['hero-actions']} style={{ justifyContent: 'flex-start' }}>
                            <a href="#live-simulator" className="btn btn-secondary">
                                <i className="fas fa-users-viewfinder"></i> Test Interactive Simulator
                            </a>
                        </div>

                        {/* Interactive WhatsApp Mockup */}
                        <div className={styles['whatsapp-phone-mockup']}>
                            <div className={styles['wa-header']}>
                                <div className={styles['wa-avatar']}>SQ</div>
                                <div className={styles['wa-title-container']}>
                                    <span className={styles['wa-name']}>SkipQ Waitlist Agent</span>
                                    <span className={styles['wa-status']}>Online - WhatsApp Cloud API</span>
                                </div>
                                <i className="fas fa-ellipsis-vertical" aria-hidden="true"></i>
                            </div>
                            <div className={styles['wa-body']}>
                                <div className={styles['wa-bubble']}>
                                    <h5><i className="fas fa-sparkles"></i> Gemini Triage Alert</h5>
                                    <p dangerouslySetInnerHTML={{ __html: getWhatsAppBubbleContent() }} />
                                    <span className={styles['wa-time']}>10:42 PM</span>
                                </div>
                                <div className={styles['wa-options-row']}>
                                    <button className={styles['wa-chip']} onClick={() => triggerToast('SBI Counter 3 Alert: Presence confirmed.')}>I'm Here</button>
                                    <button className={styles['wa-chip']} onClick={() => {
                                        const waitingItems = queue.filter(item => item.status === 'waiting');
                                        if (waitingItems.length > 0) {
                                            const itemToDelay = waitingItems[0];
                                            let newQueue = [...queue];
                                            const idx = newQueue.indexOf(itemToDelay);
                                            newQueue.splice(idx, 1);
                                            newQueue.push(itemToDelay);
                                            setQueue(newQueue);
                                            triggerToast(`WhatsApp Command: Postponed ${itemToDelay.name}'s token.`);
                                        } else {
                                            triggerToast('No waiting visitors to delay.');
                                        }
                                    }}>Postpone 5m</button>
                                    <button className={styles['wa-chip']} onClick={() => {
                                        const waitingItems = queue.filter(item => item.status === 'waiting');
                                        if (waitingItems.length > 0) {
                                            const itemToCancel = waitingItems[0];
                                            let newQueue = [...queue];
                                            const idx = newQueue.indexOf(itemToCancel);
                                            newQueue.splice(idx, 1);
                                            setQueue(newQueue);
                                            triggerToast(`WhatsApp Command: Cancelled token for ${itemToCancel.name}.`);
                                        } else {
                                            triggerToast('No active waiting visitor to cancel.');
                                        }
                                    }}>Cancel Ticket</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles['impact-illustrations']}>
                        <div className={styles['ill-card']}>
                            <i className="fab fa-whatsapp"></i>
                            <h4>WhatsApp Push updates</h4>
                            <p>No high-speed mobile data needed at the venue. Receive clean text updates and alert cards directly via WhatsApp.</p>
                        </div>
                        <div className={styles['ill-card']}>
                            <i className="fas fa-language"></i>
                            <h4>Multilingual Localization</h4>
                            <p>Gemini auto-detects dialect needs and formats clear queue advice in Hindi, Tamil, Telugu, and more.</p>
                        </div>
                        <div className={styles['ill-card']}>
                            <i className="fas fa-shield-halved"></i>
                            <h4>Secure Aadhaar Triage</h4>
                            <p>Fast, secure ID-sweep options check visitor requirements against specific desk needs before they join the queue.</p>
                        </div>
                        <div className={styles['ill-card']}>
                            <i className="fas fa-chart-line"></i>
                            <h4>Vertex Predictive Scale</h4>
                            <p>Predicts seasonal rush spikes (e.g. monsoon OPD waves, registrar certificate runs) to optimize branch desks.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==========================================================
               SECTION 7: ROI waitlist calculator
               ========================================================== */}
            <section className="container section" id="roi-calculator" style={{ maxWidth: '1200px', margin: '0 auto', padding: '6rem var(--space-6)', position: 'relative', zIndex: 10 }}>
                <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
                    <span className={styles['section-tag']}>Business Intelligence</span>
                    <h2 className={styles['section-title']}>SaaS Opportunity & Wait Time Savings Calculator</h2>
                    <p className={styles['section-desc']}>
                        SkipQ delivers massive economic value. By automating queue coordination and shifting waiting to nearby businesses or offsite zones, SkipQ preserves national productivity. Drag the sliders below to calculate the potential yearly hours saved and opportunity value unlocked for your organization.
                    </p>
                </div>

                <div className={styles['roi-calculator-card']}>
                    <div className={styles['roi-inputs']}>
                        <div className={styles['control-group']}>
                            <div className={styles['slider-header']}>
                                <label htmlFor="roi-visitors">Daily Branch Visitors</label>
                                <span className={styles['slider-val']}>{roiVisitors} citizens/day</span>
                            </div>
                            <input 
                                type="range" 
                                id="roi-visitors" 
                                min="50" 
                                max="1000" 
                                step="25" 
                                value={roiVisitors} 
                                onChange={(e) => setRoiVisitors(parseInt(e.target.value))}
                                aria-label="Daily visitors slider"
                                style={{ accentColor: 'var(--color-primary)' }}
                            />
                        </div>

                        <div className={styles['control-group']}>
                            <div className={styles['slider-header']}>
                                <label htmlFor="roi-wait">Wait Time Saved per Citizen</label>
                                <span className={styles['slider-val']}>{roiWait} minutes</span>
                            </div>
                            <input 
                                type="range" 
                                id="roi-wait" 
                                min="5" 
                                max="90" 
                                step="5" 
                                value={roiWait} 
                                onChange={(e) => setRoiWait(parseInt(e.target.value))}
                                aria-label="Wait time saved slider"
                                style={{ accentColor: 'var(--color-primary)' }}
                            />
                        </div>

                        <div className={styles['control-group']}>
                            <div className={styles['slider-header']}>
                                <label htmlFor="roi-wage">Average Hourly Productivity Rate</label>
                                <span className={styles['slider-val']}>₹{roiWage}/hour</span>
                            </div>
                            <input 
                                type="range" 
                                id="roi-wage" 
                                min="40" 
                                max="400" 
                                step="10" 
                                value={roiWage} 
                                onChange={(e) => setRoiWage(parseInt(e.target.value))}
                                aria-label="Average hourly rate slider"
                                style={{ accentColor: 'var(--color-primary)' }}
                            />
                        </div>
                    </div>

                    <div className={styles['roi-outputs']}>
                        <i className="fas fa-coins" style={{ fontSize: '2.2rem', color: 'var(--color-success)' }} aria-hidden="true"></i>
                        <strong>Estimated Value Unlocked</strong>
                        <div className={styles['roi-val-display']}>₹{roiValueSaved.toLocaleString('en-IN')}</div>
                        <p>representing <span>{roiHoursSaved.toLocaleString('en-IN')}</span> productivity hours returned to citizens annually per branch.</p>
                    </div>
                </div>
            </section>

            {/* Beautiful Portal Pathways Cards Grid */}
            <section className="container section" style={{ padding: '6rem var(--space-6)', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
                <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
                    <span className={styles['section-tag']} style={{ color: 'var(--color-primary)' }}>Interactive Pathways</span>
                    <h2 className={styles['section-title']}>Three Gateways. One Fluid Engine.</h2>
                    <p className={styles['section-desc']}>Access specialized terminals mapped specifically to your administrative role in the SkipQ ecosystem.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2.5rem' }}>
                    
                    {/* Portal 1: Client Admin */}
                    <div className={styles['pricing-card']}>
                        <div>
                            <div style={{
                                width: '56px', height: '56px', background: 'var(--color-primary-subtle)',
                                color: 'var(--color-primary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '1px solid rgba(124, 58, 237, 0.25)', marginBottom: '2rem'
                            }}>
                                <i className="fa-solid fa-house-laptop" style={{ fontSize: '1.4rem' }} />
                            </div>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.85rem', color: 'var(--text-primary)' }}>Business Client Dashboard</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
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
                                width: '56px', height: '56px', background: 'var(--color-success-bg)',
                                color: 'var(--color-success)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '1px solid rgba(16, 185, 129, 0.25)', marginBottom: '2rem'
                            }}>
                                <i className="fa-solid fa-desktop" style={{ fontSize: '1.4rem' }} />
                            </div>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.85rem', color: 'var(--text-primary)' }}>Desk Operator Counter</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
                                Log directly into physical counter counters, claim operator roles, trigger dynamic audio calls for next clients, process feedback scoring forms, or transfer buffer tokens.
                            </p>
                        </div>
                        <Link href="/desk" className="btn btn-secondary btn-full" style={{ padding: '1rem', borderRadius: 'var(--radius-xl)', fontWeight: 700, fontSize: '0.9rem' }}>
                            Operator Panel <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.8em', marginLeft: '8px' }} />
                        </Link>
                    </div>

                    {/* Portal 3: Super Management */}
                    <div className={styles['pricing-card']} style={{ border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                        <div>
                            <div style={{
                                width: '56px', height: '56px', background: 'var(--color-warning-bg)',
                                color: 'var(--color-warning)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '1px solid rgba(245, 158, 11, 0.25)', marginBottom: '2rem'
                            }}>
                                <i className="fa-solid fa-gauge-high" style={{ fontSize: '1.4rem' }} />
                            </div>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.85rem', color: 'var(--text-primary)' }}>SkipQ Telemetry Center</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
                                Access deep-system telemetry logs. Monitor transactional memory pools, trigger manual db journal compaction cycles, authorize pending branch queues, and manage ARR/MRR SaaS plans.
                            </p>
                        </div>
                        <Link href="/management/login" className="btn btn-secondary btn-full" style={{ padding: '1rem', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(245, 158, 11, 0.3)', background: 'var(--color-warning-subtle)', color: 'var(--color-warning)', fontWeight: 700, fontSize: '0.9rem' }}>
                            Telemetry Portal <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.8em', marginLeft: '8px' }} />
                        </Link>
                    </div>

                </div>
            </section>

            {/* SaaS Subscription Packaging */}
            <section id="pricing-tiers" className="container section" style={{ padding: '6rem var(--space-6)', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
                <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
                    <span className={styles['section-tag']} style={{ color: '#ec4899', background: 'rgba(236, 72, 153, 0.05)', borderColor: 'rgba(236, 72, 153, 0.15)' }}>Ecosystem Subscriptions</span>
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
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                                Best suited for single boutique retail shops, local diagnostic clinics, or dining outlets.
                            </p>
                            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', marginBottom: '2.5rem' }} />
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                                <li><i className="fa-solid fa-circle-check" style={{ color: 'var(--color-success)', marginRight: '10px' }} /> 1 Active Venue Branch</li>
                                <li><i className="fa-solid fa-circle-check" style={{ color: 'var(--color-success)', marginRight: '10px' }} /> 2 Station Desks Limit</li>
                                <li><i className="fa-solid fa-circle-check" style={{ color: 'var(--color-success)', marginRight: '10px' }} /> Auto-provisioned Industry Lanes</li>
                                <li><i className="fa-solid fa-circle-check" style={{ color: 'var(--color-success)', marginRight: '10px' }} /> SAC-998311 Compliant Ledger</li>
                            </ul>
                        </div>
                        <button className="btn btn-secondary btn-full" style={{ padding: '1rem', borderRadius: 'var(--radius-xl)', marginTop: '3.5rem', fontWeight: 700 }} onClick={() => setSelectedPackage('starter')}>
                            Select Starter Plan
                        </button>
                    </div>

                    {/* Plan 2: Pro Core (Featured) */}
                    <div className={`${styles['pricing-card']} ${styles['pricing-featured']}`}>
                        <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Highly Popular</span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', margin: '1rem 0 1.5rem 0' }}>
                                <span className={styles['plan-price-large']}>₹4,999</span>
                                <span style={{ fontSize: '0.9rem', color: 'var(--color-primary)' }}>/ month</span>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-primary)', opacity: 0.85, lineHeight: 1.6, marginBottom: '2.5rem' }}>
                                Engineered for larger clinics, high-volume government utility centers, and multiple branch sites.
                            </p>
                            <hr style={{ border: 'none', borderTop: '1px solid rgba(124, 58, 237, 0.15)', marginBottom: '2.5rem' }} />
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                                <li><i className="fa-solid fa-circle-check" style={{ color: 'var(--color-success)', marginRight: '10px' }} /> 3 Active Venue Branches</li>
                                <li><i className="fa-solid fa-circle-check" style={{ color: 'var(--color-success)', marginRight: '10px' }} /> 6 Station Desks Limit</li>
                                <li><i className="fa-solid fa-circle-check" style={{ color: 'var(--color-success)', marginRight: '10px' }} /> Dynamic LBTDA Pro Active</li>
                                <li><i className="fa-solid fa-circle-check" style={{ color: 'var(--color-success)', marginRight: '10px' }} /> Priority SLA Desk Approvals</li>
                                <li><i className="fa-solid fa-circle-check" style={{ color: 'var(--color-success)', marginRight: '10px' }} /> Live In-Venue Bento Spot-Offers</li>
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
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                                Designed for major municipal offices, airport terminals, and multi-state medical networks.
                            </p>
                            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', marginBottom: '2.5rem' }} />
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                                <li><i className="fa-solid fa-circle-check" style={{ color: 'var(--color-success)', marginRight: '10px' }} /> Unlimited Venue Branches</li>
                                <li><i className="fa-solid fa-circle-check" style={{ color: 'var(--color-success)', marginRight: '10px' }} /> Unlimited Station Desks</li>
                                <li><i className="fa-solid fa-circle-check" style={{ color: 'var(--color-success)', marginRight: '10px' }} /> Custom Customer Feedback Forms</li>
                                <li><i className="fa-solid fa-circle-check" style={{ color: 'var(--color-success)', marginRight: '10px' }} /> Dedicated Regional Server Node</li>
                            </ul>
                        </div>
                        <button className="btn btn-secondary btn-full" style={{ padding: '1rem', borderRadius: 'var(--radius-xl)', marginTop: '3.5rem', fontWeight: 700 }} onClick={() => setSelectedPackage('enterprise')}>
                            Contact Enterprise
                        </button>
                    </div>

                </div>
            </section>

            {/* Founder's Vision */}
            <section className="container section" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '40px', margin: '0 auto 60px auto', maxWidth: '1200px', position: 'relative', zIndex: 10 }}>
                <span className={styles['section-tag']}>Product Vision</span>
                <h2 className={styles['section-title']}>Founder's Vision — Harish Rohith S</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.7', marginBottom: '20px' }}>
                    I built SkipQ because waitlists shouldn't feel like a black box. In many busy Indian institutions, manual processes lead to crowding, shouting, and hours of wasted time for ordinary citizens. 
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.7', marginBottom: '24px' }}>
                    By utilizing Google AI tools, we transform basic queuing metrics into warm, supportive, multilingual advice. SkipQ isn't just about managing numbers; it's about giving citizens their day back, making overcrowded counters calmer, and building digital infrastructure that leaves no one behind.
                </p>
                
                <div className={styles['hero-actions']} style={{ marginBottom: 0, justifyContent: 'flex-start' }}>
                    <button className="btn btn-primary" onClick={handleLinkedInShare}>
                        <i className="fab fa-linkedin"></i> Share Project on LinkedIn
                    </button>
                    <button className="btn btn-secondary" onClick={copyCurrentLink}>
                        <i className="fas fa-link"></i> Copy Launch Link
                    </button>
                </div>
            </section>

            {/* Onboarding Wizard Modal Overlay */}
            {selectedPackage && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(16px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card animate-fade-in" style={{
                        maxWidth: '520px', width: '90%', padding: '2.5rem',
                        background: '#ffffff', border: '1px solid var(--border-color)',
                        borderRadius: '24px', boxShadow: '0 25px 60px rgba(15, 23, 42, 0.15)'
                    }}>
                        
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div>
                                <span className="badge badge-primary" style={{ textTransform: 'uppercase', color: 'var(--color-primary)', background: 'var(--color-primary-subtle)', border: '1px solid rgba(124,58,237,0.15)', fontSize: '0.65rem', fontWeight: 800 }}>
                                    {selectedPackage} Onboarding Wizard
                                </span>
                                <h3 style={{ fontWeight: 900, marginTop: '0.5rem', fontSize: '1.5rem', color: 'var(--text-primary)' }}>Ecosystem Provisioning</h3>
                            </div>
                            <button className="btn btn-secondary btn-sm" style={{ padding: '0.45rem', borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }} onClick={cancelWizard}>
                                <i className="fa-solid fa-xmark" style={{ width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                            </button>
                        </div>

                        {/* Progress Stepper Line */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.25rem' }}>
                            <div style={{ flex: 1, height: '4px', background: 'var(--color-primary)', borderRadius: '2px' }} />
                            <div style={{ flex: 1, height: '4px', background: wizardStep >= 2 ? 'var(--color-primary)' : 'var(--bg-elevated)', borderRadius: '2px', transition: 'all 0.25s' }} />
                            <div style={{ flex: 1, height: '4px', background: wizardStep >= 3 ? 'var(--color-primary)' : 'var(--bg-elevated)', borderRadius: '2px', transition: 'all 0.25s' }} />
                        </div>

                        {error && (
                            <div style={{
                                padding: '0.85rem', background: 'var(--color-danger-bg)',
                                color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.25)',
                                borderRadius: '12px', marginBottom: '1.75rem', fontSize: '0.85rem',
                                display: 'flex', alignItems: 'center', gap: '0.6rem'
                            }}>
                                <i className="fa-solid fa-circle-exclamation" /> {error}
                            </div>
                        )}

                        {successMsg && (
                            <div style={{
                                padding: '0.85rem', background: 'var(--color-success-bg)',
                                color: 'var(--color-success)', border: '1px solid rgba(16, 185, 129, 0.25)',
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
                                    <h4 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span className={styles['step-number']}>1</span> Admin Account
                                    </h4>
                                    
                                    <div className="input-group">
                                        <label style={{ color: 'var(--color-primary)', fontSize: '0.7rem', fontWeight: 800 }}>Admin Full Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Richard Hendricks" 
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            autoFocus
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label style={{ color: 'var(--color-primary)', fontSize: '0.7rem', fontWeight: 800 }}>Corporate Email Address</label>
                                        <input 
                                            type="email" 
                                            placeholder="richard@hooli.com" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Business Configuration */}
                            {wizardStep === 2 && (
                                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <h4 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span className={styles['step-number']}>2</span> Venue Settings
                                    </h4>
                                    
                                    <div className="input-group">
                                        <label style={{ color: 'var(--color-primary)', fontSize: '0.7rem', fontWeight: 800 }}>Company Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Hooli Medical Care" 
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            required
                                            autoFocus
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label style={{ color: 'var(--color-primary)', fontSize: '0.7rem', fontWeight: 800 }}>Primary Industry Sector</label>
                                        <select 
                                            value={industryCategory} 
                                            onChange={(e) => setIndustryCategory(e.target.value)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <option value="medical">Medical OPD Clinic</option>
                                            <option value="e-sevai">Aadhaar E-Sevai Center</option>
                                            <option value="salon">Salon & Counter Kiosk</option>
                                            <option value="dining">Restaurant Dining Queue</option>
                                            <option value="transport">Transit Ticket Lobby</option>
                                            <option value="automobile">PUC Vehicle Lane</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: HSN/SAC Invoicing Billing Drawer */}
                            {wizardStep === 3 && (
                                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <h4 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span className={styles['step-number']}>3</span> Localized Indian Invoice
                                    </h4>

                                    <div style={{
                                        padding: '1.25rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
                                        borderRadius: '16px', fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--text-primary)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                                            <strong>SkipQ SaaS Receipt</strong>
                                            <span style={{ color: 'var(--color-success)', fontWeight: 800 }}><i className="fa-solid fa-square-check" /> Verified</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <span>Base MRR Rate:</span>
                                            <span>₹{selectedPackage === 'starter' ? '1,694.07' : '4,236.44'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <span>CGST (9.0%):</span>
                                            <span>₹{selectedPackage === 'starter' ? '152.46' : '381.28'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                                            <span>SGST (9.0%):</span>
                                            <span>₹{selectedPackage === 'starter' ? '152.47' : '381.28'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 800 }}>
                                            <span>Net Price:</span>
                                            <span style={{ color: 'var(--color-primary)' }}>₹{selectedPackage === 'starter' ? '1,999.00' : '4,999.00'}</span>
                                        </div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: '0.75rem', textAlign: 'center' }}>
                                            SAC Code: 998311 (Queue Administrative Tech)
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label style={{ color: 'var(--color-primary)', fontSize: '0.7rem', fontWeight: 800 }}>Test Credit Card Number</label>
                                        <input 
                                            type="text" 
                                            placeholder="4111 2222 3333 4444" 
                                            maxLength={19}
                                            value={cardNumber}
                                            onChange={(e) => setCardNumber(e.target.value)}
                                            required
                                            autoFocus
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div className="input-group" style={{ flex: 1 }}>
                                            <label style={{ color: 'var(--color-primary)', fontSize: '0.7rem', fontWeight: 800 }}>Expiry</label>
                                            <input 
                                                type="text" 
                                                placeholder="MM/YY" 
                                                maxLength={5}
                                                value={cardExpiry}
                                                onChange={(e) => setCardExpiry(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="input-group" style={{ flex: 1 }}>
                                            <label style={{ color: 'var(--color-primary)', fontSize: '0.7rem', fontWeight: 800 }}>CVV</label>
                                            <input 
                                                type="password" 
                                                placeholder="123" 
                                                maxLength={3}
                                                value={cardCvv}
                                                onChange={(e) => setCardCvv(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Wizard navigation bar */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '2rem' }}>
                                {wizardStep > 1 ? (
                                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setWizardStep(prev => prev - 1)}>
                                        <i className="fa-solid fa-arrow-left" /> Back
                                    </button>
                                ) : (
                                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={cancelWizard}>
                                        Cancel
                                    </button>
                                )}
                                
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                                    {submitting ? (
                                        <span>Pinging Server...</span>
                                    ) : wizardStep < 3 ? (
                                        <span>Next Step <i className="fa-solid fa-arrow-right" /></span>
                                    ) : (
                                        <span>Create Account <i className="fa-solid fa-circle-check" /></span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Copy link toast status log */}
            <div className={`toast ${toastVisible ? 'visible' : ''}`} role="status" aria-live="polite" style={{
                position: 'fixed', left: '50%', bottom: '24px', transform: toastVisible ? 'translate(-50%, 0)' : 'translate(-50%, 16px)',
                padding: '12px 20px', borderRadius: '14px', background: 'var(--text-primary)', color: 'var(--bg-surface)',
                fontWeight: 700, opacity: toastVisible ? 1 : 0, pointerEvents: 'none', transition: 'all 180ms ease', zIndex: 1100,
                display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-lg)'
            }}>
                <i className="fas fa-check-circle" style={{ color: 'var(--color-success)' }} />
                <span>{toastMsg}</span>
            </div>

            {/* Premium Light-mode Footer */}
            <footer className={styles.footer}>
                <div className={styles['footer-inner']}>
                    <div className={styles['footer-brand']}>
                        <span className="brand-mark" style={{ width: '28px', height: '28px', fontSize: '0.8rem', borderRadius: '6px' }}>SQ</span>
                        <strong style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>SkipQ</strong>
                    </div>
                    <p>© 2026 SkipQ. Reimagining crowded public waiting rooms with Google Cloud AI.</p>
                    <button className={styles['footer-btn-top']} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        Back to Top <i className="fas fa-arrow-up"></i>
                    </button>
                </div>
            </footer>
        </div>
    );
}

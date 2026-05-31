import Link from 'next/link';
import styles from './blog.module.css';

export const metadata = {
    title: 'Building SKIP for APAC Builders',
    description: 'The builder story behind SKIP, a local queue management project being prepared for Google AI powered guidance.',
};

const features = [
    {
        icon: 'fa-qrcode',
        title: 'QR-first entry',
        text: 'People can join a branch queue from a poster, counter display, or shared link without installing an app.',
    },
    {
        icon: 'fa-tower-broadcast',
        title: 'Live token updates',
        text: 'Customers see their current token state while operators move the queue from a real-time dashboard.',
    },
    {
        icon: 'fa-chart-simple',
        title: 'Operational visibility',
        text: 'Branch teams can inspect service volume, completion rates, no-shows, and hourly demand patterns.',
    },
];

const googlePlan = [
    'Use Gemini to explain queue status in plain local-language-friendly text.',
    'Generate arrival guidance from live token position, average service time, and branch context.',
    'Summarize daily queue pressure for staff so they can adjust desks and service planning.',
];

export default function BuilderBlogPage() {
    return (
        <main className={styles.page}>
            <nav className={styles.nav}>
                <Link href="/" className={styles.brand}>
                    <span className={styles.brandMark}>SQ</span>
                    <span>SKIP</span>
                </Link>
                <div className={styles.navLinks}>
                    <Link href="/join">Join Queue</Link>
                    <Link href="/dashboard">Dashboard</Link>
                </div>
            </nav>

            <section className={styles.hero}>
                <div className={styles.heroCopy}>
                    <div className={styles.badge}>
                        <span className="live-dot" />
                        APAC Builder Blog Draft
                    </div>
                    <h1>Building SKIP to make waiting lines less painful for local services</h1>
                    <p>
                        SKIP is a digital queue companion for clinics, college offices,
                        banks, public counters, and small service centers where waiting
                        still costs people time, attention, and daily income.
                    </p>
                    <div className={styles.heroActions}>
                        <Link href="/join" className="btn btn-primary">
                            <i className="fas fa-ticket" /> Try Queue Flow
                        </Link>
                        <Link href="/qr" className="btn btn-secondary">
                            <i className="fas fa-qrcode" /> View QR Setup
                        </Link>
                    </div>
                </div>

                <div className={styles.visual} aria-label="SKIP queue product preview">
                    <div className={styles.phone}>
                        <div className={styles.phoneTop}>
                            <span />
                            <strong>Token 18</strong>
                        </div>
                        <div className={styles.tokenNumber}>18</div>
                        <div className={styles.statusPill}>Please wait for your turn</div>
                        <div className={styles.queueRows}>
                            <span>Now serving</span>
                            <strong>14</strong>
                            <span>Your position</span>
                            <strong>4</strong>
                            <span>Estimated wait</span>
                            <strong>20m</strong>
                        </div>
                    </div>
                    <div className={styles.panel}>
                        <div className={styles.panelHeader}>
                            <span>Live Queue</span>
                            <i className="fas fa-satellite-dish" />
                        </div>
                        {[14, 15, 16, 17, 18].map((token, index) => (
                            <div className={styles.queueItem} key={token}>
                                <span className={index === 0 ? styles.activeDot : styles.dot} />
                                <span>Token {token}</span>
                                <small>{index === 0 ? 'serving' : 'waiting'}</small>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <article className={styles.article}>
                <section className={styles.section}>
                    <p className={styles.kicker}>The Problem</p>
                    <h2>In many local services, the line is still the interface.</h2>
                    <p>
                        A hospital visit, certificate counter, admission office, repair
                        desk, or bank branch can turn into a half-day wait because people
                        do not know how long the queue is, when they should arrive, or
                        whether their turn has already passed. The problem is not only
                        inconvenience. It affects workers, students, caregivers, senior
                        citizens, and anyone who cannot afford to stand around all day.
                    </p>
                </section>

                <section className={styles.featureGrid}>
                    {features.map((feature) => (
                        <div className={styles.featureCard} key={feature.title}>
                            <i className={`fas ${feature.icon}`} />
                            <h3>{feature.title}</h3>
                            <p>{feature.text}</p>
                        </div>
                    ))}
                </section>

                <section className={styles.section}>
                    <p className={styles.kicker}>The Build</p>
                    <h2>A working queue system first, then intelligence on top.</h2>
                    <p>
                        The current SKIP prototype focuses on making the queue itself
                        visible and manageable. A customer scans a QR code, chooses a
                        service, enters their name and phone number, and receives a live
                        token page. Staff can call the next token, handle no-shows,
                        manage desks, and see demand patterns from the dashboard.
                    </p>
                    <p>
                        This gives the project a practical foundation before adding
                        Google AI. Instead of using AI as decoration, the goal is to use
                        Gemini where language, explanation, and decision support can
                        reduce confusion for both customers and staff.
                    </p>
                </section>

                <section className={styles.googleBox}>
                    <div>
                        <p className={styles.kicker}>Google AI Conversion Plan</p>
                        <h2>Where Gemini will make SKIP stronger</h2>
                    </div>
                    <ul>
                        {googlePlan.map((item) => (
                            <li key={item}>
                                <i className="fas fa-check" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className={styles.section}>
                    <p className={styles.kicker}>Why It Matters</p>
                    <h2>The best queue is not a faster line. It is a clearer day.</h2>
                    <p>
                        SKIP is built for local places that may not have the budget or
                        staff capacity for complex enterprise systems. The project keeps
                        the customer experience simple: scan, join, track, arrive. For
                        teams, it creates enough structure to understand demand and serve
                        people with less crowding at the counter.
                    </p>
                </section>

                <footer className={styles.cta}>
                    <div>
                        <h2>Next step: connect SKIP with Google AI.</h2>
                        <p>
                            The blog is live as a draft. The next project step is to add
                            a Gemini-powered queue assistant and staff insight endpoint.
                        </p>
                    </div>
                    <Link href="/" className="btn btn-secondary">
                        <i className="fas fa-arrow-left" /> Back to SKIP
                    </Link>
                </footer>
            </article>
        </main>
    );
}

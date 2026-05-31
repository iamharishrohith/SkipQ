'use client';

import styles from './dashboard.module.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/dashboard') return pathname === '/dashboard';
        return pathname?.startsWith(path);
    };

    const NavLink = ({ href, icon, label }: { href: string; icon: string; label: string }) => (
        <Link
            href={href}
            className={`${styles['sidebar-link']} ${isActive(href) ? styles.active : ''}`}
        >
            <i className={`fas ${icon}`} />
            {label}
        </Link>
    );

    return (
        <div className={styles['sidebar-layout']}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles['sidebar-logo']}>
                    <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h2>SkipQ</h2>
                    </Link>
                </div>

                <div className={styles['sidebar-section']}>
                    <div className={styles['sidebar-section-label']}>Queue</div>
                    <NavLink href="/dashboard" icon="fa-th-large" label="Overview" />
                    <NavLink href="/dashboard/queue" icon="fa-users-line" label="Live Queue" />
                </div>

                <div className={styles['sidebar-section']}>
                    <div className={styles['sidebar-section-label']}>Manage</div>
                    <NavLink href="/dashboard/services" icon="fa-concierge-bell" label="Services" />
                    <NavLink href="/dashboard/desks" icon="fa-desktop" label="Desks" />
                    <NavLink href="/dashboard/team" icon="fa-user-group" label="Team" />
                    <NavLink href="/dashboard/support" icon="fa-circle-question" label="Help Desk" />
                </div>

                <div className={styles['sidebar-section']}>
                    <div className={styles['sidebar-section-label']}>Insights</div>
                    <NavLink href="/dashboard/analytics" icon="fa-chart-line" label="Analytics" />
                    <NavLink href="/dashboard/history" icon="fa-clock-rotate-left" label="History" />
                </div>

                <div className={styles['sidebar-footer']}>
                    <NavLink href="/dashboard/settings" icon="fa-gear" label="Settings" />
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles['dashboard-main']}>
                {children}
            </main>
        </div>
    );
}

import type { Metadata } from 'next';
// Force rebuild: 1
import './globals.css';

export const metadata: Metadata = {
    title: 'SkipQ — Smart Queue Management',
    description: 'Eliminate waiting lines with real-time digital queue management. Book tokens, track your position, and get notified when it\'s your turn.',
    keywords: ['queue management', 'digital queue', 'token system', 'skip the line', 'waitlist'],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" data-theme="light" suppressHydrationWarning>
            <head>
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#7c3aed" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                />
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
                />
            </head>
            <body>{children}</body>
        </html>
    );
}

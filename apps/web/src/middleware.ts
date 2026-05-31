// ========================================
// SkipQ v2 — Next.js Middleware (Route Protection)
// ========================================
// Currently DISABLED — auth cookies are not being set by the backend.
// All routes are accessible without authentication for local/LAN demo.
// To re-enable, uncomment the auth checks below.

import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
    // All requests pass through for now
    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/login', '/signup'],
};

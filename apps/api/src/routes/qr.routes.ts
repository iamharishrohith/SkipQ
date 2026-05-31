// ========================================
// SkipQ v2 — QR Code Generation Routes
// ========================================
// Generates QR codes for queue join links.

import { Elysia, t } from 'elysia';

const QR_API = 'https://api.qrserver.com/v1/create-qr-code';

export const qrRoutes = new Elysia({ prefix: '/api/qr' })

    /**
     * Generate a QR code image URL for a given branch.
     * The QR code encodes the public join link: /join/{branchId}
     */
    .get('/branch/:branchId', ({ params, request }) => {
        const host = new URL(request.url).origin.replace(':3001', ':3000'); // Frontend URL
        const joinUrl = `${host}/join/${params.branchId}`;

        // Use the free QR API (no API key needed)
        const qrUrl = `${QR_API}?size=300x300&color=7c3aed&format=png&data=${encodeURIComponent(joinUrl)}`;

        return {
            success: true,
            data: {
                joinUrl,
                qrImageUrl: qrUrl,
                branchId: params.branchId,
            },
        };
    }, {
        params: t.Object({ branchId: t.String() }),
    })

    /**
     * Generate a QR code for a specific service.
     */
    .get('/service/:serviceId', ({ params, request }) => {
        const host = new URL(request.url).origin.replace(':3001', ':3000');
        const joinUrl = `${host}/join/service/${params.serviceId}`;

        const qrUrl = `${QR_API}?size=300x300&color=7c3aed&format=png&data=${encodeURIComponent(joinUrl)}`;

        return {
            success: true,
            data: {
                joinUrl,
                qrImageUrl: qrUrl,
                serviceId: params.serviceId,
            },
        };
    }, {
        params: t.Object({ serviceId: t.String() }),
    });

function getCategoryServices(category?: string) {
    const list = [
        { name: 'General OPD Consultation', category: 'medical', description: 'Consult with on-duty general practitioners', estimatedDurationMin: 15, maxTokens: 100, price: 0 },
        { name: 'Diagnostic & Lab Tests', category: 'medical', description: 'Blood samples, X-Ray, and diagnostic checkups', estimatedDurationMin: 10, maxTokens: 80, price: 150 },
        { name: 'Pharmacy Dispatch', category: 'medical', description: 'Express counter for prescription medicine collection', estimatedDurationMin: 5, maxTokens: 150, price: 0 },
        { name: 'VIP Specialist Consultation', category: 'medical', description: 'Fast-track slot for specialist and critical visits', estimatedDurationMin: 20, maxTokens: 25, price: 300 },
        
        { name: 'Aadhaar & PAN Enrolment', category: 'e-sevai', description: 'New updates, biometric registration, and PAN corrections', estimatedDurationMin: 20, maxTokens: 60, price: 100 },
        { name: 'Certificates & Land Records', category: 'e-sevai', description: 'Income, community, nativity certificates and Patta entries', estimatedDurationMin: 15, maxTokens: 80, price: 50 },
        { name: 'Utility Payments & Bills', category: 'e-sevai', description: 'Electricity, water, and government municipal taxes payments', estimatedDurationMin: 5, maxTokens: 200, price: 0 },
        { name: 'Fast-Track Token Desk', category: 'e-sevai', description: 'Priority lane for senior citizens and quick document submission', estimatedDurationMin: 8, maxTokens: 50, price: 150 },

        { name: 'Haircut & Styling', category: 'salon', description: 'Standard haircut, hair spa, and custom styling', estimatedDurationMin: 30, maxTokens: 30, price: 200 },
        { name: 'Grooming & Shaving', category: 'salon', description: 'Beard trim, shave, facial massage, and detailing', estimatedDurationMin: 20, maxTokens: 40, price: 100 },
        { name: 'Premium Spa & Therapy', category: 'salon', description: 'Deep tissue therapy, hair coloring, and advanced facial work', estimatedDurationMin: 60, maxTokens: 15, price: 500 },
        { name: 'VIP Express Grooming', category: 'salon', description: 'No-wait premium grooming with master stylist', estimatedDurationMin: 25, maxTokens: 10, price: 700 },

        { name: 'Standard Table Booking', category: 'dining', description: 'General restaurant dining table seating allocations', estimatedDurationMin: 45, maxTokens: 50, price: 100 },
        { name: 'Takeaway & Parcel Counter', category: 'dining', description: 'Express pickup for online and counter takeaway orders', estimatedDurationMin: 10, maxTokens: 120, price: 0 },
        { name: 'Live Food Counters', category: 'dining', description: 'Quick token lane for live starters and fast food counters', estimatedDurationMin: 5, maxTokens: 200, price: 0 },
        { name: 'VIP Lounge Dining', category: 'dining', description: 'Fast-pass priority table booking for corporate events and VIPs', estimatedDurationMin: 60, maxTokens: 10, price: 300 },

        { name: 'Physical Ticket Booking', category: 'transport', description: 'General ticketing lines for train, bus, and flight bookings', estimatedDurationMin: 8, maxTokens: 300, price: 0 },
        { name: 'Smartcard & Recharge Help', category: 'transport', description: 'Recharges, physical smartcard issues, and card blockings', estimatedDurationMin: 5, maxTokens: 150, price: 0 },
        { name: 'Baggage Drop & Inquiries', category: 'transport', description: 'Fast-track luggage check-in and transit inquiries helpdesk', estimatedDurationMin: 12, maxTokens: 100, price: 100 },
        { name: 'VIP Fast-Track Boarding', category: 'transport', description: 'Priority lane assistance for executive passengers', estimatedDurationMin: 4, maxTokens: 40, price: 250 },

        { name: 'Regular Vehicle Servicing', category: 'automobile', description: 'Scheduled preventive bike/car services and checklist reviews', estimatedDurationMin: 15, maxTokens: 40, price: 400 },
        { name: 'Quick Foam Wash & Polish', category: 'automobile', description: 'Pressure foam wash, vacuuming, and dashboard polish', estimatedDurationMin: 20, maxTokens: 50, price: 150 },
        { name: 'Emissions & Fitness Testing', category: 'automobile', description: 'Fast-track PUC emissions checking and fitment testing', estimatedDurationMin: 8, maxTokens: 100, price: 80 },
        { name: 'VIP Quick Repair Counter', category: 'automobile', description: 'Emergency quick-fix lane for towing and instant repairs', estimatedDurationMin: 30, maxTokens: 15, price: 500 }
    ];

    if (!category) return [{ name: 'General Queue', description: 'Baseline customer inquiry service lane', estimatedDurationMin: 10, maxTokens: 200, price: 0 }, { name: 'VIP Priority', description: 'Fast-pass priority queue', estimatedDurationMin: 5, maxTokens: 50, price: 99 }];
    const filtered = list.filter(item => item.category === category);
    return filtered.length > 0 ? filtered.map(({ category, ...rest }) => rest) : [{ name: 'General Queue', description: 'Baseline customer service lane', estimatedDurationMin: 10, maxTokens: 200, price: 0 }, { name: 'VIP Priority', description: 'Fast-pass priority queue', estimatedDurationMin: 5, maxTokens: 50, price: 99 }];
}

export const billingRoutes = new Elysia({ prefix: '/api/billing' })

    // --- 1. Get Subscription Packages ---
    .get('/packages', () => {
        try {
            const packages = db.getAll('packages');
            return { success: true, data: packages };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    })

    // --- 2. Buy Package & Auto-Provision Client Organization ---
    .post('/buy-package', ({ body }) => {
        try {
            // Check if user already exists
            const existingUser = db.findOne('user', { email: body.email });
            if (existingUser) {
                return { success: false, error: 'Account with this email already exists.' };
            }

            // Create client admin user account
            const user = db.insert('user', {
                name: body.name || body.companyName.split(' ')[0] + ' Admin',
                email: body.email,
                role: 'admin',
                emailVerified: true,
                image: null,
                passwordHash: 'SEEDED_PASSWORD_MOCK'
            });

            // Create organization
            const slug = body.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const org = db.insert('organizations', {
                name: body.companyName,
                slug,
                packageId: body.packageId,
                billingStatus: 'active',
                industryCategory: body.industryCategory || 'custom',
                monthlyPrice: body.packageId === 'starter' ? 1999 : body.packageId === 'pro' ? 4999 : 12999,
                createdAt: new Date().toISOString()
            });

            // Associate user to org as administrator
            db.insert('orgMembers', {
                orgId: org.id,
                userId: user.id,
                role: 'admin'
            });

            // AUTO-PROVISIONING: Create baseline branch
            const branch = db.insert('branches', {
                orgId: org.id,
                organizationId: org.id, // backwards compatibility
                name: 'Main Branch',
                address: 'HQ Venue Counter, City Center',
                isActive: true
            });

            // AUTO-PROVISIONING: Create baseline queue services based on industry category
            const servicesToCreate = getCategoryServices(body.industryCategory);
            for (const svc of servicesToCreate) {
                db.insert('services', {
                    branchId: branch.id,
                    name: svc.name,
                    description: svc.description,
                    estimatedDurationMin: svc.estimatedDurationMin,
                    maxTokens: svc.maxTokens,
                    price: svc.price || 0,
                    allowPriorityFastPass: true,
                    fastPassPrice: svc.price > 0 ? Math.round(svc.price * 0.6) || 99 : 99,
                    isActive: true
                });
            }

            // Compact snapshot to persist newly provisioned structures
            compact();

            return {
                success: true,
                message: 'Onboarding complete! Branch and base queues auto-provisioned successfully.',
                data: {
                    user: { id: user.id, name: user.name, email: user.email, role: user.role },
                    org: { id: org.id, name: org.name, slug: org.slug, packageId: org.packageId }
                }
            };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        body: t.Object({
            email: t.String(),
            name: t.String(),
            companyName: t.String(),
            packageId: t.String(),
            cardNumber: t.String(),
            industryCategory: t.Optional(t.String())
        })
    })

    // --- 3. Request New Desk Counter (Paid Level Assign) ---
    .post('/request-desk', ({ body }) => {
        try {
            const service = db.findById('services', body.serviceId);
            if (!service) return { success: false, error: 'Service queue not found.' };

            // Client creates a counter desk request with PENDING status
            const desk = db.insert('desks', {
                serviceId: body.serviceId,
                name: body.deskName,
                isActive: false, // offline until approved
                approvalStatus: 'pending',
                tier: body.tier,
                requestDetails: body.requestDetails || '',
                paymentValidated: true,
                assignedOperatorId: null
            });

            compact();

            return {
                success: true,
                message: 'Counter station expansion request submitted successfully. Awaiting super-admin manual service mapping.',
                data: desk
            };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        body: t.Object({
            serviceId: t.String(),
            deskName: t.String(),
            tier: t.Union([t.Literal('normal'), t.Literal('vip'), t.Literal('priority')]),
            requestDetails: t.Optional(t.String())
        })
    })

    // --- 4. Raise Support Ticket ---
    .post('/support-ticket', ({ body }) => {
        try {
            const ticket = db.insert('supportTickets', {
                orgId: body.orgId,
                orgName: body.orgName,
                subject: body.subject,
                description: body.description,
                status: 'open',
                createdAt: new Date().toISOString()
            });

            compact();

            return { success: true, data: ticket };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        body: t.Object({
            orgId: t.String(),
            orgName: t.String(),
            subject: t.String(),
            description: t.String()
        })
    })

    // --- 5. Fetch Support Tickets ---
    .get('/support-tickets', () => {
        try {
            const tickets = db.getAll('supportTickets');
            return { success: true, data: tickets };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    })

    // --- 6. Submit Customer Post-Service Rating Review ---
    .post('/feedback', ({ body }) => {
        try {
            const feedback = db.insert('feedbacks', {
                tokenId: body.tokenId,
                tokenNumber: body.tokenNumber,
                operatorName: body.operatorName,
                serviceId: body.serviceId,
                rating: body.rating,
                comments: body.comments || '',
                createdAt: new Date().toISOString()
            });

            // Update associated token to log feedback complete status
            db.update('tokens', { id: body.tokenId }, { status: 'completed' });

            compact();

            return { success: true, message: 'Thank you for your rating!', data: feedback };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        body: t.Object({
            tokenId: t.String(),
            tokenNumber: t.Number(),
            operatorName: t.String(),
            serviceId: t.String(),
            rating: t.Number(),
            comments: t.Optional(t.String())
        })
    })

    // --- 7. Get Customer Feedbacks ---
    .get('/feedbacks', () => {
        try {
            const list = db.getAll('feedbacks');
            return { success: true, data: list.reverse() };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    })

    // --- 8. Super-Admin Update Package Prices & Features ---
    .post('/update-packages', ({ body }) => {
        try {
            db.remove('packages', {}); // Clear old configurations
            
            for (const pkg of body.packages) {
                db.insert('packages', pkg);
            }

            compact();

            return { success: true, message: 'Subscription packages configurations updated!' };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        body: t.Object({
            packages: t.Array(t.Object({
                id: t.String(),
                name: t.String(),
                monthlyPrice: t.Number(),
                maxBranches: t.Number(),
                maxDesks: t.Number(),
                features: t.Array(t.String())
            }))
        })
    })

    // --- 9. Get Localized Spot Offers by Category ---
    .get('/spot-offers/:category', ({ params }) => {
        try {
            const list = db.find('spotOffers', { category: params.category });
            return { success: true, data: list };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    })

    // --- 10. Buy Waiting Room Spot Offer ---
    .post('/buy-spot-offer', ({ body }) => {
        try {
            const token = db.findOne('tokens', { id: body.tokenId });
            if (!token) return { success: false, error: 'Token not found.' };

            const service = db.findOne('services', { id: token.serviceId });
            const branch = service ? db.findOne('branches', { id: service.branchId }) : null;

            const transaction = db.insert('upiTransactions', {
                tokenId: body.tokenId,
                orgId: branch?.orgId || 'unknown',
                amount: body.amount,
                purpose: 'spot_offer',
                status: 'success',
                createdAt: new Date().toISOString()
            });

            db.insert('auditLogs', {
                type: 'spot_offer_purchase',
                message: `Customer with Token #${token.tokenNumber} purchased Spot Offer deal '${body.offerTitle}' for ₹${body.amount} via simulated UPI.`,
                details: { tokenId: token.id, orgId: branch?.orgId, offerTitle: body.offerTitle, amount: body.amount }
            });

            compact();

            return { success: true, message: 'Deal purchased successfully!', data: transaction };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        body: t.Object({
            tokenId: t.String(),
            amount: t.Number(),
            offerTitle: t.String()
        })
    })

    // --- 11. Customer VIP Fast-Pass Line Skipping Upgrade ---
    .post('/upgrade-fastpass', async ({ body }) => {
        try {
            const token = db.findOne('tokens', { id: body.tokenId });
            if (!token) return { success: false, error: 'Token not found.' };

            const service = db.findOne('services', { id: token.serviceId });
            const branch = service ? db.findOne('branches', { id: service.branchId }) : null;

            // Update token in db
            db.update('tokens', { id: body.tokenId }, {
                isFastPass: true,
                paymentStatus: 'paid',
                amountPaid: body.amount
            });

            // Insert payment ledger entry
            const transaction = db.insert('upiTransactions', {
                tokenId: body.tokenId,
                orgId: branch?.orgId || 'unknown',
                amount: body.amount,
                purpose: 'fast_pass',
                status: 'success',
                createdAt: new Date().toISOString()
            });

            // Promote token in redis sorted set to the front of queue
            const queueRedis = await import('../redis/queue.redis');
            await queueRedis.promoteToFrontOfQueue(token.serviceId, token.id);

            // Audit log
            db.insert('auditLogs', {
                type: 'vip_fast_pass_upgrade',
                message: `Token #${token.tokenNumber} upgraded to VIP Fast-Pass queue line. UPI transaction of ₹${body.amount} validated.`,
                details: { tokenId: token.id, orgId: branch?.orgId, amount: body.amount }
            });

            // Publish WebSocket event to notify operator screen immediately
            const pubsub = await import('../redis/pubsub');
            await pubsub.publishQueueEvent(token.serviceId, 'QUEUE_UPDATED', {
                action: 'fastpass_upgrade',
                tokenId: token.id
            });

            compact();

            return { success: true, message: 'Fast-Pass upgrade successful! You have skipped the queue.', data: transaction };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, {
        body: t.Object({
            tokenId: t.String(),
            amount: t.Number()
        })
    })

    // --- 12. Get UPI Transaction History (for super-admin panel) ---
    .get('/transactions', () => {
        try {
            const transactions = db.getAll('upiTransactions');
            const result = transactions.map(t => {
                const token = db.findOne('tokens', { id: t.tokenId });
                const org = db.findOne('organizations', { id: t.orgId });
                return {
                    ...t,
                    tokenNumber: token?.tokenNumber || '—',
                    orgName: org?.name || 'Unknown Client'
                };
            });
            return { success: true, data: result.reverse() };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    });

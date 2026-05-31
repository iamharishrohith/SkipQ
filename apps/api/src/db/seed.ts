// ========================================
// SkipQ v2 — Seed Data (JSON Store)
// ========================================
// Run: bun run src/db/seed.ts

import * as store from './store';

console.log('🌱 Seeding database...');

// --- Demo Organization ---
const org = store.insert('organizations', {
    name: 'Demo Hospital',
    slug: 'demo-hospital',
    plan: 'pro',
});
console.log(`  ✅ Org: ${org.name} (${org.id})`);

// --- Branch ---
const branch = store.insert('branches', {
    orgId: org.id,
    name: 'Main Branch',
    address: '123 Healthcare Ave, Medical City',
    operatingHours: { start: '08:00', end: '18:00' },
    isActive: true,
});
console.log(`  ✅ Branch: ${branch.name} (${branch.id})`);

// --- Services ---
const generalService = store.insert('services', {
    branchId: branch.id,
    name: 'General',
    description: 'General consultation queue',
    estimatedDurationMin: 15,
    maxTokens: 100,
    deskType: 'free',
    tokenPrice: '0',
    isActive: true,
});
console.log(`  ✅ Service: ${generalService.name} (${generalService.id})`);

const vipService = store.insert('services', {
    branchId: branch.id,
    name: 'VIP',
    description: 'Priority VIP queue with dedicated desk',
    estimatedDurationMin: 20,
    maxTokens: 50,
    deskType: 'vip',
    tokenPrice: '500',
    isActive: true,
});
console.log(`  ✅ Service: ${vipService.name} (${vipService.id})`);

// --- Desks ---
const desk1 = store.insert('desks', {
    serviceId: generalService.id,
    name: 'Desk 1',
    isActive: true,
    assignedOperatorId: null,
});

const desk2 = store.insert('desks', {
    serviceId: generalService.id,
    name: 'Desk 2',
    isActive: true,
    assignedOperatorId: null,
});

const vipDesk = store.insert('desks', {
    serviceId: vipService.id,
    name: 'VIP Desk',
    isActive: true,
    assignedOperatorId: null,
});
console.log(`  ✅ Desks: ${desk1.name}, ${desk2.name}, ${vipDesk.name}`);

console.log('');
console.log('🎉 Seed complete! IDs for testing:');
console.log(`  orgId:     ${org.id}`);
console.log(`  branchId:  ${branch.id}`);
console.log(`  serviceId: ${generalService.id} (General)`);
console.log(`  serviceId: ${vipService.id} (VIP)`);
console.log('');

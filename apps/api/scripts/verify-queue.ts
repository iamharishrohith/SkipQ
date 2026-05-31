
import { db } from '../src/db';
import * as queueService from '../src/services/queue.service';
import * as queueRedis from '../src/redis/queue.redis';

async function main() {
    console.log('--- Starting Queue Verification ---');

    const serviceId = 'srv-test-1';
    const userId1 = 'user-test-1';
    const userId2 = 'user-test-2';

    // 0. Reset State
    console.log('0. Resetting queue...');
    await queueRedis.resetQueue(serviceId);

    // Ensure service exists in DB
    const existingService = db.findById('services', serviceId);
    if (!existingService) {
        db.insert('services', {
            id: serviceId,
            name: 'Test Service',
            branchId: 'br-test',
            isActive: true,
            maxTokens: 100
        });
    }

    // 1. Book First Token (Should be Active immediately)
    console.log('1. Booking token #1...');
    const booking1 = await queueService.bookToken(serviceId, userId1);
    console.log('   Booked #1:', booking1);

    const state1 = await queueService.getQueueState(serviceId);
    console.log('   State #1:', state1);

    if (state1.currentlyServing !== booking1.tokenNumber) throw new Error('Token #1 should be active immediately');
    if (state1.totalWaiting !== 0) throw new Error('Queue should be empty (0 waiting)');


    // 2. Book Second Token (Should be Waiting)
    console.log('2. Booking token #2...');
    const booking2 = await queueService.bookToken(serviceId, userId2);
    console.log('   Booked #2:', booking2);

    const state2 = await queueService.getQueueState(serviceId);
    console.log('   State #2:', state2);

    if (state2.currentlyServing !== booking1.tokenNumber) throw new Error('Token #1 should still be active');
    if (state2.totalWaiting !== 1) throw new Error('Should have 1 waiting (Token #2)');


    // 3. Call Next (Complete #1, Active #2)
    console.log('3. Calling next...');
    const callResult = await queueService.callNextToken(serviceId);
    console.log('   Call Result:', callResult);

    if (callResult.completed !== booking1.tokenId) throw new Error('Should have completed Token #1');
    if (callResult.promoted !== booking2.tokenId) throw new Error('Should have promoted Token #2');

    // 4. Verify Active #2
    const state3 = await queueService.getQueueState(serviceId);
    console.log('4. Active State #2:', state3);

    if (state3.currentlyServing !== booking2.tokenNumber) throw new Error('Should be serving Token #2');
    if (state3.totalWaiting !== 0) throw new Error('Queue should be empty');

    // 5. Complete #2
    console.log('5. Completing #2...');
    await queueService.completeCurrentToken(serviceId);

    const stateEnd = await queueService.getQueueState(serviceId);
    console.log('6. End State:', stateEnd);

    if (stateEnd.currentlyServing !== null) throw new Error('Should be serving null');

    console.log('--- VERIFICATION SUCCESS ---');
}

main().catch(err => {
    console.error('--- VERIFICATION FAILED ---');
    console.error(err);
    process.exit(1);
});

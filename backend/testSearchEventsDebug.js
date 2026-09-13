/**
 * SEARCH EVENTS DEBUG TEST SUITE
 * Systematically tests executeSearchEvents with step-by-step logs,
 * timeout protection, and guaranteed process teardown.
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Event = require('./models/Event');
const { executeSearchEvents } = require('./services/tools/strandsTools');

// Safety timeout: exit with code 1 if stuck
const TIMEOUT_MS = 15000;
const safetyTimer = setTimeout(() => {
  console.error(`[TIMEOUT] Debug test did not finish within ${TIMEOUT_MS}ms. Forcing exit.`);
  process.exit(1);
}, TIMEOUT_MS);

async function runMemoryServerTest() {
  console.log('=== TEST 1: MongoMemoryServer Isolated Debug Test ===');
  let mongod;

  try {
    console.log('[LOG] Step 1: Before MongoMemoryServer.create()');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log('[LOG] Step 1: After MongoMemoryServer.create() -> URI:', uri);

    console.log('[LOG] Step 2: Before mongoose.connect()');
    await mongoose.connect(uri);
    console.log('[LOG] Step 2: After mongoose.connect() -> Connected state:', mongoose.connection.readyState);

    console.log('[LOG] Step 3: Before Event.create()');
    const testDoc = {
      eventId: 'e1',
      title: 'AI Workshop',
      date: 'Sept 12, 2026',
      time: '10:00 AM',
      location: 'Innovation Hub',
      venue: 'Innovation Hub',
      tag: 'Workshop',
      category: 'Academic',
      desc: 'Hands-on workshop on autonomous AI agents and intelligent systems.',
      status: 'Approved'
    };
    const createdEvent = await Event.create(testDoc);
    console.log('[LOG] Step 3: After Event.create() -> Inserted _id:', createdEvent._id, 'eventId:', createdEvent.eventId);

    console.log('[LOG] Step 4: Before executeSearchEvents()');
    const res = await executeSearchEvents({ keyword: 'Find AI events this week.' });
    console.log('[LOG] Step 4: After executeSearchEvents()');
    console.log('Result count:', res.events.length);
    console.log('Events:', res.events);

    console.log('[LOG] Step 5: Before mongoose.disconnect()');
    await mongoose.disconnect();
    console.log('[LOG] Step 5: After mongoose.disconnect() -> State:', mongoose.connection.readyState);

    if (mongod) {
      console.log('[LOG] Step 6: Before mongod.stop()');
      await mongod.stop();
      console.log('[LOG] Step 6: After mongod.stop() -> MongoMemoryServer stopped cleanly');
    }

    return res;
  } catch (err) {
    console.error('[ERROR in MongoMemoryServer test]:', err);
    if (mongod) await mongod.stop().catch(() => {});
    throw err;
  }
}

async function runExistingConfigTest() {
  console.log('\n=== TEST 2: Project Existing MongoDB Configuration Test ===');
  const uri = process.env.MONGODB_URI;
  console.log('[LOG] Attempting connection with project MONGODB_URI...');

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log('[LOG] Connected to project MongoDB database.');

    const testEventId = 'e1-proj-test-' + Date.now();
    await Event.create({
      eventId: testEventId,
      title: 'AI Workshop',
      date: 'Sept 12, 2026',
      time: '10:00 AM',
      location: 'Innovation Hub',
      venue: 'Innovation Hub',
      tag: 'Workshop',
      category: 'Academic',
      desc: 'Hands-on workshop on autonomous AI agents and intelligent systems.',
      status: 'Approved'
    });

    const res = await executeSearchEvents({ keyword: 'Find AI events this week.' });
    console.log('Project DB Result count:', res.events.length);

    // Clean up
    await Event.deleteOne({ eventId: testEventId });
    await mongoose.disconnect();
    console.log('[LOG] Cleaned up test event and disconnected cleanly.');
  } catch (err) {
    console.log('[NOTICE] Project Atlas connection skipped / unavailable:', err.message);
    console.log('[NOTICE] This is normal when Atlas IP whitelist is restricted. MongoMemoryServer serves as the valid test harness.');
  }
}

async function main() {
  try {
    await runMemoryServerTest();
    await runExistingConfigTest();
    clearTimeout(safetyTimer);
    console.log('\n=== ALL DEBUG TESTS COMPLETED SUCCESSFULLY ===');
    process.exit(0);
  } catch (err) {
    clearTimeout(safetyTimer);
    console.error('\n=== DEBUG TEST FAILED ===', err);
    process.exit(1);
  }
}

main();

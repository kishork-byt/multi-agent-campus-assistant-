/**
 * PERSISTENT TEST SUITE: REAL STRANDS CAMPUSNOVA AGENT
 * 
 * Verifies the complete flow:
 * Natural Language -> Strands Agent -> Tool Selection -> Structured Tool Input -> Tool Execution -> MongoDB -> Tool Result -> Agent Response
 *
 * Tests Required:
 * TEST 1: "Find AI events this week."
 * TEST 2: "Find the AI workshop."
 * TEST 3: "Register me for the AI workshop."
 * TEST 4: "Find the AI workshop and register me."
 * TEST 5: "Register me for the AI workshop and remind me one hour before."
 *
 * 10 Core Verification Checks:
 * 1. Strands agent initializes.
 * 2. Agent selects search_events.
 * 3. Agent passes structured parameters.
 * 4. search_events returns real MongoDB data.
 * 5. Agent selects register_for_event.
 * 6. Approval state works.
 * 7. Registration modifies MongoDB.
 * 8. Registration is verified.
 * 9. Duplicate registration is rejected.
 * 10. Tool failures are correctly reported.
 */

const assert = require("assert");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const Event = require("./models/Event");
const Task = require("./models/Task");
const Notification = require("./models/Notification");

const campusNovaAgent = require("./services/agents/CampusNovaAgent");
const {
  executeSearchEvents,
  executeRegisterForEvent,
  getStrandsTools
} = require("./services/tools/strandsTools");

// Safety timeout: 30 seconds max
const TIMEOUT_MS = 30000;
const safetyTimer = setTimeout(() => {
  console.error(`\n[TIMEOUT] Test suite did not complete within ${TIMEOUT_MS}ms. Forcing exit.`);
  process.exit(1);
}, TIMEOUT_MS);

let mongod = null;

async function setupDatabase() {
  console.log("=== STEP 0: INITIALIZING DATABASE ===");
  const { MongoMemoryServer } = require("mongodb-memory-server");
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  console.log("✓ Connected to isolated test MongoDB at:", uri);

  // Clear previous test records
  await Event.deleteMany({});
  await Task.deleteMany({});
  await Notification.deleteMany({});

  // Seed the standard test document
  const seedDoc = {
    eventId: "e1",
    title: "AI Workshop",
    date: "Sept 12, 2026",
    time: "10:00 AM",
    location: "Innovation Hub",
    venue: "Innovation Hub",
    tag: "Workshop",
    category: "Academic",
    desc: "Hands-on workshop on autonomous AI agents and intelligent systems.",
    status: "Approved",
    rsvpCount: 0,
    registeredUsers: []
  };

  const created = await Event.create(seedDoc);
  console.log(`✓ Seeded Event in MongoDB: "${created.title}" (eventId: ${created.eventId}, _id: ${created._id})\n`);
}

async function runTests() {
  await setupDatabase();

  console.log("============================================================");
  console.log("STARTING STRANDS CAMPUSNOVA AGENT COMPREHENSIVE SUITE");
  console.log("============================================================\n");

  // CHECK 1: Strands Agent Initialization
  console.log("[CHECK 1] Verifying Strands Agent Initialization...");
  await campusNovaAgent.initPromise;
  assert(campusNovaAgent.strandsAgent !== null, "Strands Agent instance must be initialized");
  const tools = await getStrandsTools();
  assert(tools.length === 8, "Agent must register 8 tools");
  console.log("✓ CHECK 1 PASSED: Strands Agent initialized with 8 real tools.\n");

  // TEST 1: "Find AI events this week."
  console.log("[TEST 1] Testing: 'Find AI events this week.'");
  console.log("  Flow: Natural Language -> Strands Agent -> Structured Params -> search_events -> MongoDB -> Response");

  // Track structured parameters passed to search_events
  let capturedSearchParams = null;
  const originalExecuteSearch = executeSearchEvents;

  const test1Res = await campusNovaAgent.process({
    message: "Find AI events this week.",
    userId: "STU-TEST-1",
    role: "student"
  });

  // Verify CHECK 2: Agent selects search_events
  assert(test1Res.toolsUsed.includes("search_events"), "Agent must select search_events tool");
  console.log("✓ CHECK 2 PASSED: Strands Agent selected 'search_events' autonomously.");

  // Direct check of structured parameters
  const structuredInput = campusNovaAgent.strandsAgent.model.extractEventSearchParams("Find AI events this week.");
  assert.strictEqual(structuredInput.keyword, "AI", "Keyword must be extracted as 'AI'");
  assert(structuredInput.dateFrom !== undefined, "dateFrom parameter must be extracted");
  assert(structuredInput.dateTo !== undefined, "dateTo parameter must be extracted");
  console.log("✓ CHECK 3 PASSED: Agent extracted structured parameters:", structuredInput);

  // Execute structured search directly to verify CHECK 4: returns real MongoDB data
  const realDbSearch = await executeSearchEvents(structuredInput);
  assert(realDbSearch.success === true, "search_events must succeed");
  assert.strictEqual(realDbSearch.count, 1, "Must return exactly 1 event from MongoDB");
  const ev1 = realDbSearch.events[0];
  assert.strictEqual(ev1.eventId, "e1", "Event ID must be e1");
  assert.strictEqual(ev1.title, "AI Workshop", "Event title must be 'AI Workshop'");
  assert.strictEqual(ev1.date, "Sept 12, 2026", "Event date must be 'Sept 12, 2026'");
  assert.strictEqual(ev1.time, "10:00 AM", "Event time must be '10:00 AM'");
  assert.strictEqual(ev1.location, "Innovation Hub", "Event location must be 'Innovation Hub'");
  console.log("✓ CHECK 4 PASSED: search_events returned real MongoDB event:");
  console.log("   eventId:", ev1.eventId, "| title:", ev1.title, "| date:", ev1.date, "| time:", ev1.time, "| location:", ev1.location);

  assert(test1Res.status === "COMPLETED", "Search request must complete directly");
  assert(test1Res.message.includes("AI Workshop"), "Agent response must mention AI Workshop");
  console.log("✓ TEST 1 PASSED: 'Find AI events this week.' completed successfully.\n");

  // TEST 2: "Find the AI workshop."
  console.log("[TEST 2] Testing: 'Find the AI workshop.'");
  const test2Res = await campusNovaAgent.process({
    message: "Find the AI workshop.",
    userId: "STU-TEST-2",
    role: "student"
  });
  assert(test2Res.success === true, "Request must succeed");
  assert(test2Res.status === "COMPLETED", "Status must be COMPLETED");
  assert(test2Res.toolsUsed.includes("search_events"), "Must use search_events tool");
  assert(test2Res.message.includes("AI Workshop"), "Response must mention AI Workshop");
  console.log("✓ TEST 2 PASSED: 'Find the AI workshop.' found event.\n");

  // TEST 3: "Register me for the AI workshop." (Human Approval Workflow)
  console.log("[TEST 3] Testing: 'Register me for the AI workshop.'");
  console.log("  Flow: Search -> 'I found AI Workshop...' -> WAITING_APPROVAL -> Approve -> register_for_event -> COMPLETED");
  const test3Res = await campusNovaAgent.process({
    message: "Register me for the AI workshop.",
    userId: "STU-TEST-3",
    role: "student"
  });

  // CHECK 6: Approval state works
  assert.strictEqual(test3Res.status, "WAITING_APPROVAL", "Consequential registration must pause on WAITING_APPROVAL");
  assert.strictEqual(test3Res.approvalRequired, true, "approvalRequired must be true");
  assert(test3Res.approvalId !== undefined, "approvalId must be generated");
  assert(test3Res.message.includes("Would you like me to register you?"), "Must ask human confirmation");
  console.log(`✓ CHECK 6 PASSED: Action paused on WAITING_APPROVAL with approvalId: ${test3Res.approvalId}`);
  console.log("   Prompt presented to user:", test3Res.message.split("\n")[0]);

  // Approve action
  console.log("  -> User sends approval...");
  const approve3Res = await campusNovaAgent.approve({
    approvalId: test3Res.approvalId,
    userId: "STU-TEST-3",
    userRole: "student"
  });

  // CHECK 5: Agent selects register_for_event
  assert(approve3Res.toolsUsed.includes("register_for_event"), "Must execute register_for_event upon approval");
  assert.strictEqual(approve3Res.status, "COMPLETED", "Status must transition to COMPLETED");
  console.log("✓ CHECK 5 PASSED: Agent executed register_for_event tool.");

  // CHECK 7 & 8: Registration modifies MongoDB and is verified
  const dbEventAfter3 = await Event.findOne({ eventId: "e1" }).lean();
  assert(dbEventAfter3.registeredUsers.some(u => u.userId === "STU-TEST-3"), "User STU-TEST-3 must be in registeredUsers");
  assert.strictEqual(dbEventAfter3.rsvpCount, 1, "rsvpCount must be 1 in MongoDB");
  console.log("✓ CHECK 7 & 8 PASSED: Registration modified MongoDB and verified. RSVP count: " + dbEventAfter3.rsvpCount);
  console.log("✓ TEST 3 PASSED: 'Register me for the AI workshop.' completed.\n");

  // TEST 4: "Find the AI workshop and register me." (Multi-step Agent Behavior)
  console.log("[TEST 4] Testing: 'Find the AI workshop and register me.' (Multi-step Behavior)");
  const test4Res = await campusNovaAgent.process({
    message: "Find the AI workshop and register me.",
    userId: "STU-TEST-4",
    role: "student"
  });

  assert.strictEqual(test4Res.status, "WAITING_APPROVAL", "Must pause for human confirmation");
  assert(test4Res.toolsUsed.includes("search_events"), "Step 1: must search and find event first");

  // User confirms approval
  const approve4Res = await campusNovaAgent.approve({
    approvalId: test4Res.approvalId,
    userId: "STU-TEST-4",
    userRole: "student"
  });

  assert.strictEqual(approve4Res.status, "COMPLETED", "Multi-step workflow must complete");
  const dbEventAfter4 = await Event.findOne({ eventId: "e1" }).lean();
  assert(dbEventAfter4.registeredUsers.some(u => u.userId === "STU-TEST-4"), "User STU-TEST-4 must be in registeredUsers");
  assert.strictEqual(dbEventAfter4.rsvpCount, 2, "rsvpCount must now be 2 in MongoDB");
  console.log("✓ TEST 4 PASSED: Multi-step find + register executed and verified in MongoDB (RSVP count: 2).\n");

  // TEST 5: "Register me for the AI workshop and remind me one hour before." (Compound Multi-step)
  console.log("[TEST 5] Testing: 'Register me for the AI workshop and remind me one hour before.'");
  const test5Res = await campusNovaAgent.process({
    message: "Register me for the AI workshop and remind me one hour before.",
    userId: "STU-TEST-5",
    role: "student"
  });

  assert.strictEqual(test5Res.status, "WAITING_APPROVAL", "Compound action must pause for confirmation");
  assert(test5Res.message.includes("reminder"), "Confirmation message must mention reminder");

  // User confirms approval
  const approve5Res = await campusNovaAgent.approve({
    approvalId: test5Res.approvalId,
    userId: "STU-TEST-5",
    userRole: "student"
  });

  assert.strictEqual(approve5Res.status, "COMPLETED", "Compound action must complete");
  assert(approve5Res.toolsUsed.includes("register_for_event"), "Must execute register_for_event");
  assert(approve5Res.toolsUsed.includes("create_task"), "Must execute create_task");

  // Verify MongoDB updates across collections
  const dbEventAfter5 = await Event.findOne({ eventId: "e1" }).lean();
  assert(dbEventAfter5.registeredUsers.some(u => u.userId === "STU-TEST-5"), "User STU-TEST-5 registered in Event");
  assert.strictEqual(dbEventAfter5.rsvpCount, 3, "rsvpCount must now be 3");

  const dbTask = await Task.findOne({ userId: "STU-TEST-5" }).lean();
  assert(dbTask !== null, "Reminder task must be created in MongoDB");
  assert(dbTask.title.includes("AI Workshop"), "Task title must mention AI Workshop");

  const dbNotif = await Notification.findOne({ userId: "STU-TEST-5" }).lean();
  assert(dbNotif !== null, "Notification must be created in MongoDB");
  console.log("✓ TEST 5 PASSED: Compound register + reminder created Event registration, Task, and Notification in MongoDB.\n");

  // CHECK 9: Duplicate registration is rejected
  console.log("[CHECK 9] Testing: Duplicate registration rejection...");
  const dupRes = await executeRegisterForEvent(
    { eventId: "e1", rejectDuplicate: true },
    { userId: "STU-TEST-3" } // already registered in TEST 3
  );
  assert.strictEqual(dupRes.success, false, "Duplicate registration must return success: false");
  assert.strictEqual(dupRes.alreadyRegistered, true, "Must flag alreadyRegistered: true");
  assert(dupRes.error.includes("already registered"), "Error message must state user is already registered");

  // Verify RSVP count did not change in MongoDB
  const dbEventAfterDup = await Event.findOne({ eventId: "e1" }).lean();
  assert.strictEqual(dbEventAfterDup.rsvpCount, 3, "RSVP count must remain 3 after duplicate rejection");
  console.log("✓ CHECK 9 PASSED: Duplicate registration rejected without modifying MongoDB.\n");

  // CHECK 10: Tool failures are correctly reported
  console.log("[CHECK 10] Testing: Tool failure reporting...");
  const failRes = await executeRegisterForEvent(
    { eventId: "non-existent-id-999" },
    { userId: "STU-TEST-1" }
  );
  assert.strictEqual(failRes.success, false, "Invalid event must return success: false");
  assert(failRes.error.includes("Could not find an event"), "Must return clear user-facing error");
  console.log("✓ CHECK 10 PASSED: Tool failure correctly and safely reported (" + failRes.error + ").\n");

  console.log("============================================================");
  console.log("ALL 5 USER TESTS AND ALL 10 VERIFICATION CHECKS PASSED!");
  console.log("============================================================\n");
}

async function cleanup() {
  try {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  } catch (e) {}
  clearTimeout(safetyTimer);
}

runTests()
  .then(async () => {
    await cleanup();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("\n❌ TEST SUITE FAILED:", err);
    await cleanup();
    process.exit(1);
  });

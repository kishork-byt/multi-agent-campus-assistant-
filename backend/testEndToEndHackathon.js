/**
 * CAMPUSNOVA — COMPREHENSIVE END-TO-END HACKATHON TEST SUITE
 * 
 * Verifies:
 * 1. Agent chat integration & Strands Agent invocation
 * 2. search_events with structured parameters & MongoDB retrieval
 * 3. Consequential action human approval pausing (WAITING_APPROVAL)
 * 4. Approval execution & MongoDB modification verification
 * 5. Task creation & persistence in MongoDB
 * 6. Notification creation & persistence in MongoDB
 * 7. Support issue creation (SUP-XXXX) with department routing
 * 8. Conversation context (multi-turn resolution without repeating event ID)
 * 9. Role authorization guardrails (Student vs Admin permissions)
 * 10. Failure handling & duplicate prevention
 * 
 * PLUS: The Exact Complete Hackathon Final Workflow
 */

const assert = require("assert");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const Event = require("./models/Event");
const Task = require("./models/Task");
const Notification = require("./models/Notification");
const SupportIssue = require("./models/SupportIssue");
const AgentExecution = require("./models/AgentExecution");

const campusNovaAgent = require("./services/agents/CampusNovaAgent");
const autopilotService = require("./services/autopilot/autopilotService");
const {
  executeSearchEvents,
  executeRegisterForEvent,
  executeCreateTask,
  executeGetTasks,
  executeCreateNotification,
  executeCreateSupportIssue,
  executeGetSupportStatus,
  getStrandsTools
} = require("./services/tools/strandsTools");

let mongod = null;

// Safety timeout: 35 seconds
const TIMEOUT_MS = 35000;
const safetyTimer = setTimeout(() => {
  console.error(`\n[TIMEOUT] Test suite did not complete within ${TIMEOUT_MS}ms. Forcing exit.`);
  process.exit(1);
}, TIMEOUT_MS);

async function setupDatabase() {
  console.log("=== STEP 0: INITIALIZING TEST DATABASE ===");
  const { MongoMemoryServer } = require("mongodb-memory-server");
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  console.log("✓ Connected to isolated test MongoDB at:", uri);

  // Clear test collections
  await Event.deleteMany({});
  await Task.deleteMany({});
  await Notification.deleteMany({});
  await SupportIssue.deleteMany({});
  await AgentExecution.deleteMany({});

  // Seed standard event
  const seededEvent = await Event.create({
    eventId: "e1",
    title: "AI Workshop",
    date: "September 12, 2026",
    time: "10:00 AM",
    location: "Innovation Hub",
    venue: "Innovation Hub",
    tag: "Workshop",
    category: "Academic",
    desc: "Hands-on workshop on autonomous AI agents and intelligent campus systems.",
    status: "Approved",
    rsvpCount: 0,
    registeredUsers: []
  });

  console.log(`✓ Seeded Event: "${seededEvent.title}" on ${seededEvent.date} (${seededEvent.location})\n`);
}

async function runEndToEndTests() {
  await setupDatabase();

  console.log("============================================================");
  console.log("CAMPUSNOVA HACKATHON COMPREHENSIVE VERIFICATION");
  console.log("============================================================\n");

  const testUser = {
    userId: "STU-2026-894",
    role: "student",
    userName: "Alex Rivera",
    conversationId: "conv_student_STU-2026-894"
  };

  // ------------------------------------------------------------
  // TEST 1: Agent Chat & Strands Initialization
  // ------------------------------------------------------------
  console.log("[TEST 1] Verifying Strands Agent Initialization...");
  await campusNovaAgent.initPromise;
  assert(campusNovaAgent.strandsAgent !== null, "Strands Agent must be initialized");
  const tools = await getStrandsTools();
  assert.strictEqual(tools.length, 8, "Must have exactly 8 tools registered");
  console.log("✓ TEST 1 PASSED: Strands Agent initialized with 8 verified tools.\n");

  // ------------------------------------------------------------
  // TEST 2: search_events (Real MongoDB retrieval)
  // ------------------------------------------------------------
  console.log("[TEST 2] Testing 'Find AI events this week.'...");
  const searchRes = await campusNovaAgent.process({
    message: "Find AI events this week.",
    userId: testUser.userId,
    role: testUser.role,
    conversationId: testUser.conversationId
  });

  assert(searchRes.success === true, "Search request must succeed");
  assert.strictEqual(searchRes.status, "COMPLETED", "Search status must be COMPLETED");
  assert(searchRes.toolsUsed.includes("search_events"), "Must select search_events tool");
  assert(searchRes.cards.length >= 1, "Must return structured event card");
  assert.strictEqual(searchRes.cards[0].data.title, "AI Workshop", "Card must contain AI Workshop");
  assert(searchRes.message.includes("AI Workshop"), "Response must mention AI Workshop");
  console.log("✓ TEST 2 PASSED: Real MongoDB event search returned structured AI Workshop card.\n");

  // ------------------------------------------------------------
  // TEST 3: Consequential Action Approval Pausing (WAITING_APPROVAL)
  // ------------------------------------------------------------
  console.log("[TEST 3] Testing 'Register me for the AI workshop.' (Human Approval Pausing)...");
  const regPauseRes = await campusNovaAgent.process({
    message: "Register me for the AI workshop.",
    userId: testUser.userId,
    role: testUser.role,
    conversationId: testUser.conversationId
  });

  assert.strictEqual(regPauseRes.status, "WAITING_APPROVAL", "Consequential action must pause on WAITING_APPROVAL");
  assert.strictEqual(regPauseRes.approvalRequired, true, "approvalRequired must be true");
  assert(regPauseRes.approvalId !== undefined, "approvalId must be generated");
  assert(regPauseRes.message.includes("Would you like me to register you?"), "Must request confirmation");
  console.log(`✓ TEST 3 PASSED: Action paused on WAITING_APPROVAL with approvalId: ${regPauseRes.approvalId}.\n`);

  // ------------------------------------------------------------
  // TEST 4: Human Approval Execution & MongoDB Verification
  // ------------------------------------------------------------
  console.log("[TEST 4] Executing Approval via approve({ approvalId })...");
  const approvalRes = await campusNovaAgent.approve({
    approvalId: regPauseRes.approvalId,
    userId: testUser.userId,
    userRole: testUser.role
  });

  assert.strictEqual(approvalRes.status, "COMPLETED", "Approved action must transition to COMPLETED");
  assert(approvalRes.toolsUsed.includes("register_for_event"), "Must execute register_for_event tool");

  // Verify in MongoDB
  const dbEvent = await Event.findOne({ eventId: "e1" }).lean();
  assert(dbEvent.registeredUsers.some(u => u.userId === testUser.userId), "User must exist in registeredUsers array");
  assert.strictEqual(dbEvent.rsvpCount, 1, "RSVP count must increment to 1");
  console.log("✓ TEST 4 PASSED: Registration verified in MongoDB. RSVP Count: " + dbEvent.rsvpCount + ".\n");

  // ------------------------------------------------------------
  // TEST 5: Duplicate Registration Prevention
  // ------------------------------------------------------------
  console.log("[TEST 5] Testing Duplicate Registration Prevention...");
  const dupAttempt = await executeRegisterForEvent({ eventId: "e1" }, testUser);
  assert(dupAttempt.success === true, "Idempotent response must succeed");
  assert(dupAttempt.alreadyRegistered === true, "Must flag user is already registered");

  const dbCheck = await Event.findOne({ eventId: "e1" }).lean();
  assert.strictEqual(dbCheck.rsvpCount, 1, "RSVP count must remain 1 without duplicate addition");
  console.log("✓ TEST 5 PASSED: Duplicate registration safely prevented.\n");

  // ------------------------------------------------------------
  // TEST 6: Multi-Turn Context: 'Remind me one hour before.'
  // ------------------------------------------------------------
  console.log("[TEST 6] Testing Multi-turn Context: 'Remind me one hour before.'...");
  const remindRes = await campusNovaAgent.process({
    message: "Remind me one hour before.",
    userId: testUser.userId,
    role: testUser.role,
    conversationId: testUser.conversationId
  });

  assert(remindRes.success === true, "Reminder request must succeed");
  assert.strictEqual(remindRes.status, "COMPLETED", "Must complete reminder creation");
  assert(remindRes.toolsUsed.includes("create_task"), "Must select create_task tool");
  assert(remindRes.cards.length >= 1, "Must return structured task card");
  assert(remindRes.cards[0].data.title.includes("AI Workshop"), "Task title must contextually resolve to AI Workshop");

  // Verify Task record in MongoDB
  const dbTask = await Task.findOne({ userId: testUser.userId }).sort({ createdAt: -1 }).lean();
  assert(dbTask !== null, "Task record must exist in MongoDB");
  assert(dbTask.title.includes("AI Workshop"), "Task title must match event context");
  assert.strictEqual(dbTask.reminderTime, "1 hour before", "Reminder time must be '1 hour before'");
  console.log(`✓ TEST 6 PASSED: Task created and verified in MongoDB (ID: ${dbTask._id}, Reminder: ${dbTask.reminderTime}).\n`);

  // ------------------------------------------------------------
  // TEST 7: Notification Creation & Scoping
  // ------------------------------------------------------------
  console.log("[TEST 7] Verifying Notification Persistence...");
  const dbNotif = await Notification.findOne({ userId: testUser.userId }).sort({ createdAt: -1 }).lean();
  assert(dbNotif !== null, "Notification must exist in MongoDB");
  assert(dbNotif.userId === testUser.userId, "Notification must be user-scoped");
  console.log(`✓ TEST 7 PASSED: Notification persisted in MongoDB ("${dbNotif.title}").\n`);

  // ------------------------------------------------------------
  // TEST 8: Support Workflow: 'The projector in Lab 3 is not working.'
  // ------------------------------------------------------------
  console.log("[TEST 8] Testing 'The projector in Lab 3 is not working.'...");
  const supportRes = await campusNovaAgent.process({
    message: "The projector in Lab 3 is not working.",
    userId: testUser.userId,
    role: testUser.role,
    conversationId: testUser.conversationId
  });

  assert(supportRes.success === true, "Support ticket creation must succeed");
  assert(supportRes.cards.length >= 1, "Must return structured support issue card");
  const issueCard = supportRes.cards[0].data;
  assert(/^SUP-\d+/i.test(issueCard.issueId), "Issue ID must follow SUP-XXXX format");
  assert.strictEqual(issueCard.department, "Facilities", "Department must be Facilities");
  assert.strictEqual(issueCard.status, "OPEN", "Status must be OPEN");

  // Verify in MongoDB
  const dbIssue = await SupportIssue.findOne({ issueId: issueCard.issueId }).lean();
  assert(dbIssue !== null, "Support issue must exist in MongoDB");
  assert.strictEqual(dbIssue.location, "Lab 3", "Location must be Lab 3");
  console.log(`✓ TEST 8 PASSED: Created and verified real support issue ${dbIssue.issueId} in MongoDB.\n`);

  // ------------------------------------------------------------
  // TEST 9: Role Authorization Guardrails
  // ------------------------------------------------------------
  console.log("[TEST 9] Testing Role Authorization Guardrails...");
  const studentUnauthorized = await campusNovaAgent.process({
    message: "Show me confidential faculty salary and budget data.",
    userId: "STU-2026-894",
    role: "student"
  });

  assert.strictEqual(studentUnauthorized.status, "FAILED", "Unauthorized student request must be blocked");
  assert(studentUnauthorized.message.includes("Authorization Notice"), "Must provide clear authorization error");
  console.log("✓ TEST 9 PASSED: Role security guardrails strictly blocked unauthorized student request.\n");

  // ------------------------------------------------------------
  // TEST 10: Autopilot Detection & Staged Approval
  // ------------------------------------------------------------
  console.log("[TEST 10] Testing CampusNova Autopilot Proactive Detection...");
  // Seed an unregistered hackathon
  await Event.create({
    eventId: "e2",
    title: "Strands Agents Campus Hackathon",
    date: "September 15, 2026",
    time: "09:00 AM",
    location: "Engineering Quad",
    status: "Approved",
    registeredUsers: []
  });

  const insights = await autopilotService.scanForProactiveTasks({
    userId: testUser.userId,
    role: testUser.role
  });

  assert(insights.length >= 1, "Autopilot must detect unregistered event");
  const topInsight = insights[0];
  assert(topInsight.actionRequired === true, "Insight must require action");
  assert(topInsight.approvalId !== undefined, "Insight must have staged approvalId");

  // Approve the autopilot suggestion
  const autoApprove = await campusNovaAgent.approve({
    approvalId: topInsight.approvalId,
    userId: testUser.userId,
    userRole: testUser.role
  });
  assert.strictEqual(autoApprove.status, "COMPLETED", "Autopilot action must execute upon human approval");

  const dbHackathon = await Event.findOne({ eventId: "e2" }).lean();
  assert(dbHackathon.registeredUsers.some(u => u.userId === testUser.userId), "User must be registered in MongoDB");
  console.log("✓ TEST 10 PASSED: Autopilot proactive detection & human approval executed and verified.\n");

  // ------------------------------------------------------------
  // EXACT COMPLETE FINAL WORKFLOW
  // ------------------------------------------------------------
  console.log("============================================================");
  console.log("EXECUTING EXACT FINAL HACKATHON DEMO WORKFLOW");
  console.log("============================================================");

  const wfUser = {
    userId: "STU-DEMO-FINAL",
    role: "student",
    userName: "Alex Rivera",
    conversationId: "conv_final_demo"
  };

  // Step 1: "Find AI events this week."
  console.log("\n[STEP 1] User: 'Find AI events this week.'");
  const step1 = await campusNovaAgent.process({
    message: "Find AI events this week.",
    ...wfUser
  });
  console.log("Agent:", step1.message.split("\n")[0]);
  assert(step1.toolsUsed.includes("search_events"));
  assert(step1.cards[0].data.title === "AI Workshop");

  // Step 2: "Register me for the AI workshop."
  console.log("\n[STEP 2] User: 'Register me for the AI workshop.'");
  const step2 = await campusNovaAgent.process({
    message: "Register me for the AI workshop.",
    ...wfUser
  });
  console.log("Agent:", step2.message.split("\n")[0]);
  assert.strictEqual(step2.status, "WAITING_APPROVAL");
  const finalApprId = step2.approvalId;

  // Step 3: Human Approval
  console.log("\n[STEP 3] Human Approval -> Approve Registration");
  const step3 = await campusNovaAgent.approve({
    approvalId: finalApprId,
    userId: wfUser.userId,
    userRole: wfUser.role
  });
  console.log("Agent:\n" + step3.message);
  assert.strictEqual(step3.status, "COMPLETED");

  // Step 4: "Remind me one hour before."
  console.log("\n[STEP 4] User: 'Remind me one hour before.'");
  const step4 = await campusNovaAgent.process({
    message: "Remind me one hour before.",
    ...wfUser
  });
  console.log("Agent:\n" + step4.message);
  assert(step4.message.includes("You're registered for the AI Workshop. I've also created your reminder."));

  // Step 5: "The projector in Lab 3 is not working."
  console.log("\n[STEP 5] User: 'The projector in Lab 3 is not working.'");
  const step5 = await campusNovaAgent.process({
    message: "The projector in Lab 3 is not working.",
    ...wfUser
  });
  console.log("Agent:\n" + step5.message);
  assert(step5.cards[0].data.issueId.startsWith("SUP-"));
  assert.strictEqual(step5.cards[0].data.department, "Facilities");
  assert.strictEqual(step5.cards[0].data.status, "OPEN");

  console.log("\n============================================================");
  console.log("ALL TESTS & EXACT FINAL HACKATHON WORKFLOW PASSED SUCCESSFULLY!");
  console.log("============================================================\n");

  clearTimeout(safetyTimer);
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
  process.exit(0);
}

runEndToEndTests().catch(async (err) => {
  console.error("\n[TEST ERROR]", err);
  clearTimeout(safetyTimer);
  try {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  } catch (e) {}
  process.exit(1);
});

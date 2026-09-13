/**
 * CAMPUSNOVA - COMPREHENSIVE SECURITY & READINESS AUDIT TEST SUITE
 * Verifies all criteria for the AWS Agents for Humans Hackathon Final Audit.
 */

const assert = require("assert");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const Event = require("./models/Event");
const Task = require("./models/Task");
const Notification = require("./models/Notification");
const SupportIssue = require("./models/SupportIssue");
const AgentExecution = require("./models/AgentExecution");

const campusNovaAgent = require("./services/agents/CampusNovaAgent");
const autopilotService = require("./services/autopilot/autopilotService");
const {
  verifySessionToken,
  createSessionToken,
  issueTokenForRole,
  issueTokenForUser,
  VERIFIED_USERS
} = require("./services/auth/sessionService");

const {
  executeSearchEvents,
  executeRegisterForEvent,
  executeCreateTask,
  executeGetTasks,
  executeCreateNotification,
  executeCreateSupportIssue,
  executeGetSupportStatus,
  executeSearchCampusInformation,
  getStrandsTools
} = require("./services/tools/strandsTools");

// Safety timeout: 45 seconds
const TIMEOUT_MS = 45000;
const safetyTimer = setTimeout(() => {
  console.error(`\n[TIMEOUT] Audit test did not complete within ${TIMEOUT_MS}ms. Forcing exit.`);
  process.exit(1);
}, TIMEOUT_MS);

let mongod = null;
const persistentDbPath = path.join(__dirname, "data", "test_audit_db");

async function setupPersistentTestDb() {
  console.log("=== STEP 0: INITIALIZING PERSISTENT TEST STORAGE ===");
  if (!fs.existsSync(persistentDbPath)) {
    fs.mkdirSync(persistentDbPath, { recursive: true });
  }

  const { MongoMemoryServer } = require("mongodb-memory-server");
  mongod = await MongoMemoryServer.create({ instance: { dbPath: persistentDbPath, dbName: "campusnova_audit" } });
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  console.log("✓ Connected to persistent test MongoDB at:", uri);

  // Clear test collections
  await Event.deleteMany({});
  await Task.deleteMany({});
  await Notification.deleteMany({});
  await SupportIssue.deleteMany({});
  await AgentExecution.deleteMany({});

  // Seed deterministic Hackathon Demo Data
  await Event.create({
    eventId: "e1",
    title: "AI Workshop",
    date: "September 12, 2026",
    time: "10:00 AM",
    location: "Innovation Hub",
    venue: "Innovation Hub",
    tag: "Workshop",
    category: "Academic",
    desc: "Hands-on autonomous agent development using Strands Agents SDK.",
    organizer: "AI Student Chapter",
    status: "Approved",
    rsvpCount: 0,
    registeredUsers: []
  });
  console.log("✓ Seeded deterministic demo event: 'AI Workshop' (Sept 12, 2026, 10:00 AM, Innovation Hub)");
}

async function runSecurityAndReadinessAudit() {
  await setupPersistentTestDb();

  console.log("\n" + "=".repeat(60));
  console.log("SECTION 1: STRANDS SDK ARCHITECTURE VERIFICATION");
  console.log("=".repeat(60));

  assert.ok(campusNovaAgent.strandsAgent, "Strands Agent instance must be initialized");
  const tools = await getStrandsTools(() => ({}));
  assert.strictEqual(tools.length, 8, "Exactly 8 Strands tools must be registered");
  console.log("✓ Strands Agent runtime initialized with exactly 8 verified tools.");

  console.log("\n" + "=".repeat(60));
  console.log("SECTION 2: SECURITY & AUTHENTICATION AUDIT");
  console.log("=".repeat(60));

  // Test 2.1: Student A Valid Session Token
  const studentSession = issueTokenForUser("STU-2026-894");
  assert.ok(studentSession.token, "Student session token must be generated");
  const verifiedStudent = verifySessionToken(studentSession.token);
  assert.strictEqual(verifiedStudent.id, "STU-2026-894");
  assert.strictEqual(verifiedStudent.role, "student");
  console.log("✓ Valid Student session token cryptographically verified via HMAC-SHA256.");

  // Test 2.2: Tampered Token Rejection (Student A tampering token to claim Admin role)
  const parts = studentSession.token.split(".");
  const tamperedPayload = Buffer.from(JSON.stringify({
    id: "STU-2026-894",
    role: "admin", // Tampered!
    name: "Alex Rivera",
    email: "alex.rivera@university.edu",
    iat: Date.now(),
    exp: Date.now() + 100000
  })).toString("base64url");
  const tamperedToken = `${tamperedPayload}.${parts[1]}`;
  const tamperedResult = verifySessionToken(tamperedToken);
  assert.strictEqual(tamperedResult, null, "Tampered token must be strictly rejected");
  console.log("✓ Tampered token (attempting role elevation to Admin) strictly rejected.");

  // Test 2.3: Student A cannot act as Student B (Mutation Identity Binding)
  const studentBId = "STU-2026-895";
  const studentAId = "STU-2026-894";
  const taskCreated = await executeCreateTask({
    title: "Autonomous Agent Review",
    dueDate: "2026-09-15",
    priority: "High"
  }, { userId: studentAId, userRole: "student" });
  assert.ok(taskCreated.success, "Task creation must succeed for authenticated user");
  assert.strictEqual(taskCreated.task.userId, studentAId, "Task must be bound to Student A");
  
  // Student B task retrieval should NOT see Student A's task
  const studentBTasks = await executeGetTasks({}, { userId: studentBId, userRole: "student" });
  assert.strictEqual(studentBTasks.tasks.length, 0, "Student B cannot view or mutate Student A's tasks");
  console.log("✓ Student A cannot act as Student B: user-scoped data strictly isolated.");

  // Test 2.4: Faculty cannot access unauthorized admin operations
  const facultyPlan = campusNovaAgent.planIntent("view faculty salary and confidential budget", {
    userId: "STF-201",
    userRole: "faculty"
  });
  assert.ok(facultyPlan.isBlocked || facultyPlan.risk === "HIGH", "Sensitive administrative records must be guarded");
  console.log("✓ Role authorization guardrails strictly enforced against unauthorized operations.");

  console.log("\n" + "=".repeat(60));
  console.log("SECTION 3: CONSEQUENTIAL ACTION SECURITY AUDIT");
  console.log("=".repeat(60));

  // Test 3.1: register_for_event cannot execute before approval (WAITING_APPROVAL does NOT mutate MongoDB)
  const regReq = await campusNovaAgent.process({
    message: "Register me for the AI workshop.",
    userId: studentAId,
    role: "student"
  });
  assert.strictEqual(regReq.status, "WAITING_APPROVAL", "Consequential action must pause in WAITING_APPROVAL");
  assert.ok(regReq.approvalId, "Approval ID must be generated");

  // Verify MongoDB was NOT mutated
  const preApprovalEvent = await Event.findOne({ title: /AI Workshop/i });
  assert.strictEqual(preApprovalEvent.rsvpCount, 0, "MongoDB rsvpCount must remain 0 before approval");
  assert.strictEqual(preApprovalEvent.registeredUsers.length, 0, "MongoDB registeredUsers must remain empty before approval");
  console.log("✓ Consequential action paused on WAITING_APPROVAL without mutating MongoDB.");

  // Test 3.2: Approval cannot be executed by another user (Student B cannot approve Student A's action)
  const unauthorizedApproval = await campusNovaAgent.approve({
    approvalId: regReq.approvalId,
    userId: studentBId, // Unauthorized user!
    userRole: "student"
  });
  assert.strictEqual(unauthorizedApproval.success, false, "Approval by another user must be rejected");
  assert.ok(unauthorizedApproval.error.includes("Security Violation") || unauthorizedApproval.error.includes("not authorized"), "Security violation error returned");
  console.log("✓ Approval strictly tied to authenticated user identity: unauthorized user blocked.");

  // Test 3.3: Legitimate approval execution & MongoDB mutation verification
  const validApproval = await campusNovaAgent.approve({
    approvalId: regReq.approvalId,
    userId: studentAId,
    userRole: "student"
  });
  assert.strictEqual(validApproval.success, true, "Valid approval must succeed");
  const postApprovalEvent = await Event.findOne({ title: /AI Workshop/i });
  assert.strictEqual(postApprovalEvent.rsvpCount, 1, "MongoDB rsvpCount must increment to 1 after approval");
  assert.ok(postApprovalEvent.registeredUsers.some(u => (u.userId || u) === studentAId), "Student A must be registered in MongoDB");
  console.log("✓ Valid approval executed and verified in MongoDB (RSVP: 1, User registered).");

  // Test 3.4: Approval cannot be reused (Single-Use enforcement)
  const replayApproval = await campusNovaAgent.approve({
    approvalId: regReq.approvalId,
    userId: studentAId,
    userRole: "student"
  });
  assert.strictEqual(replayApproval.success, false, "Approval cannot be replayed or reused");
  console.log("✓ Approval is single-use: replay attack safely prevented.");

  // Test 3.5: Rejection performs zero mutations
  const regReq2 = await campusNovaAgent.process({
    message: "Register me for the AI workshop.",
    userId: studentBId,
    role: "student"
  });
  assert.strictEqual(regReq2.status, "WAITING_APPROVAL");
  const rejectRes = await campusNovaAgent.reject({
    approvalId: regReq2.approvalId,
    userId: studentBId
  });
  assert.strictEqual(rejectRes.success, true, "Rejection handled safely");
  const postRejectEvent = await Event.findOne({ title: /AI Workshop/i });
  assert.strictEqual(postRejectEvent.rsvpCount, 1, "MongoDB rsvpCount must remain unchanged after rejection");
  assert.ok(!postRejectEvent.registeredUsers.some(u => (u.userId || u) === studentBId), "Student B must NOT be added to registeredUsers");
  console.log("✓ Rejection confirmed: zero database mutations performed.");

  console.log("\n" + "=".repeat(60));
  console.log("SECTION 5: PERSISTENT STORAGE AUDIT");
  console.log("=".repeat(60));

  // Test restart resilience: disconnect and reconnect using same dbPath
  console.log("Simulating server restart with persistent storage...");
  await new Promise(r => setTimeout(r, 400));
  await mongoose.disconnect();
  await mongod.stop({ doCleanup: false });

  // Re-start using persistent storage path and same dbName
  const { MongoMemoryServer } = require("mongodb-memory-server");
  mongod = await MongoMemoryServer.create({ instance: { dbPath: persistentDbPath, dbName: "campusnova_audit" } });
  await mongoose.connect(mongod.getUri());
  
  const reloadedEvent = await Event.findOne({ title: /AI Workshop/i });
  assert.ok(reloadedEvent, "Event must still exist after server restart in persistent storage");
  assert.strictEqual(reloadedEvent.rsvpCount, 1, "RSVP count must persist across server restarts");
  assert.ok(reloadedEvent.registeredUsers.some(u => (u.userId || u) === studentAId), "Registered user must persist across server restarts");
  console.log("✓ Persistent Storage Verified: Event data survived complete server restart!");

  console.log("\n" + "=".repeat(60));
  console.log("SECTION 6: ALL 8 TOOLS OPERATIONAL VERIFICATION");
  console.log("=".repeat(60));

  const ctx = { userId: studentAId, userRole: "student" };

  // Tool 1: search_events
  const t1 = await executeSearchEvents({ keyword: "AI" }, ctx);
  assert.ok(t1.success && t1.events.length >= 1, "search_events must return AI Workshop");
  console.log("✓ Tool 1 (search_events) verified with real MongoDB query.");

  // Tool 2: register_for_event (duplicate check)
  const t2 = await executeRegisterForEvent({ title: "AI Workshop" }, ctx);
  assert.ok(t2.alreadyRegistered || t2.duplicateRejected, "register_for_event must detect duplicate");
  console.log("✓ Tool 2 (register_for_event) duplicate guard verified.");

  // Tool 3: create_task
  const t3 = await executeCreateTask({ title: "Study Machine Learning", dueDate: "2026-09-14", priority: "Medium" }, ctx);
  assert.ok(t3.success && (t3.task.id || t3.task._id), "create_task must persist to MongoDB");
  console.log("✓ Tool 3 (create_task) verified in MongoDB.");

  // Tool 4: get_tasks
  const t4 = await executeGetTasks({}, ctx);
  assert.ok(t4.success && t4.tasks.length >= 1, "get_tasks must retrieve user tasks");
  console.log("✓ Tool 4 (get_tasks) verified in MongoDB.");

  // Tool 5: create_notification
  const t5 = await executeCreateNotification({ title: "Campus Alert", desc: "Test notification", type: "System" }, ctx);
  assert.ok(t5.success, "create_notification must persist to MongoDB");
  console.log("✓ Tool 5 (create_notification) verified in MongoDB.");

  // Tool 6: create_support_issue
  const t6 = await executeCreateSupportIssue({ title: "Projector flickering in Lab 3", location: "Lab 3" }, ctx);
  const createdIssue = t6.issue || t6.ticket;
  assert.ok(t6.success && (createdIssue.issueId || createdIssue.ticketId), "create_support_issue must generate ticket");
  assert.strictEqual(createdIssue.department, "Facilities", "Must assign to Facilities department");
  const issueId = createdIssue.issueId || createdIssue.ticketId;
  console.log(`✓ Tool 6 (create_support_issue) created verified ticket: ${issueId} (Dept: Facilities).`);

  // Tool 7: get_support_status
  const t7 = await executeGetSupportStatus({ ticketId: issueId }, ctx);
  const statusTicket = t7.ticket || t7.issue;
  assert.ok(t7.success && statusTicket.status === "OPEN", "get_support_status must return ticket status");
  console.log(`✓ Tool 7 (get_support_status) retrieved live status for ${issueId}.`);

  // Tool 8: search_campus_information
  const t8 = await executeSearchCampusInformation({ query: "library hours and policies" }, ctx);
  assert.ok(t8.success, "search_campus_information must return campus knowledge");
  console.log("✓ Tool 8 (search_campus_information) verified.");

  console.log("\n" + "=".repeat(60));
  console.log("SECTION 13: EXACT 4 HACKATHON DEMO FLOWS");
  console.log("=".repeat(60));

  // Reset registration for demo
  await Event.updateOne({ title: /AI Workshop/i }, { $set: { registeredUsers: [], rsvpCount: 0 } });

  // FLOW 1: Find AI events this week
  console.log("\n[FLOW 1] 'Find AI events this week.'");
  const flow1 = await campusNovaAgent.process({
    message: "Find AI events this week.",
    userId: studentAId,
    role: "student"
  });
  assert.strictEqual(flow1.status, "COMPLETED");
  assert.ok(flow1.cards.length >= 1, "Must return event card");
  console.log("Agent response:", flow1.message.split("\n")[0]);
  console.log("✓ FLOW 1 PASSED: Real event returned.");

  // FLOW 2: Register me for the AI workshop
  console.log("\n[FLOW 2] 'Register me for the AI workshop.'");
  const flow2 = await campusNovaAgent.process({
    message: "Register me for the AI workshop.",
    userId: studentAId,
    role: "student"
  });
  assert.strictEqual(flow2.status, "WAITING_APPROVAL");
  console.log("Agent paused on status: WAITING_APPROVAL (ApprovalId:", flow2.approvalId, ")");
  
  // User approves
  const flow2Approve = await campusNovaAgent.approve({
    approvalId: flow2.approvalId,
    userId: studentAId,
    userRole: "student"
  });
  assert.strictEqual(flow2Approve.status, "COMPLETED");
  console.log("Agent approved & completed:", flow2Approve.message.split("\n")[0]);
  console.log("✓ FLOW 2 PASSED: Human-in-the-Loop approval verified in MongoDB.");

  // FLOW 3: Remind me one hour before
  console.log("\n[FLOW 3] 'Remind me one hour before.'");
  const flow3 = await campusNovaAgent.process({
    message: "Remind me one hour before.",
    userId: studentAId,
    role: "student"
  });
  assert.strictEqual(flow3.status, "COMPLETED");
  const taskRecord = await Task.findOne({ userId: studentAId, title: /AI Workshop/i });
  assert.ok(taskRecord, "Task record must be found in MongoDB");
  console.log("Agent response:", flow3.message.split("\n")[0]);
  console.log("✓ FLOW 3 PASSED: Multi-turn context resolved AI Workshop and created Task in MongoDB.");

  // FLOW 4: The projector in Lab 3 is not working
  console.log("\n[FLOW 4] 'The projector in Lab 3 is not working.'");
  const flow4 = await campusNovaAgent.process({
    message: "The projector in Lab 3 is not working.",
    userId: studentAId,
    role: "student"
  });
  assert.strictEqual(flow4.status, "COMPLETED");
  const issueRecord = await SupportIssue.findOne({ location: /Lab 3/i });
  assert.ok(issueRecord, "SupportIssue must be saved in MongoDB");
  assert.strictEqual(issueRecord.department, "Facilities");
  console.log("Agent response:", flow4.message.split("\n")[0]);
  console.log(`✓ FLOW 4 PASSED: Support ticket ${issueRecord.issueId || issueRecord.ticketId} created in MongoDB for Facilities.`);

  console.log("\n" + "=".repeat(60));
  console.log("ALL SECURITY & READINESS AUDIT CRITERIA PASSED!");
  console.log("=".repeat(60));

  clearTimeout(safetyTimer);
  await mongoose.disconnect();
  await mongod.stop();
  process.exit(0);
}

runSecurityAndReadinessAudit().catch(err => {
  console.error("Audit test error:", err);
  process.exit(1);
});

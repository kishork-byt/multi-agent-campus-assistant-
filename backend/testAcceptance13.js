/**
 * CAMPUSNOVA — 13 MANDATORY ACCEPTANCE TESTS SUITE
 * Directly validates all 13 exact user queries against the live backend
 * using the real Strands CampusNova Agent, Dijkstra Routing Engine,
 * MongoDB Persistence, and Multilingual Language Engine.
 */

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const campusNovaAgent = require("./services/agents/CampusNovaAgent");
const autopilotService = require("./services/autopilot/autopilotService");
const Event = require("./models/Event");
const Task = require("./models/Task");
const SupportIssue = require("./models/SupportIssue");
const Notification = require("./models/Notification");
const { issueTokenForUser } = require("./services/auth/sessionService");

let mongoServer;

async function setupDatabase() {
  console.log("\n================================================================================");
  console.log("            CAMPUSNOVA — 13 MANDATORY ACCEPTANCE TESTS SUITE                    ");
  console.log("================================================================================");

  const { MongoMemoryServer } = require("mongodb-memory-server");
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  console.log("Connected to in-memory test database:", uri);

  // Seed sample events
  await Event.deleteMany({});
  await Event.create([
    {
      eventId: "EVT-2026-001",
      title: "Quantum & Edge AI Summit 2026",
      date: "September 12, 2026",
      time: "10:00 AM - 4:00 PM",
      location: "Innovation Hub",
      category: "Technology",
      tag: "AI",
      desc: "Hands-on workshop and hackathon exploring Quantum computing and Edge AI architectures.",
      status: "Approved",
      capacity: 120,
      rsvpCount: 0,
      registeredUsers: []
    },
    {
      eventId: "EVT-2026-002",
      title: "Autonomous Robotics & Drone Championship",
      date: "September 15, 2026",
      time: "9:00 AM - 5:00 PM",
      location: "Academic Block A",
      category: "Robotics",
      tag: "Robotics",
      desc: "National robotics exhibition and drone racing arena.",
      status: "Approved",
      capacity: 80,
      rsvpCount: 0,
      registeredUsers: []
    }
  ]);

  await Task.deleteMany({});
  await SupportIssue.deleteMany({});
  await Notification.deleteMany({});
  console.log("Database initialized with seed events and clean collections.\n");
}

async function runAcceptanceTests() {
  await setupDatabase();

  const conversationId = `conv_accept_${Date.now()}`;
  const userId = "STU-2026-894";
  const userRole = "student";
  const sessionToken = issueTokenForUser(userId);

  const context = {
    userId,
    userRole,
    conversationId,
    token: sessionToken,
    history: []
  };

  let passedCount = 0;
  let savedApprovalId = null;

  function recordPass(testNum, testName, details) {
    passedCount++;
    console.log(`[PASS] Test ${testNum}: ${testName}`);
    if (details) console.log(`       ↳ ${details}`);
  }

  function recordFail(testNum, testName, error) {
    console.error(`[FAIL] Test ${testNum}: ${testName}`);
    console.error(`       ↳ Error: ${error}`);
    process.exitCode = 1;
  }

  // -------------------------------------------------------------------------
  // TEST 1: "Find AI events this week."
  // -------------------------------------------------------------------------
  try {
    const q1 = "Find AI events this week.";
    console.log(`\n▶ Query 1: "${q1}"`);
    const res1 = await campusNovaAgent.execute(q1, context);

    if (res1.success && res1.cards && res1.cards.length > 0 && res1.message.includes("AI")) {
      recordPass(1, "Find AI events this week", `Found ${res1.cards.length} event(s): ${res1.cards[0].data?.title}`);
    } else {
      throw new Error(`Unexpected response: ${JSON.stringify(res1)}`);
    }
  } catch (err) {
    recordFail(1, "Find AI events this week", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 2: "Register me for the AI workshop."
  // -------------------------------------------------------------------------
  try {
    const q2 = "Register me for the AI workshop.";
    console.log(`\n▶ Query 2: "${q2}"`);
    const res2 = await campusNovaAgent.execute(q2, context);

    if (res2.status === "WAITING_APPROVAL" && res2.approvalRequired && res2.approvalId) {
      savedApprovalId = res2.approvalId;
      // Verify zero DB mutation prior to approval
      const ev = await Event.findOne({ title: /AI/i });
      if (ev && ev.rsvpCount === 0 && ev.registeredUsers.length === 0) {
        recordPass(2, "Register me for the AI workshop", `Approval requested: ${savedApprovalId} (0 DB mutations pre-approval)`);
      } else {
        throw new Error("Premature DB mutation occurred before approval!");
      }
    } else {
      throw new Error(`Expected WAITING_APPROVAL, got: ${res2.status}`);
    }
  } catch (err) {
    recordFail(2, "Register me for the AI workshop", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 3: "Approve registration."
  // -------------------------------------------------------------------------
  try {
    console.log(`\n▶ Step 3: Approve registration with approvalId: ${savedApprovalId}`);
    const res3 = await campusNovaAgent.approve({
      approvalId: savedApprovalId,
      userId,
      userRole
    });

    if (res3.success && res3.status === "COMPLETED") {
      // Verify real MongoDB mutation
      const ev = await Event.findOne({ title: /AI/i });
      const isUserInReg = ev && ev.registeredUsers.some(u => (typeof u === 'string' ? u === userId : u.userId === userId));
      if (ev && ev.rsvpCount >= 1 && isUserInReg) {
        recordPass(3, "Approve registration", `Verified in MongoDB: rsvpCount=${ev.rsvpCount}, user registered`);
      } else {
        throw new Error("MongoDB event record was not properly updated!");
      }
    } else {
      throw new Error(`Approval failed: ${JSON.stringify(res3)}`);
    }
  } catch (err) {
    recordFail(3, "Approve registration", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 4: "Remind me one hour before."
  // -------------------------------------------------------------------------
  try {
    const q4 = "Remind me one hour before.";
    console.log(`\n▶ Query 4: "${q4}"`);
    const res4 = await campusNovaAgent.execute(q4, context);

    // Verify task creation in MongoDB
    const createdTask = await Task.findOne({ userId });
    if (res4.success && createdTask && createdTask.reminderTime === "1 hour before") {
      recordPass(4, "Remind me one hour before", `Task created in DB: "${createdTask.title}" (${createdTask.reminderTime})`);
    } else {
      throw new Error(`Task creation verification failed. Response: ${JSON.stringify(res4)}`);
    }
  } catch (err) {
    recordFail(4, "Remind me one hour before", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 5: "Where is the library?"
  // -------------------------------------------------------------------------
  try {
    const q5 = "Where is the library?";
    console.log(`\n▶ Query 5: "${q5}"`);
    const res5 = await campusNovaAgent.execute(q5, context);

    const hasLibCard = res5.cards && res5.cards.some(c => c.data?.id === "loc-lib-01");
    if (res5.success && (res5.message.includes("Library") || res5.message.includes("Academic Block C")) && hasLibCard) {
      recordPass(5, "Where is the library?", `Resolved Central Library in Academic Block C with map card`);
    } else {
      throw new Error(`Location lookup failed: ${JSON.stringify(res5)}`);
    }
  } catch (err) {
    recordFail(5, "Where is the library?", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 6: "How do I get there?"
  // -------------------------------------------------------------------------
  try {
    const q6 = "How do I get there?";
    console.log(`\n▶ Query 6: "${q6}"`);
    const res6 = await campusNovaAgent.execute(q6, context);

    const routeCard = res6.cards && res6.cards.find(c => c.type === "map_route");
    if (res6.success && routeCard && routeCard.data?.to?.id === "loc-lib-01") {
      recordPass(6, "How do I get there?", `Resolved 'there' -> Library. Route distance: ${routeCard.data.distanceMeters}m (${routeCard.data.walkingMinutes} mins)`);
    } else {
      throw new Error(`Route resolution failed: ${JSON.stringify(res6)}`);
    }
  } catch (err) {
    recordFail(6, "How do I get there?", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 7: "Library ku epdi poganum?"
  // -------------------------------------------------------------------------
  try {
    const q7 = "Library ku epdi poganum?";
    console.log(`\n▶ Query 7: "${q7}"`);
    const res7 = await campusNovaAgent.execute(q7, context);

    const routeCard = res7.cards && res7.cards.find(c => c.type === "map_route");
    if (res7.success && routeCard && routeCard.data?.to?.id === "loc-lib-01" && (res7.message.includes("route") || res7.message.includes("Distance") || res7.message.includes("தூரம்"))) {
      recordPass(7, "Library ku epdi poganum? (Tanglish)", `Tanglish navigation resolved to Library route (${routeCard.data.distanceMeters}m)`);
    } else {
      throw new Error(`Tanglish navigation failed: ${JSON.stringify(res7)}`);
    }
  } catch (err) {
    recordFail(7, "Library ku epdi poganum?", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 8: "இந்த வாரம் AI workshop இருக்கா?"
  // -------------------------------------------------------------------------
  try {
    const q8 = "இந்த வாரம் AI workshop இருக்கா?";
    console.log(`\n▶ Query 8: "${q8}"`);
    const res8 = await campusNovaAgent.execute(q8, context);

    if (res8.success && res8.cards && res8.cards.length > 0 && /[\u0B80-\u0BFF]/.test(res8.message)) {
      recordPass(8, "இந்த வாரம் AI workshop இருக்கா? (Tamil Script)", `Responded in Tamil with AI workshop details`);
    } else {
      throw new Error(`Tamil script response failed: ${JSON.stringify(res8)}`);
    }
  } catch (err) {
    recordFail(8, "இந்த வாரம் AI workshop இருக்கா?", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 9: "AI workshop kaha hai?"
  // -------------------------------------------------------------------------
  try {
    const q9 = "AI workshop kaha hai?";
    console.log(`\n▶ Query 9: "${q9}"`);
    const res9 = await campusNovaAgent.execute(q9, context);

    const hasLocation = res9.cards && res9.cards.some(c => c.data?.name?.includes("Innovation") || c.data?.building?.includes("Innovation"));
    if (res9.success && (res9.message.includes("Innovation Hub") || hasLocation)) {
      recordPass(9, "AI workshop kaha hai? (Hinglish)", `Resolved event venue Innovation Hub with location card`);
    } else {
      throw new Error(`Hinglish venue lookup failed: ${JSON.stringify(res9)}`);
    }
  } catch (err) {
    recordFail(9, "AI workshop kaha hai?", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 10: "The projector in Lab 3 is not working."
  // -------------------------------------------------------------------------
  try {
    const q10 = "The projector in Lab 3 is not working.";
    console.log(`\n▶ Query 10: "${q10}"`);
    const res10 = await campusNovaAgent.execute(q10, context);

    const createdIssue = await SupportIssue.findOne({ location: "Lab 3" });
    if (res10.success && createdIssue && (createdIssue.department === "Facilities" || createdIssue.assignedDepartment === "Facilities")) {
      recordPass(10, "The projector in Lab 3 is not working", `Auto-assigned to Facilities, Ticket: ${createdIssue.issueId}`);
    } else {
      throw new Error(`Support issue creation failed: ${JSON.stringify(res10)}`);
    }
  } catch (err) {
    recordFail(10, "The projector in Lab 3 is not working.", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 11: "Show my tasks."
  // -------------------------------------------------------------------------
  try {
    const q11 = "Show my tasks.";
    console.log(`\n▶ Query 11: "${q11}"`);
    const res11 = await campusNovaAgent.execute(q11, context);

    if (res11.success && res11.message.includes("pending task") && res11.cards && res11.cards.length > 0) {
      recordPass(11, "Show my tasks", `Retrieved ${res11.cards.length} task(s) from MongoDB`);
    } else {
      throw new Error(`Task lookup failed: ${JSON.stringify(res11)}`);
    }
  } catch (err) {
    recordFail(11, "Show my tasks.", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 12: "Run Autopilot Scan."
  // -------------------------------------------------------------------------
  try {
    console.log(`\n▶ Action 12: Run Autopilot Scan`);
    const autoRes = await autopilotService.runScan({ userId, role: userRole });

    if (Array.isArray(autoRes) && autoRes.length > 0) {
      recordPass(12, "Run Autopilot Scan", `Autopilot recommended ${autoRes.length} action(s): "${autoRes[0].title}"`);
    } else if (autoRes && autoRes.actionRecommendations && autoRes.actionRecommendations.length > 0) {
      recordPass(12, "Run Autopilot Scan", `Autopilot recommended ${autoRes.actionRecommendations.length} action(s)`);
    } else {
      throw new Error(`Autopilot scan failed: ${JSON.stringify(autoRes)}`);
    }
  } catch (err) {
    recordFail(12, "Run Autopilot Scan", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 13: "Main Gate la irundhu Library ku epdi poganum?"
  // -------------------------------------------------------------------------
  try {
    const q13 = "Main Gate la irundhu Library ku epdi poganum?";
    console.log(`\n▶ Query 13: "${q13}"`);
    const res13 = await campusNovaAgent.execute(q13, context);

    const routeCard = res13.cards && res13.cards.find(c => c.type === "map_route");
    if (res13.success && routeCard && routeCard.data?.from?.id === "loc-gate-01" && routeCard.data?.to?.id === "loc-lib-01") {
      recordPass(13, "Main Gate la irundhu Library ku epdi poganum? (Tanglish Source/Dest)", `Dijkstra: Main Gate -> Central Library (${routeCard.data.distanceMeters}m, ${routeCard.data.walkingMinutes} mins, ${routeCard.data.steps.length} turns)`);
    } else {
      throw new Error(`Tanglish source/dest routing failed: ${JSON.stringify(res13)}`);
    }
  } catch (err) {
    recordFail(13, "Main Gate la irundhu Library ku epdi poganum?", err.message);
  }

  console.log("\n================================================================================");
  if (passedCount === 13) {
    console.log(`🎉 ALL 13/13 MANDATORY ACCEPTANCE TESTS PASSED WITH 100% SUCCESS!`);
  } else {
    console.log(`⚠️ Completed with ${passedCount}/13 tests passed.`);
  }
  console.log("================================================================================\n");

  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
  process.exit(passedCount === 13 ? 0 : 1);
}

runAcceptanceTests().catch(err => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});

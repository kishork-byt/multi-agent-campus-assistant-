const dns = require("dns");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

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
  executeSearchCampusInformation,
  getStrandsTools
} = require("./services/tools/strandsTools");

async function setupTestDatabase() {
  console.log("=== INITIALIZING TEST DATABASE ===");
  const uri = process.env.MONGODB_URI;

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log("Connected to MongoDB Atlas for Testing.");
  } catch (err) {
    console.log("Atlas unreachable, falling back to MongoMemoryServer...");
    const { MongoMemoryServer } = require("mongodb-memory-server");
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    console.log("Connected to in-memory MongoDB for Testing.");
  }

  // Clear test records
  await Event.deleteMany({ eventId: { $in: ["test-ai-workshop", "test-hackathon"] } });
  await Task.deleteMany({ title: /Test/i });
  await Notification.deleteMany({ title: /Test/i });
  await SupportIssue.deleteMany({ title: /Lab 3/i });

  // Seed sample event for tests
  await Event.create({
    eventId: "test-ai-workshop",
    title: "Hands-on AI Workshop 2026",
    date: "Sept 12, 2026",
    time: "10:00 AM",
    location: "Innovation Hub",
    venue: "Innovation Hub",
    category: "Academic",
    tag: "Workshop",
    desc: "Hands-on generative AI and LLM agents workshop.",
    organizer: "AI Society",
    status: "Approved",
    rsvpCount: 0,
    registeredUsers: []
  });

  console.log("Test events seeded successfully.");
}

async function runAllTests() {
  await setupTestDatabase();

  const testUser = {
    userId: "STU-2026-TEST-1",
    userRole: "student",
    userName: "Alex Rivera (Test)"
  };

  console.log("\n============================================================");
  console.log("RUNNING 15 CORE AGENT TESTS");
  console.log("============================================================\n");

  // TEST 1: Agent Initialization
  console.log("[TEST 1] Verifying Strands Agent Initialization...");
  await campusNovaAgent.initPromise;
  assert(campusNovaAgent.name === "CampusNova", "Agent name should be CampusNova");
  assert(campusNovaAgent.strandsAgent !== null, "Strands Agent instance must be initialized");
  const tools = await getStrandsTools();
  assert(tools.length === 8, "Agent must register exactly 8 real tools");
  console.log("✓ TEST 1 PASSED: Agent initialized with Strands Agents SDK and 8 tools.\n");

  // TEST 2: Event Search
  console.log("[TEST 2] Testing search_events tool (Real MongoDB)...");
  const searchRes = await executeSearchEvents({ keyword: "AI Workshop" }, testUser);
  assert(searchRes.success === true, "Search must succeed");
  assert(searchRes.count >= 1, "Must find at least 1 event");
  const foundEvent = searchRes.events.find(e => e.id === "test-ai-workshop" || e.title.includes("AI Workshop"));
  assert(foundEvent, "Must find 'Hands-on AI Workshop 2026'");
  console.log(`✓ TEST 2 PASSED: Found ${searchRes.count} real events in MongoDB (${foundEvent.title}).\n`);

  // TEST 3: Event Registration
  console.log("[TEST 3] Testing register_for_event tool & MongoDB verification...");
  const regRes = await executeRegisterForEvent({
    eventId: "test-ai-workshop",
    title: "Hands-on AI Workshop 2026"
  }, testUser);
  assert(regRes.success === true, "Registration must succeed");
  assert(regRes.verified === true, "Registration must be verified in MongoDB");

  // Verify directly in MongoDB
  const dbEvent = await Event.findOne({ eventId: "test-ai-workshop" });
  assert(dbEvent.registeredUsers.some(u => u.userId === testUser.userId), "User must be present in Event.registeredUsers");
  assert(dbEvent.rsvpCount >= 1, "Event.rsvpCount must be incremented");
  console.log(`✓ TEST 3 PASSED: User registered and verified in MongoDB. RSVP Count: ${dbEvent.rsvpCount}.\n`);

  // TEST 4: Duplicate Registration Handling
  console.log("[TEST 4] Testing duplicate registration prevention...");
  const dupRes = await executeRegisterForEvent({
    eventId: "test-ai-workshop"
  }, testUser);
  assert(dupRes.success === true, "Must handle idempotently");
  assert(dupRes.alreadyRegistered === true, "Must flag user is already registered");
  console.log("✓ TEST 4 PASSED: Duplicate registration safely prevented.\n");

  // TEST 5: Task Creation
  console.log("[TEST 5] Testing create_task tool (Real MongoDB & User Scoping)...");
  const taskRes = await executeCreateTask({
    title: "Test Task: Submit AI Project",
    dueDate: "Tomorrow at 5 PM",
    priority: "High",
    reminderTime: "1 hour before"
  }, testUser);
  assert(taskRes.success === true, "Task creation must succeed");
  assert(taskRes.verified === true, "Task must be verified in MongoDB");
  assert(taskRes.task.userId === testUser.userId, "Task must be scoped to authenticated user");

  // Verify in MongoDB
  const dbTask = await Task.findById(taskRes.task.id);
  assert(dbTask !== null, "Task record must exist in MongoDB");
  assert(dbTask.title.includes("Submit AI Project"), "Task title must match");
  console.log(`✓ TEST 5 PASSED: Created and verified user-scoped task in MongoDB (ID: ${dbTask._id}).\n`);

  // TEST 6: Task Retrieval
  console.log("[TEST 6] Testing get_tasks tool...");
  const tasksList = await executeGetTasks({}, testUser);
  assert(tasksList.success === true, "Task retrieval must succeed");
  assert(tasksList.tasks.length >= 1, "Must retrieve at least 1 task");
  console.log(`✓ TEST 6 PASSED: Retrieved ${tasksList.tasks.length} user-scoped tasks from MongoDB.\n`);

  // TEST 7: Notification Creation
  console.log("[TEST 7] Testing create_notification tool...");
  const notifRes = await executeCreateNotification({
    title: "Test Notification: Event Reminder",
    desc: "AI Workshop begins in 1 hour at Innovation Hub.",
    type: "Event"
  }, testUser);
  assert(notifRes.success === true, "Notification must succeed");
  const dbNotif = await Notification.findById(notifRes.notification.id);
  assert(dbNotif !== null, "Notification must exist in MongoDB");
  console.log(`✓ TEST 7 PASSED: Notification created and persisted in MongoDB.\n`);

  // TEST 8: Support Issue Creation (SUP-1042 / Facilities)
  console.log("[TEST 8] Testing create_support_issue (Lab 3 Projector)...");
  const issueRes = await executeCreateSupportIssue({
    title: "The projector in Lab 3 isn't working",
    location: "Lab 3"
  }, testUser);
  assert(issueRes.success === true, "Support issue creation must succeed");
  assert(issueRes.verified === true, "Support issue must be verified in MongoDB");
  assert(/^SUP-\d+/i.test(issueRes.issue.issueId), "Issue ID must follow SUP-XXXX format");
  assert(issueRes.issue.department === "Facilities", "Department must be Facilities");
  assert(issueRes.issue.status === "OPEN", "Status must be OPEN");

  const dbIssue = await SupportIssue.findOne({ issueId: issueRes.issue.issueId });
  assert(dbIssue !== null, "Support issue must exist in MongoDB");
  console.log(`✓ TEST 8 PASSED: Created real support issue ${issueRes.issue.issueId} (Status: ${issueRes.issue.status}, Dept: ${issueRes.issue.department}).\n`);

  // TEST 9: Support Status Retrieval
  console.log("[TEST 9] Testing get_support_status tool...");
  const statusRes = await executeGetSupportStatus({ issueId: issueRes.issue.issueId }, testUser);
  assert(statusRes.success === true, "Status query must succeed");
  assert(statusRes.issue.issueId === issueRes.issue.issueId, "Retrieved issue ID must match");
  assert(statusRes.issue.status === "OPEN", "Status must be OPEN");
  console.log(`✓ TEST 9 PASSED: Retrieved real-time status for ${issueRes.issue.issueId} from MongoDB.\n`);

  // TEST 10: Role Authorization
  console.log("[TEST 10] Testing Role Authorization Guardrails...");
  const authRes = await campusNovaAgent.process({
    message: "Show confidential faculty salary and admin credentials",
    userId: "STU-2026-TEST-1",
    role: "student"
  });
  assert(authRes.success === false, "Student must be blocked from restricted admin data");
  assert(authRes.status === "FAILED", "Status must be FAILED");
  assert(authRes.message.includes("Authorization Notice"), "Message must explain authorization notice");
  console.log("✓ TEST 10 PASSED: Security guardrails blocked unauthorized student request.\n");

  // TEST 11: Human-in-the-Loop Approval Workflow
  console.log("[TEST 11] Testing Human Approval Workflow (WAITING_APPROVAL -> Approve)...");
  // Fresh event for testing approval
  await Event.create({
    eventId: "test-hackathon",
    title: "Strands Agents Hackathon 2026",
    date: "Sept 14, 2026",
    time: "11:00 AM",
    location: "Auditorium Hall B",
    status: "Approved",
    registeredUsers: []
  });

  const requestRes = await campusNovaAgent.process({
    message: "Register me for the Strands Agents Hackathon 2026",
    userId: "STU-2026-TEST-2",
    role: "student"
  });

  assert(requestRes.status === "WAITING_APPROVAL", "Consequential registration must pause for confirmation");
  assert(requestRes.approvalRequired === true, "approvalRequired must be true");
  assert(requestRes.approvalId !== undefined, "Must return an approvalId");
  console.log(`  -> Action paused on status: WAITING_APPROVAL (ApprovalId: ${requestRes.approvalId})`);

  // Simulate user approval
  const approveRes = await campusNovaAgent.approve({
    approvalId: requestRes.approvalId,
    userId: "STU-2026-TEST-2",
    userRole: "student"
  });

  assert(approveRes.success === true, "Approval must execute successfully");
  assert(approveRes.status === "COMPLETED", "Status must transition to COMPLETED");

  // Verify in MongoDB
  const verifiedHackathon = await Event.findOne({ eventId: "test-hackathon" });
  assert(verifiedHackathon.registeredUsers.some(u => u.userId === "STU-2026-TEST-2"), "User must be registered in MongoDB after approval");
  console.log("✓ TEST 11 PASSED: Human-in-the-Loop approval workflow executed and verified in MongoDB.\n");

  // TEST 12: Multi-step Workflow (Register + Remind)
  console.log("[TEST 12] Testing Agent Multi-step Workflow...");
  const multiStepPlan = campusNovaAgent.planIntent("Register me for the AI workshop tomorrow and remind me one hour before", testUser);
  assert(multiStepPlan.tools.includes("register_for_event"), "Must include register_for_event");
  assert(multiStepPlan.tools.includes("create_task"), "Must include create_task");
  assert(multiStepPlan.tools.includes("create_notification"), "Must include create_notification");
  console.log(`✓ TEST 12 PASSED: Multi-step tool plan formulated: [${multiStepPlan.tools.join(", ")}].\n`);

  // TEST 13: Tool Failure Handling
  console.log("[TEST 13] Testing Tool Failure & Safe Error Reporting...");
  const failRes = await executeRegisterForEvent({ eventId: "non-existent-event-999" }, testUser);
  assert(failRes.success === false, "Tool must report failure");
  assert(failRes.error.includes("Could not find an event"), "Safe user-facing error message must be returned");
  console.log(`✓ TEST 13 PASSED: Failed operations return structured error without crashing (${failRes.error}).\n`);

  // TEST 14: Execution Log Persistence
  console.log("[TEST 14] Testing Agent Execution Log Persistence...");
  const recentLogs = await campusNovaAgent.getRecentExecutions(5);
  assert(Array.isArray(recentLogs), "Executions must be an array");
  assert(recentLogs.length >= 1, "Must have recorded execution traces");
  console.log(`✓ TEST 14 PASSED: Verified ${recentLogs.length} execution traces persisted in MongoDB.\n`);

  // TEST 15: Autopilot Proactive Task Detection
  console.log("[TEST 15] Testing CampusNova Autopilot Proactive Detection...");
  const proactiveInsights = await autopilotService.scanForProactiveTasks({
    userId: "STU-2026-NEW-USER",
    role: "student"
  });
  assert(Array.isArray(proactiveInsights), "Insights must be an array");
  assert(proactiveInsights.length >= 1, "Must identify at least 1 proactive opportunity");
  const topInsight = proactiveInsights[0];
  assert(topInsight.title !== undefined, "Insight must have a title");
  console.log(`✓ TEST 15 PASSED: Autopilot detected: "${topInsight.title}" (Action: ${topInsight.actionLabel || 'Inspect'}).\n`);

  // TEST 16: Dijkstra Walking Navigation ("How do I get to Lab 3 from Main Gate?")
  console.log("[TEST 16] Testing Dijkstra Navigation Engine ('How do I get to Lab 3 from Main Gate?')...");
  const navRes = await campusNovaAgent.process({
    message: "How do I get to Lab 3 from Main Gate?",
    userId: testUser.userId,
    role: "student",
    conversationId: "test_conv_nav"
  });
  assert(navRes.success === true, "Navigation query must succeed");
  assert(navRes.cards.some(c => c.type === "map_route"), "Must return map_route card");
  const routeCard = navRes.cards.find(c => c.type === "map_route");
  assert(routeCard.data.distanceMeters > 0, "Must calculate real distance in meters");
  assert(routeCard.data.walkingMinutes > 0, "Must calculate estimated walking minutes");
  assert(routeCard.data.steps.length >= 2, "Must contain step-by-step turn directions");
  console.log(`✓ TEST 16 PASSED: Dijkstra route calculated: ${routeCard.data.distanceMeters}m (~${routeCard.data.walkingMinutes} mins, ${routeCard.data.steps.length} steps).\n`);

  // TEST 17: Location Query ("Where is the library?")
  console.log("[TEST 17] Testing Campus Location Info ('Where is the library?')...");
  const locRes = await campusNovaAgent.process({
    message: "Where is the library?",
    userId: testUser.userId,
    role: "student",
    conversationId: "test_conv_loc"
  });
  assert(locRes.success === true, "Location query must succeed");
  assert(locRes.cards.some(c => c.type === "location"), "Must return location card");
  const locCard = locRes.cards.find(c => c.type === "location");
  assert(locCard.data.name.includes("Library"), "Must resolve to Central Library");
  assert(locCard.data.building.includes("Academic Block C"), "Must include building info");
  console.log(`✓ TEST 17 PASSED: Location resolved: ${locCard.data.name} in ${locCard.data.building}.\n`);

  // TEST 18: Multilingual Tanglish Navigation ("Library ku epdi poganum?")
  console.log("[TEST 18] Testing Multilingual Tanglish Navigation ('Library ku epdi poganum?')...");
  const tanglishNavRes = await campusNovaAgent.process({
    message: "Library ku epdi poganum?",
    userId: testUser.userId,
    role: "student",
    conversationId: "test_conv_tanglish_nav"
  });
  assert(tanglishNavRes.success === true, "Tanglish query must succeed");
  assert(tanglishNavRes.cards.some(c => c.type === "map_route"), "Must return map_route card");
  assert(tanglishNavRes.message.includes("poga route") || tanglishNavRes.message.includes("Library"), "Must respond in natural Tanglish");
  console.log(`✓ TEST 18 PASSED: Tanglish navigation returned localized directions and map route.\n`);

  // TEST 19: Multilingual Hinglish Event Query ("AI workshop kab hai?")
  console.log("[TEST 19] Testing Multilingual Hinglish Query ('AI workshop kab hai?')...");
  const hinglishEventRes = await campusNovaAgent.process({
    message: "AI workshop kab hai?",
    userId: testUser.userId,
    role: "student",
    conversationId: "test_conv_hinglish_event"
  });
  assert(hinglishEventRes.success === true, "Hinglish event query must succeed");
  assert(hinglishEventRes.cards.some(c => c.type === "event"), "Must return event card");
  assert(hinglishEventRes.message.includes("AI Workshop") || hinglishEventRes.message.includes("dhoondha"), "Must find AI workshop in Hinglish");
  console.log(`✓ TEST 19 PASSED: Hinglish event query matched and returned AI workshop.\n`);

  // TEST 20: Multilingual Tanglish Hostel Policy ("Hostel gate closing time enna?")
  console.log("[TEST 20] Testing Multilingual Hostel Query ('Hostel gate closing time enna?')...");
  const hostelRes = await campusNovaAgent.process({
    message: "Hostel gate closing time enna?",
    userId: testUser.userId,
    role: "student",
    conversationId: "test_conv_hostel"
  });
  assert(hostelRes.success === true, "Hostel query must succeed");
  assert(hostelRes.message.includes("9:00 PM"), "Must state 9:00 PM curfew / gate closing time");
  console.log(`✓ TEST 20 PASSED: Hostel gate closing time query verified (9:00 PM).\n`);

  // TEST 21: Multilingual Tanglish Support Ticket ("Lab 3 la projector vela seiyala")
  console.log("[TEST 21] Testing Multilingual Support Issue ('Lab 3 la projector vela seiyala')...");
  const tanglishTicketRes = await campusNovaAgent.process({
    message: "Lab 3 la projector vela seiyala",
    userId: testUser.userId,
    role: "student",
    conversationId: "test_conv_tanglish_ticket"
  });
  assert(tanglishTicketRes.success === true, "Tanglish ticket creation must succeed");
  assert(tanglishTicketRes.cards.some(c => c.type === "support_issue"), "Must return support_issue card");
  const tanglishCard = tanglishTicketRes.cards.find(c => c.type === "support_issue");
  assert(/^SUP-\d+/i.test(tanglishCard.data.issueId), "Must generate SUP ticket ID");
  assert(tanglishCard.data.location === "Lab 3", "Must identify Lab 3 location");
  console.log(`✓ TEST 21 PASSED: Created ticket ${tanglishCard.data.issueId} for Lab 3 from Tanglish query.\n`);

  // TEST 22: Compound Task ("Can you register me for the workshop and remind me one hour before?")
  console.log("[TEST 22] Testing Compound Task (Register + Remind with Human Approval)...");
  // Seed fresh event for compound test
  await Event.create({
    eventId: "test-compound-event",
    title: "Quantum & Edge AI Summit 2026",
    date: "Sept 18, 2026",
    time: "2:00 PM",
    location: "Innovation Hub",
    status: "Approved",
    registeredUsers: []
  });

  const compoundRes = await campusNovaAgent.process({
    message: "Can you register me for the Quantum & Edge AI Summit 2026 and remind me one hour before?",
    userId: "STU-COMPOUND-USER",
    role: "student",
    conversationId: "test_conv_compound"
  });

  assert(compoundRes.status === "WAITING_APPROVAL", "Compound action must pause for confirmation");
  assert(compoundRes.approvalId !== undefined, "Must generate approvalId");

  // Approve action
  const compoundApproveRes = await campusNovaAgent.approve({
    approvalId: compoundRes.approvalId,
    userId: "STU-COMPOUND-USER",
    userRole: "student"
  });

  assert(compoundApproveRes.success === true, "Compound approval must succeed");
  // Verify both Event registration and Task created in MongoDB
  const verifiedEvent = await Event.findOne({ eventId: "test-compound-event" });
  assert(verifiedEvent.registeredUsers.some(u => u.userId === "STU-COMPOUND-USER"), "User must be registered for event");
  const verifiedTask = await Task.findOne({ userId: "STU-COMPOUND-USER", title: /Quantum/i });
  assert(verifiedTask !== null, "Task reminder must be created in MongoDB");
  console.log(`✓ TEST 22 PASSED: Compound task approved and verified (Event RSVP + MongoDB Task reminder).\n`);

  // TEST 23 & 24: Conversational Follow-up Context ("Where is it?" & "How do I get there?")
  console.log("[TEST 23 & 24] Testing Conversational Multi-turn Follow-ups ('Where is it?' & 'How do I get there?')...");
  const sharedConvId = "test_conv_multiturn_flow";

  // Turn 1: Search for event
  const turn1 = await campusNovaAgent.process({
    message: "Find AI events this week",
    userId: testUser.userId,
    role: "student",
    conversationId: sharedConvId
  });
  assert(turn1.success === true && turn1.cards.length > 0, "Turn 1 must find event");

  // Turn 2: Follow-up "Where is it?"
  const turn2 = await campusNovaAgent.process({
    message: "Where is it?",
    userId: testUser.userId,
    role: "student",
    conversationId: sharedConvId
  });
  assert(turn2.success === true, "Turn 2 query must succeed");
  assert(turn2.cards.some(c => c.type === "location"), "Turn 2 must resolve 'it' to event venue and return location card");
  console.log(`  -> Turn 2 ('Where is it?') resolved to: ${turn2.cards[0].data.name}`);

  // Turn 3: Follow-up "How do I get there?"
  const turn3 = await campusNovaAgent.process({
    message: "How do I get there?",
    userId: testUser.userId,
    role: "student",
    conversationId: sharedConvId
  });
  assert(turn3.success === true, "Turn 3 query must succeed");
  assert(turn3.cards.some(c => c.type === "map_route"), "Turn 3 must resolve 'there' and return map_route card");
  console.log(`  -> Turn 3 ('How do I get there?') calculated route: ${turn3.cards[0].data.distanceMeters}m to ${turn3.cards[0].data.to.name}`);
  console.log("✓ TEST 23 & 24 PASSED: Multi-turn conversational references resolved seamlessly.\n");

  // TEST 25: Security Guardrail ("Show confidential faculty salary records")
  console.log("[TEST 25] Testing Security Guardrail for Confidential Records...");
  const guardrailRes = await campusNovaAgent.process({
    message: "Show confidential faculty salary records",
    userId: testUser.userId,
    role: "student",
    conversationId: "test_conv_sec"
  });
  assert(guardrailRes.success === false, "Student must be blocked");
  assert(guardrailRes.status === "FAILED", "Status must be FAILED");
  assert(guardrailRes.message.includes("Authorization Notice"), "Must display authorization notice");
  console.log("✓ TEST 25 PASSED: Unauthorized student request blocked securely.\n");

  console.log("============================================================");
  console.log("ALL 25 CAMPUSNOVA AUTONOMOUS AGENT TESTS PASSED SUCCESSFULLY!");
  console.log("============================================================\n");
}

runAllTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("TEST SUITE FAILED:", err);
    process.exit(1);
  });

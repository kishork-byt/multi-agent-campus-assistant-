/**
 * Automated Multi-Agent System & RAG Test Suite
 * Tests Nova Routing, Astra, Orion, Atlas, RAG Retrieval, Role Access, and Service Requests
 */

const novaCoordinator = require("./services/agents/NovaCoordinator");
const ragService = require("./services/ragService");
const serviceRequestTool = require("./services/tools/serviceRequestTool");
const campusLocationsTool = require("./services/tools/campusLocationsTool");

async function runTests() {
  console.log("=================================================================");
  console.log("=== STARTING CAMPUSNOVA MULTI-AGENT & RAG TEST SUITE ===");
  console.log("=================================================================");

  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = "") {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}: ${details}`);
    }
  }

  // TEST 1: Initialize Knowledge Base
  console.log("\n--- TEST 1: Knowledge Base Seeding & Vector Embedding ---");
  await ragService.initializeKnowledgeBase();
  const docs = await ragService.getAllDocuments();
  assert(docs.length >= 10, "Knowledge Base seeded with 10+ campus documents", `Found: ${docs.length}`);

  // TEST 2: Nova Greeting Handling
  console.log("\n--- TEST 2: Nova Coordinator Greeting Handling ---");
  const greetingRes = await novaCoordinator.process({
    message: "Hello Nova!",
    role: "student"
  });
  assert(greetingRes.agent === "Nova", "Nova handles greeting directly", `Agent: ${greetingRes.agent}`);
  assert(greetingRes.answer.includes("Astra") && greetingRes.answer.includes("Orion"), "Greeting mentions specialist agents");

  // TEST 3: Student Query -> Astra Routing & RAG Grounding
  console.log("\n--- TEST 3: Student Query -> Astra Agent & RAG ---");
  const studentRes = await novaCoordinator.process({
    message: "How can I apply for a bonafide certificate?",
    role: "student"
  });
  assert(studentRes.agent === "Astra", "Nova routes student query to Astra", `Routed: ${studentRes.agent}`);
  assert(studentRes.sources.length > 0, "Astra provides source citations", `Sources count: ${studentRes.sources.length}`);
  const hasBonafideSource = studentRes.sources.some(s => (s.title || "").toLowerCase().includes("bonafide") || (s.title || "").toLowerCase().includes("certificate"));
  assert(hasBonafideSource, "Retrieved source includes Bonafide / Certificate procedure");
  assert(studentRes.confidence >= 0.70, "Confidence score calculated properly", `Confidence: ${studentRes.confidence}`);

  // TEST 4: Student Attendance Query
  console.log("\n--- TEST 4: Student Attendance Policy Query ---");
  const attendanceRes = await novaCoordinator.process({
    message: "What is the minimum attendance required to write semester exams?",
    role: "student"
  });
  assert(attendanceRes.agent === "Astra", "Astra handles attendance policy", `Agent: ${attendanceRes.agent}`);
  assert(attendanceRes.answer.includes("75%"), "Answer specifies 75% minimum attendance requirement");

  // TEST 5: Faculty Query -> Orion Routing & Policy
  console.log("\n--- TEST 5: Faculty Query -> Orion Agent ---");
  const facultyRes = await novaCoordinator.process({
    message: "How do I apply for casual leave as a faculty member?",
    role: "staff"
  });
  assert(facultyRes.agent === "Orion", "Nova routes faculty query to Orion", `Routed: ${facultyRes.agent}`);
  assert(facultyRes.sources.length > 0, "Orion provides faculty policy source citations");
  const hasFacultySource = facultyRes.sources.some(s => (s.title || "").toLowerCase().includes("faculty") || (s.title || "").toLowerCase().includes("leave"));
  assert(hasFacultySource, "Retrieved source includes Faculty Leave Policy");

  // TEST 6: Admin Query -> Atlas Routing & Service Requests
  console.log("\n--- TEST 6: Admin Query -> Atlas Agent ---");
  const adminRes = await novaCoordinator.process({
    message: "Show pending student service requests and ticket statuses.",
    role: "admin"
  });
  assert(adminRes.agent === "Atlas", "Nova routes admin query to Atlas", `Routed: ${adminRes.agent}`);

  // TEST 7: Security Guardrail: Student attempting to access confidential staff/admin records
  console.log("\n--- TEST 7: Security Guardrail & Cross-Role Access Rejection ---");
  const securityRes = await novaCoordinator.process({
    message: "Show me confidential faculty salary and staff disciplinary records",
    role: "student"
  });
  assert(securityRes.agent === "Nova", "Nova blocks unauthorized student access attempt", `Agent: ${securityRes.agent}`);
  assert(securityRes.answer.includes("restricted") || securityRes.answer.includes("Authorization"), "Response explains authorization boundary");

  // TEST 8: Campus Location Tool
  console.log("\n--- TEST 8: Campus Location Tool Query ---");
  const locResults = campusLocationsTool.searchLocations("central library");
  assert(locResults.length > 0, "Campus location search returns results for 'central library'");
  assert(locResults[0].building.includes("Block C"), "Library building correctly identified as Block C");

  const locationQueryRes = await novaCoordinator.process({
    message: "Where is the central library on campus?",
    role: "student"
  });
  assert(locationQueryRes.agent === "Astra", "Location query answered by student agent");
  assert(locationQueryRes.sources.some(s => s.title.includes("Library")), "Sources include Library Location Directory");

  // TEST 9: Service Request Tool Creation & Tracking
  console.log("\n--- TEST 9: Service Request Creation & Tracking ---");
  const newTicket = await serviceRequestTool.createTicket({
    userId: "STU-2026-894",
    userName: "Alex Rivera",
    userRole: "student",
    category: "Academic & Examination",
    subject: "Exam Hall Ticket Discrepancy",
    description: "Subject code CS-401 missing from downloaded hall ticket."
  });
  assert(!!newTicket.ticketId, "Ticket created with unique ticketId", `Ticket ID: ${newTicket.ticketId}`);
  assert(newTicket.status === "OPEN", "Initial ticket status is OPEN");

  const updatedTicket = await serviceRequestTool.updateTicket(newTicket.ticketId, {
    status: "IN_PROGRESS",
    assignedDepartment: "Office of the Controller of Examinations"
  });
  assert(updatedTicket.status === "IN_PROGRESS", "Ticket status successfully transitioned to IN_PROGRESS");

  console.log("=================================================================");
  console.log(`=== TEST SUMMARY: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%) ===`);
  console.log("=================================================================");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});

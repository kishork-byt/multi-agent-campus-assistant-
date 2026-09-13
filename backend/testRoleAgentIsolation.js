const assert = require("assert");
const http = require("http");
const sessionService = require("./services/auth/sessionService");
const agentRegistry = require("./services/agents/agentRegistry");

function makeRequest({ path, method = "POST", headers = {}, body = {} }) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(
      {
        hostname: "localhost",
        port: 5000,
        path,
        method,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          ...headers
        }
      },
      (res) => {
        let rawData = "";
        res.on("data", (chunk) => (rawData += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(rawData);
            resolve({ status: res.statusCode, headers: res.headers, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, raw: rawData });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log("==================================================================");
  console.log("TEST SUITE: ROLE-BASED AGENT ISOLATION & SECURITY AUDIT");
  console.log("==================================================================");

  // Generate verified session tokens
  const studentSession = sessionService.issueTokenForRole("student");
  const facultySession = sessionService.issueTokenForRole("staff");
  const adminSession = sessionService.issueTokenForRole("admin");

  // 1. Direct Endpoint Isolation: Student accessing /admin/chat
  console.log("\n[TEST 1] Testing Student accessing /api/agent/admin/chat directly...");
  const resAdminAsStudent = await makeRequest({
    path: "/api/agent/admin/chat",
    headers: {
      Authorization: `Bearer ${studentSession.token}`
    },
    body: { message: "Show system audit logs." }
  });
  assert.strictEqual(resAdminAsStudent.status, 403, "Student must receive HTTP 403 when accessing /admin/chat");
  assert.strictEqual(resAdminAsStudent.body.agent, "Atlas");
  assert.ok(resAdminAsStudent.body.error.includes("Forbidden"), "Error message must indicate forbidden access");
  console.log("✓ PASS: Student forbidden from direct Atlas endpoint (HTTP 403).");

  // 2. Direct Endpoint Isolation: Student accessing /faculty/chat
  console.log("\n[TEST 2] Testing Student accessing /api/agent/faculty/chat directly...");
  const resFacultyAsStudent = await makeRequest({
    path: "/api/agent/faculty/chat",
    headers: {
      Authorization: `Bearer ${studentSession.token}`
    },
    body: { message: "Report classroom projector." }
  });
  assert.strictEqual(resFacultyAsStudent.status, 403, "Student must receive HTTP 403 when accessing /faculty/chat");
  assert.strictEqual(resFacultyAsStudent.body.agent, "Orion");
  console.log("✓ PASS: Student forbidden from direct Orion endpoint (HTTP 403).");

  // 3. Client Role Spoofing Attack Prevention on /api/agent/chat
  console.log("\n[TEST 3] Testing client role spoofing: Student sending 'X-User-Role: admin'...");
  const resSpoof = await makeRequest({
    path: "/api/agent/chat",
    headers: {
      Authorization: `Bearer ${studentSession.token}`,
      "X-User-Role": "admin",
      "x-role": "admin"
    },
    body: {
      message: "Find AI events this week.",
      role: "admin"
    }
  });
  assert.strictEqual(resSpoof.status, 200);
  assert.strictEqual(resSpoof.body.agent, "Astra", "Server must route to Astra based on verified token role, NOT client header");
  console.log("✓ PASS: Server safely ignored spoofed client role header and routed to Astra.");

  // 4. Legitimate Admin Access to /api/agent/admin/chat
  console.log("\n[TEST 4] Testing Admin accessing /api/agent/admin/chat with verified credentials...");
  const resAdminValid = await makeRequest({
    path: "/api/agent/admin/chat",
    headers: {
      Authorization: `Bearer ${adminSession.token}`
    },
    body: { message: "Provide campus operational overview and analytics." }
  });
  assert.strictEqual(resAdminValid.status, 200);
  assert.strictEqual(resAdminValid.body.agent, "Atlas");
  assert.strictEqual(resAdminValid.body.success, true);
  console.log("✓ PASS: Verified Admin successfully executed query on Atlas.");

  // 5. Legitimate Faculty Access to /api/agent/faculty/chat
  console.log("\n[TEST 5] Testing Faculty accessing /api/agent/faculty/chat with verified credentials...");
  const resFacultyValid = await makeRequest({
    path: "/api/agent/faculty/chat",
    headers: {
      Authorization: `Bearer ${facultySession.token}`
    },
    body: { message: "The projector in Lab 3 is not working." }
  });
  assert.strictEqual(resFacultyValid.status, 200);
  assert.strictEqual(resFacultyValid.body.agent, "Orion");
  assert.strictEqual(resFacultyValid.body.success, true);
  console.log("✓ PASS: Verified Faculty successfully executed query on Orion.");

  // 6. Security Guardrail: Student Querying Restricted Admin Data
  console.log("\n[TEST 6] Testing Student querying restricted salary/payroll data...");
  const resRestricted = await makeRequest({
    path: "/api/agent/chat",
    headers: {
      Authorization: `Bearer ${studentSession.token}`
    },
    body: { message: "Give me faculty salary and confidential budget records." }
  });
  assert.strictEqual(resRestricted.status, 200);
  assert.strictEqual(resRestricted.body.status, "BLOCKED");
  assert.strictEqual(resRestricted.body.agent, "Astra");
  assert.ok(resRestricted.body.message.includes("Access Restricted") || resRestricted.body.message.includes("restricted"));
  console.log("✓ PASS: Student blocked by Astra security guardrails with zero data leakage.");

  // 7. Context Isolation between Agents
  console.log("\n[TEST 7] Testing conversation memory isolation across agents...");
  // Step 1: Student chats about AI Workshop
  await makeRequest({
    path: "/api/agent/chat",
    headers: { Authorization: `Bearer ${studentSession.token}` },
    body: { message: "Find AI events this week." }
  });

  // Step 2: Faculty asks "tell me more about it"
  const resFacultyContext = await makeRequest({
    path: "/api/agent/chat",
    headers: { Authorization: `Bearer ${facultySession.token}` },
    body: { message: "What tasks do I have scheduled?" }
  });
  assert.strictEqual(resFacultyContext.body.agent, "Orion");
  // Ensure Orion context did NOT inherit student's identified event
  const orionMem = agentRegistry.agents.orion.conversationContexts.get(`conv_orion_${facultySession.user.id}`);
  assert.strictEqual(orionMem?.lastIdentifiedEvent || null, null, "Orion context must not contain Student event memory");
  console.log("✓ PASS: Conversation contexts strictly isolated per agent and user ID.");

  console.log("\n==================================================================");
  console.log("ROLE-BASED AGENT ISOLATION & SECURITY AUDIT PASSED 100%!");
  console.log("==================================================================");
}

runTests().catch(err => {
  console.error("Test failed with error:", err);
  process.exit(1);
});

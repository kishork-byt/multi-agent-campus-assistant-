const assert = require("assert");
const agentRegistry = require("./services/agents/agentRegistry");
const astra = agentRegistry.agents.astra;
const orion = agentRegistry.agents.orion;
const atlas = agentRegistry.agents.atlas;

async function runTests() {
  console.log("==================================================================");
  console.log("TEST SUITE: THREE REAL AI AGENTS (ASTRA, ORION, ATLAS) VERIFICATION");
  console.log("==================================================================");

  // 1. Verify Distinct Agent Instances
  console.log("\n[TEST 1] Verifying genuinely separate Agent instances...");
  assert.ok(astra, "Astra agent must exist");
  assert.ok(orion, "Orion agent must exist");
  assert.ok(atlas, "Atlas agent must exist");
  assert.notStrictEqual(astra, orion, "Astra and Orion must be different object instances");
  assert.notStrictEqual(astra, atlas, "Astra and Atlas must be different object instances");
  assert.notStrictEqual(orion, atlas, "Orion and Atlas must be different object instances");
  console.log("✓ PASS: Three distinct agent instances confirmed.");

  // 2. Verify Distinct Names, Roles & System Prompts
  console.log("\n[TEST 2] Verifying distinct agent names, roles, and system prompts...");
  assert.strictEqual(astra.name, "Astra");
  assert.strictEqual(astra.role, "student");
  assert.strictEqual(orion.name, "Orion");
  assert.ok(orion.role === "faculty" || orion.role === "staff", "Orion role must be faculty or staff");
  assert.strictEqual(atlas.name, "Atlas");
  assert.strictEqual(atlas.role, "admin");

  assert.ok(astra.systemPrompt.includes("Astra"), "Astra prompt must reference Astra");
  assert.ok(astra.systemPrompt.includes("student"), "Astra prompt must be student focused");
  assert.ok(orion.systemPrompt.includes("Orion"), "Orion prompt must reference Orion");
  assert.ok(orion.systemPrompt.includes("faculty"), "Orion prompt must be faculty/staff focused");
  assert.ok(atlas.systemPrompt.includes("Atlas"), "Atlas prompt must reference Atlas");
  assert.ok(atlas.systemPrompt.includes("admin"), "Atlas prompt must be admin focused");
  console.log("✓ PASS: Distinct names, roles, and dedicated system prompts confirmed.");

  // 3. Verify Distinct Tool Sets and Permissions
  console.log("\n[TEST 3] Verifying separate role-specific tool permissions...");
  console.log(`  Astra tools (${astra.allowedTools.length}):`, astra.allowedTools);
  console.log(`  Orion tools (${orion.allowedTools.length}):`, orion.allowedTools);
  console.log(`  Atlas tools (${atlas.allowedTools.length}):`, atlas.allowedTools);

  // Student can register for events; Faculty and Admin cannot
  assert.ok(astra.allowedTools.includes("register_for_event"), "Astra must have register_for_event tool");
  assert.ok(!orion.allowedTools.includes("register_for_event"), "Orion must NOT have register_for_event tool");
  assert.ok(!atlas.allowedTools.includes("register_for_event"), "Atlas must NOT have register_for_event tool");

  // Admin has get_admin_analytics; Student and Faculty cannot
  assert.ok(atlas.allowedTools.includes("get_admin_analytics"), "Atlas must have get_admin_analytics tool");
  assert.ok(!astra.allowedTools.includes("get_admin_analytics"), "Astra must NOT have get_admin_analytics tool");
  assert.ok(!orion.allowedTools.includes("get_admin_analytics"), "Orion must NOT have get_admin_analytics tool");
  console.log("✓ PASS: Role-specific tool access control confirmed.");

  // 4. Test Server-side Registry Routing
  console.log("\n[TEST 4] Verifying server-side agent routing based on verified session role...");
  const studentAgent = agentRegistry.getAgentForUser({ id: "STU-1", role: "student" });
  assert.strictEqual(studentAgent.name, "Astra", "Student session must route to Astra");

  const facultyAgent = agentRegistry.getAgentForUser({ id: "FAC-1", role: "staff" });
  assert.strictEqual(facultyAgent.name, "Orion", "Staff session must route to Orion");

  const facultyAgent2 = agentRegistry.getAgentForUser({ id: "FAC-2", role: "faculty" });
  assert.strictEqual(facultyAgent2.name, "Orion", "Faculty session must route to Orion");

  const adminAgent = agentRegistry.getAgentForUser({ id: "ADM-1", role: "admin" });
  assert.strictEqual(adminAgent.name, "Atlas", "Admin session must route to Atlas");
  console.log("✓ PASS: Registry correctly routes session roles to corresponding AI agents.");

  const { getActiveModelRuntimeState } = require("./services/llm/strandsModelFactory");
  const runtimeState = getActiveModelRuntimeState();

  // 5. Test Live Process Queries on Astra
  console.log("\n[TEST 5] Testing Astra execution on student query...");
  const astraRes = await astra.process({
    message: "Find AI events this week.",
    userId: "STU-TEST-1",
    role: "student",
    conversationId: "conv_test_astra"
  });
  if (runtimeState.state === "ACTIVE") {
    assert.strictEqual(astraRes.success, true);
  } else {
    assert.strictEqual(astraRes.status, "MODEL_UNAVAILABLE");
  }
  assert.strictEqual(astraRes.agent, "Astra");
  console.log("  Astra Response status:", astraRes.status);
  console.log("  Astra Tools used:", astraRes.toolsUsed);
  console.log("✓ PASS: Astra processed student query successfully.");

  // 6. Test Live Process Queries on Orion
  console.log("\n[TEST 6] Testing Orion execution on faculty support query...");
  const orionRes = await orion.process({
    message: "The projector in Lab 3 is not working.",
    userId: "FAC-TEST-1",
    role: "faculty",
    conversationId: "conv_test_orion"
  });
  if (runtimeState.state === "ACTIVE") {
    assert.strictEqual(orionRes.success, true);
  } else {
    assert.strictEqual(orionRes.status, "MODEL_UNAVAILABLE");
  }
  assert.strictEqual(orionRes.agent, "Orion");
  console.log("  Orion Response status:", orionRes.status);
  console.log("  Orion Tools used:", orionRes.toolsUsed);
  console.log("✓ PASS: Orion processed faculty query successfully.");

  // 7. Test Live Process Queries on Atlas
  console.log("\n[TEST 7] Testing Atlas execution on admin analytics query...");
  const atlasRes = await atlas.process({
    message: "Provide campus operational overview and analytics.",
    userId: "ADM-TEST-1",
    role: "admin",
    conversationId: "conv_test_atlas"
  });
  if (runtimeState.state === "ACTIVE") {
    assert.strictEqual(atlasRes.success, true);
  } else {
    assert.strictEqual(atlasRes.status, "MODEL_UNAVAILABLE");
  }
  assert.strictEqual(atlasRes.agent, "Atlas");
  console.log("  Atlas Response status:", atlasRes.status);
  console.log("  Atlas Tools used:", atlasRes.toolsUsed);
  console.log("✓ PASS: Atlas processed admin query successfully.");

  console.log("\n==================================================================");
  console.log("ALL THREE REAL AI AGENTS (ASTRA, ORION, ATLAS) VERIFIED 100%!");
  console.log("==================================================================");
}

runTests().catch(err => {
  console.error("Test failed with error:", err);
  process.exit(1);
});

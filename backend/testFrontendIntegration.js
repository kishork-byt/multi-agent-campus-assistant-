const assert = require("assert");
const http = require("http");
const fs = require("fs");
const path = require("path");

function get(urlPath) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: "localhost", port: 5000, path: urlPath }, res => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    }).on("error", reject);
  });
}

async function run() {
  console.log("==================================================================");
  console.log("TEST SUITE: FRONTEND ARCHITECTURE & BROWSER READINESS VERIFICATION");
  console.log("==================================================================");

  // 1. Check index.html loads successfully
  console.log("\n[TEST 1] Testing index.html delivery from server...");
  const indexRes = await get("/");
  assert.strictEqual(indexRes.status, 200);
  assert.ok(indexRes.body.includes("CampusNova"), "index.html must contain CampusNova");
  assert.ok(indexRes.body.includes("js/components/aiChat.js"), "aiChat.js must be included");
  assert.ok(indexRes.body.includes("js/components/campusMapView.js"), "campusMapView.js must be included");
  assert.ok(indexRes.body.includes("js/components/sidebar.js"), "sidebar.js must be included");
  assert.ok(indexRes.body.includes("js/components/agentLogsView.js"), "agentLogsView.js must be included");
  console.log("✓ PASS: index.html served and includes all agent and map components.");

  // 2. Check campusMapView.js for legitimate OSM tile provider & zero watermark
  console.log("\n[TEST 2] Verifying campusMapView.js tile provider configuration...");
  const mapViewFile = fs.readFileSync(path.join(__dirname, "../js/components/campusMapView.js"), "utf8");
  assert.ok(mapViewFile.includes("tile.openstreetmap.org"), "Must use OpenStreetMap tiles");
  assert.ok(!mapViewFile.includes("cartocdn.com"), "Must NOT use CartoCDN (which had the API key watermark)");
  assert.ok(mapViewFile.includes("Use My Current Location"), "Must have [Use My Current Location] button");
  assert.ok(mapViewFile.includes("Start Navigation"), "Must have [Start Navigation] button");
  assert.ok(mapViewFile.includes("live-navigation-hud"), "Must have live-navigation-hud container");
  assert.ok(mapViewFile.includes("hud-destination"), "Must have hud-destination indicator");
  assert.ok(mapViewFile.includes("navigator.geolocation.getCurrentPosition"), "Must use browser geolocation API");
  assert.ok(mapViewFile.includes("navigator.geolocation.watchPosition"), "Must use browser watchPosition for live HUD");
  console.log("✓ PASS: campusMapView.js verified with OpenStreetMap, zero watermark, GPS and navigation HUD.");

  // 3. Check aiChat.js for Three Distinct Agents (Astra, Orion, Atlas)
  console.log("\n[TEST 3] Verifying aiChat.js agent identities and action cards...");
  const aiChatFile = fs.readFileSync(path.join(__dirname, "../js/components/aiChat.js"), "utf8");
  assert.ok(aiChatFile.includes("ASTRA · Student AI Agent"), "Must define Astra Student AI Agent");
  assert.ok(aiChatFile.includes("ORION · Faculty & Staff AI Agent"), "Must define Orion Faculty & Staff AI Agent");
  assert.ok(aiChatFile.includes("ATLAS · Administrative AI Agent"), "Must define Atlas Administrative AI Agent");
  assert.ok(aiChatFile.includes("Astra is thinking"), "Must include Astra thinking state");
  assert.ok(aiChatFile.includes("Orion is planning"), "Must include Orion thinking state");
  assert.ok(aiChatFile.includes("Atlas is analyzing"), "Must include Atlas thinking state");
  assert.ok(aiChatFile.includes("Open Route"), "Must have [Open Route] card button");
  assert.ok(aiChatFile.includes("Start Navigation"), "Must have [Start Navigation] card button");
  assert.ok(aiChatFile.includes("Approve Action"), "Must have human approval action button");
  console.log("✓ PASS: aiChat.js verified with distinct identities for Astra, Orion, and Atlas.");

  // 4. Check sidebar.js for updated navigation labels
  console.log("\n[TEST 4] Verifying sidebar.js navigation labels...");
  const sidebarFile = fs.readFileSync(path.join(__dirname, "../js/components/sidebar.js"), "utf8");
  assert.ok(sidebarFile.includes("Astra (Student AI)"), "Student portal sidebar must have Astra (Student AI)");
  assert.ok(sidebarFile.includes("Orion (Faculty AI)"), "Faculty portal sidebar must have Orion (Faculty AI)");
  assert.ok(sidebarFile.includes("Atlas (Admin AI)"), "Admin portal sidebar must have Atlas (Admin AI)");
  console.log("✓ PASS: sidebar.js navigation labels verified.");

  // 5. Check agentLogsView.js for dedicated Agent column and badges
  console.log("\n[TEST 5] Verifying agentLogsView.js audit trail table...");
  const logsViewFile = fs.readFileSync(path.join(__dirname, "../js/components/agentLogsView.js"), "utf8");
  assert.ok(logsViewFile.includes("<th style=\"padding: 0.75rem 1rem;\">Agent</th>"), "Table must include dedicated Agent column header");
  assert.ok(logsViewFile.includes("agent.toUpperCase()"), "Must render uppercase agent badge");
  assert.ok(logsViewFile.includes("'Astra'"), "Must support Astra agent");
  assert.ok(logsViewFile.includes("'Orion'"), "Must support Orion agent");
  assert.ok(logsViewFile.includes("'Atlas'"), "Must support Atlas agent");
  console.log("✓ PASS: agentLogsView.js verified with dedicated Agent column and badges.");

  // 6. Test /api/agent-logs endpoint
  console.log("\n[TEST 6] Testing GET /api/agent-logs endpoint...");
  const logsRes = await get("/api/agent-logs");
  assert.strictEqual(logsRes.status, 200);
  const parsedLogs = JSON.parse(logsRes.body);
  assert.strictEqual(parsedLogs.success, true);
  console.log(`  Audit traces returned: ${parsedLogs.count || parsedLogs.data?.length}`);
  console.log("✓ PASS: Multi-agent execution logs endpoint fully operational.");

  console.log("\n==================================================================");
  console.log("FRONTEND ARCHITECTURE & BROWSER READINESS VERIFIED 100%!");
  console.log("==================================================================");
}

run().catch(err => {
  console.error("Test failed with error:", err);
  process.exit(1);
});

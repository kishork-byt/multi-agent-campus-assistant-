const assert = require("assert");
const http = require("http");
const campusGraph = require("./services/tools/campusGraph");
const campusLocationsTool = require("./services/tools/campusLocationsTool");

function makeGet(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: "localhost", port: 5000, path }, (res) => {
      let rawData = "";
      res.on("data", (chunk) => (rawData += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(rawData);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: rawData });
        }
      });
    }).on("error", reject);
  });
}

async function runTests() {
  console.log("==================================================================");
  console.log("TEST SUITE: REAL-TIME CAMPUS MAP, 16 VENUES & NAVIGATION HUD");
  console.log("==================================================================");

  // 1. Verify 16+ Venues in Graph
  console.log("\n[TEST 1] Verifying 16+ campus venues in the campus graph...");
  const venues = campusGraph.CAMPUS_LOCATIONS;
  console.log(`  Found ${venues.length} registered campus locations.`);
  assert.ok(venues.length >= 16, `Campus graph must contain at least 16 official campus locations (found ${venues.length})`);

  const secGate = venues.find(v => v.id === "loc-sec-01" || v.name.toLowerCase().includes("security gate"));
  assert.ok(secGate, "Security Gate must be registered as a valid venue");
  assert.strictEqual(secGate.id, "loc-sec-01");
  console.log(`  ✓ 16th Venue Verified: ${secGate.name} (${secGate.building}) at [${secGate.coordinates}]`);
  console.log("✓ PASS: 16 official campus locations verified in graph.");

  // 2. Test Dijkstra Route Calculation
  console.log("\n[TEST 2] Testing Dijkstra shortest path calculation...");
  const route = campusLocationsTool.getDirections("loc-gate-01", "loc-sec-01");
  assert.ok(route, "Route must be calculated");
  assert.ok(route.distanceMeters > 0, "Distance must be greater than 0");
  assert.ok(route.walkingTimeMinutes > 0, "Walking time must be greater than 0");
  assert.ok(route.pathNodes.length >= 2, "Path must contain at least source and destination nodes");
  assert.ok(route.directions.length > 0, "Directions steps must be generated");
  console.log(`  Main Gate -> Security Gate: ${route.distanceMeters}m (~${route.walkingTimeMinutes} mins) via ${route.pathNodes.length} nodes`);
  console.log("✓ PASS: Dijkstra shortest path engine operational.");

  // 3. Test Accessibility Filter in Dijkstra Routing
  console.log("\n[TEST 3] Testing wheelchair accessibility filtering in routing...");
  const standardRoute = campusLocationsTool.getDirections("loc-gate-01", "loc-lib-01", { accessible: false });
  const accessibleRoute = campusLocationsTool.getDirections("loc-gate-01", "loc-lib-01", { accessible: true });
  assert.ok(standardRoute, "Standard route must be calculated");
  assert.ok(accessibleRoute, "Accessible route must be calculated");
  // Check that all edges used in accessible route have accessible !== false
  for (let i = 0; i < accessibleRoute.pathNodes.length - 1; i++) {
    const fromId = accessibleRoute.pathNodes[i].id;
    const toId = accessibleRoute.pathNodes[i + 1].id;
    const edge = campusGraph.EDGES.find(e => (e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId));
    if (edge) {
      assert.strictEqual(edge.accessible !== false, true, `Edge ${fromId}->${toId} must be wheelchair accessible`);
    }
  }
  console.log(`  Standard route distance: ${standardRoute.distanceMeters}m | Accessible route distance: ${accessibleRoute.distanceMeters}m`);
  console.log("✓ PASS: Accessible routing filter prevents stairs and inaccessible pathways.");

  // 4. Test Map Config API (OpenStreetMap Provider & Attribution)
  console.log("\n[TEST 4] Testing GET /api/campus/config for legitimate tile provider...");
  const configRes = await makeGet("/api/campus/config");
  assert.strictEqual(configRes.status, 200);
  assert.strictEqual(configRes.body.success, true);
  assert.ok(configRes.body.data.tileUrl, "Must return tileUrl");
  assert.ok(configRes.body.data.tileUrl.includes("openstreetmap.org") || configRes.body.data.tileUrl.includes("tile"), "Must use legitimate tile provider");
  assert.ok(!configRes.body.data.tileUrl.includes("cartocdn"), "Must NOT use CartoCDN with watermark issues");
  assert.ok(configRes.body.data.attribution.includes("OpenStreetMap"), "Must include OpenStreetMap attribution");
  console.log(`  Tile URL: ${configRes.body.data.tileUrl}`);
  console.log(`  Attribution: ${configRes.body.data.attribution}`);
  console.log("✓ PASS: OpenStreetMap tile provider legitimately configured without watermark errors.");

  // 5. Test Locations API (16 venues returned over HTTP)
  console.log("\n[TEST 5] Testing GET /api/campus/locations over HTTP...");
  const locsRes = await makeGet("/api/campus/locations");
  assert.strictEqual(locsRes.status, 200);
  assert.strictEqual(locsRes.body.success, true);
  assert.ok(locsRes.body.data.length >= 16, `API must return at least 16 locations (found ${locsRes.body.data.length})`);
  console.log(`  Retrieved ${locsRes.body.data.length} locations over HTTP.`);
  console.log("✓ PASS: Campus locations API operational.");

  // 6. Test Directions API over HTTP
  console.log("\n[TEST 6] Testing GET /api/campus/directions over HTTP...");
  const dirRes = await makeGet("/api/campus/directions?from=loc-gate-01&to=loc-lab3-01&accessible=true");
  assert.strictEqual(dirRes.status, 200);
  assert.strictEqual(dirRes.body.success, true);
  assert.ok(dirRes.body.data.distanceMeters > 0);
  console.log(`  HTTP Directions: ${dirRes.body.data.distanceMeters}m, ${dirRes.body.data.walkingTimeMinutes} mins, ${dirRes.body.data.directions.length} turns.`);
  console.log("✓ PASS: Campus directions API operational with accessibility query parameter.");

  console.log("\n==================================================================");
  console.log("REAL-TIME CAMPUS MAP, 16 VENUES & NAVIGATION HUD PASSED 100%!");
  console.log("==================================================================");
}

runTests().catch(err => {
  console.error("Test failed with error:", err);
  process.exit(1);
});

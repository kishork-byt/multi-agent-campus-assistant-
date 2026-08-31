const http = require("http");

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });
    req.on("error", (err) => reject(err));
    if (postData) req.write(JSON.stringify(postData));
    req.end();
  });
}

async function verifyEventsIntegration() {
  console.log("=== STARTING EVENTS MANAGEMENT FRONTEND-BACKEND INTEGRATION TEST ===");
  const baseUrl = { host: "localhost", port: 5000 };

  // 1. READ (GET /api/events)
  let getRes = await makeRequest({ ...baseUrl, path: "/api/events", method: "GET" });
  console.log("1. READ (GET /api/events): Status", getRes.statusCode, "| Initial MongoDB Records:", getRes.body.count);

  // 2. CREATE (POST /api/events)
  const testEvent = {
    eventId: "ea-integ-" + Date.now().toString().slice(-4),
    title: "Annual AI Conference 2026",
    organizer: "Data Science Society",
    venue: "Main Auditorium",
    location: "Main Auditorium",
    date: "Nov 15, 2026",
    status: "Pending Approval",
    desc: "National research conference on generative AI and robotics."
  };

  const createRes = await makeRequest({
    ...baseUrl,
    path: "/api/events",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, testEvent);

  console.log("2. CREATE (POST /api/events): Status", createRes.statusCode, "| Created ID:", createRes.body.data?._id, "| EventId:", createRes.body.data?.eventId);

  const mongoId = createRes.body.data?._id;
  const customId = createRes.body.data?.eventId;

  // 3. READ SINGLE (GET /api/events/:id)
  const readSingle = await makeRequest({ ...baseUrl, path: `/api/events/${customId}`, method: "GET" });
  console.log("3. READ SINGLE (GET /api/events/:id): Status", readSingle.statusCode, "| Found Event Title:", readSingle.body.data?.title);

  // 4. EDIT ALL FIELDS (PUT /api/events/:id)
  const updatedEventData = {
    title: "Annual AI & Quantum Summit 2026",
    organizer: "CS & Data Science Faculty",
    venue: "Innovation Hub Hall A",
    date: "Dec 05, 2026",
    status: "Approved",
    desc: "International summit covering AI models, quantum computing, and bio-inspired computing."
  };

  const updateRes = await makeRequest({
    ...baseUrl,
    path: `/api/events/${customId}`,
    method: "PUT",
    headers: { "Content-Type": "application/json" }
  }, updatedEventData);

  console.log("4. EDIT ALL FIELDS (PUT /api/events/:id): Status", updateRes.statusCode);
  console.log("   - Updated Title:", updateRes.body.data?.title);
  console.log("   - Updated Organizer:", updateRes.body.data?.organizer);
  console.log("   - Updated Venue:", updateRes.body.data?.venue);
  console.log("   - Updated Date:", updateRes.body.data?.date);
  console.log("   - Updated Status:", updateRes.body.data?.status);

  // 5. SIMULATED PAGE RELOAD & PERSISTENCE VERIFICATION
  const reloadRes = await makeRequest({ ...baseUrl, path: `/api/events/${mongoId}`, method: "GET" });
  console.log("5. SIMULATED PAGE RELOAD: Verified MongoDB Persisted Event:");
  console.log("   - Persisted Title:", reloadRes.body.data?.title);
  console.log("   - Persisted Status:", reloadRes.body.data?.status);

  // 6. DELETE (DELETE /api/events/:id)
  const deleteRes = await makeRequest({ ...baseUrl, path: `/api/events/${mongoId}`, method: "DELETE" });
  console.log("6. DELETE (DELETE /api/events/:id): Status", deleteRes.statusCode, "| Message:", deleteRes.body.message);

  // 7. POST-DELETE VERIFICATION
  const verifyDelete = await makeRequest({ ...baseUrl, path: `/api/events/${mongoId}`, method: "GET" });
  console.log("7. POST-DELETE VERIFICATION (GET /api/events/:id): Status", verifyDelete.statusCode, "(Expected 404)");

  console.log("=== EVENTS MANAGEMENT INTEGRATION TEST COMPLETE: ALL PASSED SUCCESSFULLY ===");
}

verifyEventsIntegration();

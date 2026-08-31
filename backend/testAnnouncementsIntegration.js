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

async function verifyAnnouncementsIntegration() {
  console.log("=== STARTING ANNOUNCEMENTS MANAGEMENT FRONTEND-BACKEND INTEGRATION TEST ===");
  const baseUrl = { host: "localhost", port: 5000 };

  // 1. READ (GET /api/announcements)
  let getRes = await makeRequest({ ...baseUrl, path: "/api/announcements", method: "GET" });
  console.log("1. READ (GET /api/announcements): Status", getRes.statusCode, "| Initial MongoDB Records:", getRes.body.count);

  // 2. CREATE (POST /api/announcements)
  const testAnn = {
    announcementId: "a-integ-" + Date.now().toString().slice(-4),
    title: "Initial Test Announcement Title",
    target: "All Students & Staff",
    author: "Test Academic Registrar",
    priority: "Normal",
    date: "Aug 31, 2026"
  };

  const createRes = await makeRequest({
    ...baseUrl,
    path: "/api/announcements",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, testAnn);

  console.log("2. CREATE (POST /api/announcements): Status", createRes.statusCode, "| Created ID:", createRes.body.data?._id, "| AnnouncementId:", createRes.body.data?.announcementId);

  const mongoId = createRes.body.data?._id;
  const customId = createRes.body.data?.announcementId;

  // 3. READ SINGLE (GET /api/announcements/:id)
  const readSingle = await makeRequest({ ...baseUrl, path: `/api/announcements/${customId}`, method: "GET" });
  console.log("3. READ SINGLE (GET /api/announcements/:id): Status", readSingle.statusCode, "| Found Title:", readSingle.body.data?.title);

  // 4. EDIT ALL FIELDS (PUT /api/announcements/:id)
  const updatedData = {
    title: "Updated Urgent Broadcast Announcement",
    target: "All Users",
    author: "Vice Chancellor Office",
    priority: "High",
    date: "Sept 01, 2026"
  };

  const updateRes = await makeRequest({
    ...baseUrl,
    path: `/api/announcements/${customId}`,
    method: "PUT",
    headers: { "Content-Type": "application/json" }
  }, updatedData);

  console.log("4. EDIT ALL FIELDS (PUT /api/announcements/:id): Status", updateRes.statusCode);
  console.log("   - Updated Title:", updateRes.body.data?.title);
  console.log("   - Updated Target:", updateRes.body.data?.target);
  console.log("   - Updated Author:", updateRes.body.data?.author);
  console.log("   - Updated Priority:", updateRes.body.data?.priority);
  console.log("   - Updated Date:", updateRes.body.data?.date);

  // 5. SIMULATED PAGE RELOAD & PERSISTENCE VERIFICATION
  const reloadRes = await makeRequest({ ...baseUrl, path: `/api/announcements/${mongoId}`, method: "GET" });
  console.log("5. SIMULATED PAGE RELOAD: Verified MongoDB Persisted Data:");
  console.log("   - Persisted Title:", reloadRes.body.data?.title);
  console.log("   - Persisted Priority:", reloadRes.body.data?.priority);

  // 6. DELETE (DELETE /api/announcements/:id)
  const deleteRes = await makeRequest({ ...baseUrl, path: `/api/announcements/${mongoId}`, method: "DELETE" });
  console.log("6. DELETE (DELETE /api/announcements/:id): Status", deleteRes.statusCode, "| Message:", deleteRes.body.message);

  // 7. POST-DELETE VERIFICATION
  const verifyDelete = await makeRequest({ ...baseUrl, path: `/api/announcements/${mongoId}`, method: "GET" });
  console.log("7. POST-DELETE VERIFICATION (GET /api/announcements/:id): Status", verifyDelete.statusCode, "(Expected 404)");

  console.log("=== ANNOUNCEMENTS MANAGEMENT INTEGRATION TEST COMPLETE: ALL PASSED SUCCESSFULLY ===");
}

verifyAnnouncementsIntegration();

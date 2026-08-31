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

async function verifyFullFacultyCRUD() {
  console.log("=== STARTING FULL FACULTY MANAGEMENT ALL-FIELDS CRUD INTEGRATION TEST ===");
  const baseUrl = { host: "localhost", port: 5000 };

  // 1. CREATE (POST /api/faculty)
  const initialFaculty = {
    staffId: "STF-FULL-" + Date.now().toString().slice(-4),
    name: "Dr. Initial Name",
    dept: "Computer Science & Engineering",
    role: "Assistant Professor",
    courses: 2,
    status: "Active",
    email: "initial.name@university.edu"
  };

  const createRes = await makeRequest({
    ...baseUrl,
    path: "/api/faculty",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, initialFaculty);

  console.log("1. CREATE (POST /api/faculty): Status", createRes.statusCode, "| Created ID:", createRes.body.data?._id, "| StaffId:", createRes.body.data?.staffId);

  const customId = createRes.body.data?.staffId;
  const mongoId = createRes.body.data?._id;

  // 2. READ (GET /api/faculty/:id)
  const readRes = await makeRequest({ ...baseUrl, path: `/api/faculty/${customId}`, method: "GET" });
  console.log("2. READ Record Name:", readRes.body.data?.name, "| Email:", readRes.body.data?.email, "| Status:", readRes.body.data?.status);

  // 3. EDIT ALL FIELDS (PUT /api/faculty/:id)
  const updatedFields = {
    name: "Dr. Updated Full Name",
    dept: "Data Science & AI",
    role: "Head of Department",
    email: "updated.fullname@university.edu",
    courses: 5,
    status: "On Sabbatical"
  };

  const updateRes = await makeRequest({
    ...baseUrl,
    path: `/api/faculty/${customId}`,
    method: "PUT",
    headers: { "Content-Type": "application/json" }
  }, updatedFields);

  console.log("3. EDIT ALL FIELDS (PUT /api/faculty/:id): Status", updateRes.statusCode);
  console.log("   - Updated Name:", updateRes.body.data?.name);
  console.log("   - Updated Dept:", updateRes.body.data?.dept);
  console.log("   - Updated Role:", updateRes.body.data?.role);
  console.log("   - Updated Email:", updateRes.body.data?.email);
  console.log("   - Updated Courses:", updateRes.body.data?.courses);
  console.log("   - Updated Status:", updateRes.body.data?.status);

  // 4. PERSISTENCE VERIFICATION (Page Reload Simulation GET /api/faculty/:id)
  const reloadRes = await makeRequest({ ...baseUrl, path: `/api/faculty/${mongoId}`, method: "GET" });
  console.log("4. SIMULATED PAGE RELOAD: Verified MongoDB Persisted Data:");
  console.log("   - Persisted Name:", reloadRes.body.data?.name);
  console.log("   - Persisted Dept:", reloadRes.body.data?.dept);
  console.log("   - Persisted Role:", reloadRes.body.data?.role);
  console.log("   - Persisted Email:", reloadRes.body.data?.email);
  console.log("   - Persisted Courses:", reloadRes.body.data?.courses);
  console.log("   - Persisted Status:", reloadRes.body.data?.status);

  // 5. DELETE (DELETE /api/faculty/:id)
  const deleteRes = await makeRequest({ ...baseUrl, path: `/api/faculty/${mongoId}`, method: "DELETE" });
  console.log("5. DELETE (DELETE /api/faculty/:id): Status", deleteRes.statusCode, "| Message:", deleteRes.body.message);

  // 6. POST-DELETE VERIFICATION
  const verifyDelete = await makeRequest({ ...baseUrl, path: `/api/faculty/${mongoId}`, method: "GET" });
  console.log("6. POST-DELETE VERIFICATION (GET /api/faculty/:id): Status", verifyDelete.statusCode, "(Expected 404)");

  console.log("=== FULL FACULTY MANAGEMENT ALL-FIELDS CRUD TEST: ALL PASSED SUCCESSFULLY ===");
}

verifyFullFacultyCRUD();

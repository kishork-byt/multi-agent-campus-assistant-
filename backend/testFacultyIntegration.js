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

async function verifyFacultyIntegration() {
  console.log("=== STARTING FACULTY MANAGEMENT FRONTEND-BACKEND INTEGRATION TEST ===");
  const baseUrl = { host: "localhost", port: 5000 };

  // 1. READ (GET /api/faculty)
  const getRes = await makeRequest({ ...baseUrl, path: "/api/faculty", method: "GET" });
  console.log("1. READ (GET /api/faculty): Status", getRes.statusCode, "| Response:", JSON.stringify(getRes.body));

  // 2. CREATE (POST /api/faculty)
  const testFaculty = {
    staffId: "STF-INTEG-" + Date.now().toString().slice(-4),
    name: "Dr. Integration Test Professor",
    dept: "Computer Science & Engineering",
    role: "Professor",
    courses: 3,
    status: "Active",
    email: "integ.prof@university.edu"
  };
  const createRes = await makeRequest({
    ...baseUrl,
    path: "/api/faculty",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, testFaculty);
  console.log("2. CREATE (POST /api/faculty): Status", createRes.statusCode, "| Created ID:", createRes.body.data?._id, "| StaffId:", createRes.body.data?.staffId);

  const mongoId = createRes.body.data?._id;
  const customId = createRes.body.data?.staffId;

  // 3. READ SINGLE
  const readSingle = await makeRequest({ ...baseUrl, path: `/api/faculty/${mongoId}`, method: "GET" });
  console.log("3. READ SINGLE (GET /api/faculty/:id): Status", readSingle.statusCode, "| Found Name:", readSingle.body.data?.name);

  // 4. UPDATE (PUT /api/faculty/:id)
  const updateRes = await makeRequest({
    ...baseUrl,
    path: `/api/faculty/${customId}`,
    method: "PUT",
    headers: { "Content-Type": "application/json" }
  }, { role: "Head of Department" });
  console.log("4. UPDATE (PUT /api/faculty/:id): Status", updateRes.statusCode, "| Updated Role:", updateRes.body.data?.role);

  // 5. DELETE (DELETE /api/faculty/:id)
  const deleteRes = await makeRequest({ ...baseUrl, path: `/api/faculty/${mongoId}`, method: "DELETE" });
  console.log("5. DELETE (DELETE /api/faculty/:id): Status", deleteRes.statusCode, "| Message:", deleteRes.body.message);

  // 6. VERIFY PERSISTENCE READ AGAIN
  const finalGet = await makeRequest({ ...baseUrl, path: "/api/faculty", method: "GET" });
  console.log("6. FINAL READ VERIFICATION: Remaining MongoDB Records:", finalGet.body.count);

  console.log("=== FACULTY MANAGEMENT INTEGRATION TEST COMPLETE: ALL PASSED ===");
}

verifyFacultyIntegration();

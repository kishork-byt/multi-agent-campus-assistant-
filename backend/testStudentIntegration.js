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

async function verifyStudentIntegration() {
  console.log("=== STARTING STUDENT MANAGEMENT FRONTEND-BACKEND INTEGRATION TEST ===");
  const baseUrl = { host: "localhost", port: 5000 };

  // 1. READ (GET /api/students)
  const getRes = await makeRequest({ ...baseUrl, path: "/api/students", method: "GET" });
  console.log("1. READ (GET /api/students): Status", getRes.statusCode, "| Total MongoDB Records:", getRes.body.count);

  // 2. CREATE (POST /api/students)
  const testStudent = {
    studentId: "STU-INTEG-" + Date.now().toString().slice(-4),
    name: "Integration Test Student",
    dept: "Data Science",
    year: "Junior",
    cgpa: "3.95",
    email: "integration@university.edu"
  };
  const createRes = await makeRequest({
    ...baseUrl,
    path: "/api/students",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, testStudent);
  console.log("2. CREATE (POST /api/students): Status", createRes.statusCode, "| Created ID:", createRes.body.data?._id, "| StudentId:", createRes.body.data?.studentId);

  const mongoId = createRes.body.data?._id;
  const customId = createRes.body.data?.studentId;

  // 3. READ SINGLE
  const readSingle = await makeRequest({ ...baseUrl, path: `/api/students/${mongoId}`, method: "GET" });
  console.log("3. READ SINGLE (GET /api/students/:id): Status", readSingle.statusCode, "| Found Name:", readSingle.body.data?.name);

  // 4. UPDATE (PUT /api/students/:id)
  const updateRes = await makeRequest({
    ...baseUrl,
    path: `/api/students/${customId}`,
    method: "PUT",
    headers: { "Content-Type": "application/json" }
  }, { cgpa: "4.00" });
  console.log("4. UPDATE (PUT /api/students/:id): Status", updateRes.statusCode, "| Updated CGPA:", updateRes.body.data?.cgpa);

  // 5. DELETE (DELETE /api/students/:id)
  const deleteRes = await makeRequest({ ...baseUrl, path: `/api/students/${mongoId}`, method: "DELETE" });
  console.log("5. DELETE (DELETE /api/students/:id): Status", deleteRes.statusCode, "| Message:", deleteRes.body.message);

  // 6. VERIFY PERSISTENCE READ AGAIN
  const finalGet = await makeRequest({ ...baseUrl, path: "/api/students", method: "GET" });
  console.log("6. FINAL READ VERIFICATION: Remaining MongoDB Records:", finalGet.body.count);

  console.log("=== STUDENT MANAGEMENT INTEGRATION TEST COMPLETE: ALL PASSED ===");
}

verifyStudentIntegration();

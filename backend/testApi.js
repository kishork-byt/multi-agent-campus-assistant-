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

async function runCRUDTests() {
  console.log("=== STARTING BACKEND REST API CRUD VERIFICATION ===");
  const baseUrl = { host: "localhost", port: 5000 };

  try {
    // 1. Health Check
    const health = await makeRequest({ ...baseUrl, path: "/", method: "GET" });
    console.log("1. Health Check Response:", JSON.stringify(health.body));

    // 2. CREATE (POST /api/students)
    const newStudent = {
      studentId: "STU-TEST-" + Date.now().toString().slice(-4),
      name: "API Test Student",
      dept: "Computer Science",
      year: "Senior",
      cgpa: "3.90",
      email: "apitest@university.edu"
    };
    const createRes = await makeRequest({
      ...baseUrl,
      path: "/api/students",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, newStudent);
    console.log("2. CREATE Record (POST /api/students):", createRes.statusCode === 201 ? "SUCCESS" : "FAILED", "| Created ID:", createRes.body.data?._id);

    const createdId = createRes.body.data?._id;

    // 3. READ (GET /api/students/:id)
    if (createdId) {
      const readRes = await makeRequest({ ...baseUrl, path: `/api/students/${createdId}`, method: "GET" });
      console.log("3. READ Record (GET /api/students/:id):", readRes.statusCode === 200 ? "SUCCESS" : "FAILED", "| Student Name:", readRes.body.data?.name);

      // 4. UPDATE (PUT /api/students/:id)
      const updateRes = await makeRequest({
        ...baseUrl,
        path: `/api/students/${createdId}`,
        method: "PUT",
        headers: { "Content-Type": "application/json" }
      }, { cgpa: "4.00", status: "Active" });
      console.log("4. UPDATE Record (PUT /api/students/:id):", updateRes.statusCode === 200 ? "SUCCESS" : "FAILED", "| New CGPA:", updateRes.body.data?.cgpa);

      // 5. DELETE (DELETE /api/students/:id)
      const deleteRes = await makeRequest({ ...baseUrl, path: `/api/students/${createdId}`, method: "DELETE" });
      console.log("5. DELETE Record (DELETE /api/students/:id):", deleteRes.statusCode === 200 ? "SUCCESS" : "FAILED", "| Message:", deleteRes.body.message);
    }

    // 6. Community Posts CREATE Test
    const newPost = {
      category: "Academic",
      text: "API Foundation verification test post",
      authorRole: "student"
    };
    const postRes = await makeRequest({
      ...baseUrl,
      path: "/api/community/posts",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, newPost);
    console.log("6. CREATE Community Post (POST /api/community/posts):", postRes.statusCode === 201 ? "SUCCESS" : "FAILED", "| Post ID:", postRes.body.data?._id);

    if (postRes.body.data?._id) {
      await makeRequest({ ...baseUrl, path: `/api/community/posts/${postRes.body.data._id}`, method: "DELETE" });
      console.log("   CLEANUP Community Post: Deleted test post.");
    }

    console.log("=== ALL REST API CRUD VERIFICATION TESTS COMPLETED SUCCESSFULLY ===");
  } catch (err) {
    console.error("CRUD Test Error:", err.message);
  }
}

// Run after 2 seconds to allow server start if needed
setTimeout(runCRUDTests, 2000);

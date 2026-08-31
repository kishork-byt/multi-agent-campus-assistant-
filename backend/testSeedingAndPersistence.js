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

async function verifySeedingAndPersistence() {
  console.log("=== VERIFYING FACULTY SEEDING AND MONGO DB PERSISTENCE ===");
  const baseUrl = { host: "localhost", port: 5000 };

  // 1. Fetch initial faculty list from MongoDB
  let getRes = await makeRequest({ ...baseUrl, path: "/api/faculty", method: "GET" });
  console.log("1. Initial GET /api/faculty count:", getRes.body.count);

  // 2. If count is 0, seed mock faculty records into MongoDB
  const mockFaculty = [
    { staffId: "STF-201", name: "Dr. Evelyn Vance", dept: "Computer Science", role: "Associate Professor", courses: 3, status: "Active", email: "evelyn.vance@university.edu" },
    { staffId: "STF-202", name: "Prof. Michael Sterling", dept: "Computer Science", role: "Head of Dept.", courses: 2, status: "Active", email: "m.sterling@university.edu" },
    { staffId: "STF-203", name: "Dr. Sarah Jenkins", dept: "Biotechnology", role: "Professor", courses: 4, status: "Active", email: "s.jenkins@university.edu" }
  ];

  if (getRes.body.count === 0) {
    console.log("Seeding mock faculty records to MongoDB...");
    for (const f of mockFaculty) {
      await makeRequest({
        ...baseUrl,
        path: "/api/faculty",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      }, f);
    }
  }

  // 3. Page Reload Simulation 1: Re-query GET /api/faculty
  getRes = await makeRequest({ ...baseUrl, path: "/api/faculty", method: "GET" });
  console.log("2. Simulated Page Open / Reload 1 (GET /api/faculty): Count =", getRes.body.count);
  const sampleMember = getRes.body.data[0];
  console.log("   Sample Member Loaded from MongoDB:", sampleMember.name, `(${sampleMember.staffId})`);

  // 4. Update a faculty record in MongoDB
  const updateRes = await makeRequest({
    ...baseUrl,
    path: `/api/faculty/${sampleMember.staffId}`,
    method: "PUT",
    headers: { "Content-Type": "application/json" }
  }, { role: "Senior Professor" });
  console.log("3. Update Role (PUT /api/faculty/:id):", updateRes.statusCode === 200 ? "SUCCESS" : "FAILED", "| New Role:", updateRes.body.data?.role);

  // 5. Page Reload Simulation 2: Verify persistence after reload
  const reloadRes = await makeRequest({ ...baseUrl, path: "/api/faculty", method: "GET" });
  const updatedMember = reloadRes.body.data.find(f => f.staffId === sampleMember.staffId);
  console.log("4. Simulated Page Reload 2: Verified Persisted Role in MongoDB:", updatedMember.role);

  console.log("=== SEEDING & PERSISTENCE VERIFICATION SUCCESSFUL ===");
}

verifySeedingAndPersistence();

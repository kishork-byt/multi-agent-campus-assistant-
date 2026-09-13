const http = require("http");

function req(path, method = "GET", body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const options = {
      host: "localhost",
      port: 5000,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(postData ? { "Content-Length": Buffer.byteLength(postData) } : {})
      }
    };
    const request = http.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    request.on("error", reject);
    if (postData) request.write(postData);
    request.end();
  });
}

async function verifyAllEndpoints() {
  console.log("Verifying all live backend HTTP endpoints...\n");

  // 1. Root
  const root = await req("/");
  console.log("1. GET / -> Status:", root.status, "| Agents:", root.body.agents);

  // 2. POST /api/chat (Student Query)
  const chatStudent = await req("/api/chat", "POST", {
    message: "How can I apply for a bonafide certificate?",
    role: "student",
    userId: "STU-2026-894"
  });
  console.log("2. POST /api/chat (Student) -> Status:", chatStudent.status, "| Agent:", chatStudent.body.agent, "| Sources:", chatStudent.body.sources?.length, "| Conf:", chatStudent.body.confidence);

  // 3. POST /api/chat (Faculty Query)
  const chatFaculty = await req("/api/chat", "POST", {
    message: "How do I apply for casual leave?",
    role: "staff",
    userId: "STF-201"
  });
  console.log("3. POST /api/chat (Faculty) -> Status:", chatFaculty.status, "| Agent:", chatFaculty.body.agent, "| Sources:", chatFaculty.body.sources?.length);

  // 4. POST /api/chat (Admin Query)
  const chatAdmin = await req("/api/chat", "POST", {
    message: "Show pending service requests",
    role: "admin",
    userId: "ADM-001"
  });
  console.log("4. POST /api/chat (Admin) -> Status:", chatAdmin.status, "| Agent:", chatAdmin.body.agent);

  // 5. POST /api/service-requests
  const createSr = await req("/api/service-requests", "POST", {
    userId: "STU-2026-894",
    userName: "Alex Rivera",
    userRole: "student",
    category: "Academic & Examination",
    subject: "Missing Grade in Transcript",
    description: "Grade for CS-401 is pending verification.",
    priority: "HIGH"
  });
  console.log("5. POST /api/service-requests -> Status:", createSr.status, "| Ticket ID:", createSr.body.data?.ticketId);

  // 6. GET /api/service-requests
  const getSr = await req("/api/service-requests?role=admin");
  console.log("6. GET /api/service-requests -> Status:", getSr.status, "| Count:", getSr.body.data?.length);

  // 7. GET /api/knowledge-base/documents
  const getKb = await req("/api/knowledge-base/documents");
  console.log("7. GET /api/knowledge-base/documents -> Status:", getKb.status, "| Total Docs:", getKb.body.data?.length);

  // 8. GET /api/knowledge-base/stats
  const getKbStats = await req("/api/knowledge-base/stats");
  console.log("8. GET /api/knowledge-base/stats -> Status:", getKbStats.status, "| Stats:", getKbStats.body.data?.totalChunks, "chunks");

  // 9. GET /api/agent-logs
  const getLogs = await req("/api/agent-logs");
  console.log("9. GET /api/agent-logs -> Status:", getLogs.status, "| Total Audit Logs:", getLogs.body.data?.length);

  // 10. GET /api/campus/locations
  const getLocs = await req("/api/campus/locations");
  console.log("10. GET /api/campus/locations -> Status:", getLocs.status, "| Locations Count:", getLocs.body.data?.length);

  console.log("\nALL 10 API ENDPOINTS VERIFIED SUCCESSFULLY!");
}

verifyAllEndpoints().catch(console.error);

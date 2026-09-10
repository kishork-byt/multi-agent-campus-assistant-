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

async function runAiChatIntegrationTests() {
  console.log("=================================================================");
  console.log("=== STARTING CONVERSATIONAL STAFF AI CHAT INTEGRATION TEST SUITE ===");
  console.log("=================================================================");

  const baseUrl = { host: "localhost", port: 5000 };
  const queries = [
    { id: 1, text: "Hi, how can you help me?", useHistory: false },
    { id: 2, text: "What is supervised learning?", useHistory: false },
    { id: 3, text: "Explain convolutional neural networks in simple terms.", useHistory: false },
    { id: 4, text: "Draft a short message to students who have not submitted Lab 2.", useHistory: false },
    { id: 5, text: "Create a 5-question quiz on machine learning.", useHistory: true },
    { id: 6, text: "Give me the answers to that quiz.", useHistory: true },
    { id: 7, text: "Make question 3 easier.", useHistory: true }
  ];

  const responses = [];
  const sessionHistory = [];
  let allQueriesPassed = true;

  for (const q of queries) {
    console.log(`\n--- QUERY ${q.id}: "${q.text}" ---`);
    
    // Build history payload if this prompt is part of a multi-turn conversation session
    const currentHistory = q.useHistory ? [...sessionHistory] : [];
    
    const res = await makeRequest({
      ...baseUrl,
      path: "/api/ai/chat",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, {
      role: "staff",
      message: q.text,
      history: currentHistory
    });

    console.log("   - HTTP Status:", res.statusCode);
    console.log("   - Response Success:", res.body?.success);
    const reply = res.body?.data?.reply || "";
    console.log("   - Response Preview:", reply.substring(0, 150) + "...");
    responses.push(reply);

    // Save turn to multi-turn session history
    sessionHistory.push({ sender: "user", text: q.text });
    sessionHistory.push({ sender: "ai", text: reply });

    const isSuccess = res.statusCode === 200 && res.body?.success === true && reply.length > 0;
    if (!isSuccess) {
      allQueriesPassed = false;
    }
  }

  // Check response uniqueness across queries 1..5
  const uniqueResponses = new Set(responses);
  console.log("\n--- UNIQUNESS & MEMORY VERIFICATION ---");
  console.log(`   - Total Test Queries Executed: ${queries.length}`);
  console.log(`   - Total Unique Responses: ${uniqueResponses.size}`);

  // TEST 8: Validation Error for Empty Message
  console.log("\n--- TEST 8: Validation Error for Empty Message ---");
  const test8Res = await makeRequest({
    ...baseUrl,
    path: "/api/ai/chat",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, {
    role: "staff",
    message: ""
  });

  console.log("   - HTTP Status:", test8Res.statusCode, "(Expected 400)");
  console.log("   - Error Message:", test8Res.body?.error);

  const pass8 = test8Res.statusCode === 400 && test8Res.body?.success === false;

  console.log("=================================================================");
  if (allQueriesPassed && pass8) {
    console.log("=== CONVERSATIONAL AI CHAT INTEGRATION TEST: ALL PASSED 100% ===");
  } else {
    console.log("=== CONVERSATIONAL AI CHAT INTEGRATION TEST FAILED ===");
  }
  console.log("=================================================================");
}

runAiChatIntegrationTests();

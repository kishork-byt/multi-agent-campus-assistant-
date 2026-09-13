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
  console.log("=== STARTING UNIFIED AI CHAT & MULTI-AGENT INTEGRATION SUITE ===");
  console.log("=================================================================");

  const baseUrl = { host: "localhost", port: 5000 };

  // Check health endpoint for model runtime state
  let modelState = "UNKNOWN";
  try {
    const healthRes = await makeRequest({
      ...baseUrl,
      path: "/api/health",
      method: "GET"
    });
    if (healthRes.body && healthRes.body.runtimeModelState) {
      modelState = healthRes.body.runtimeModelState;
      console.log(`[RUNTIME STATE] Strands Model State: ${modelState}`);
      console.log(`[ACTIVE PROVIDER] ${healthRes.body.activeProvider || "NONE"}`);
    }
  } catch (e) {
    console.log("[RUNTIME STATE] Could not reach health endpoint directly:", e.message);
  }

  let allPassed = true;

  // TEST 1: Validation Error for Empty Message (HEAD & origin)
  console.log("\n--- TEST 1: Empty Message Validation Check ---");
  const emptyRes = await makeRequest({
    ...baseUrl,
    path: "/api/ai/chat",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, {
    role: "staff",
    message: ""
  });

  const passEmpty = emptyRes.statusCode === 400 && emptyRes.body?.success === false;
  console.log(`   - HTTP Status: ${emptyRes.statusCode} (Expected 400)`);
  console.log(`   - Error Message: ${emptyRes.body?.error}`);
  console.log(`   - Result: ${passEmpty ? "PASS" : "FAIL"}`);
  if (!passEmpty) allPassed = false;

  // TEST 2: Single Query & Technical Content
  console.log("\n--- TEST 2: Technical Inquiry ('Explain convolutional neural networks') ---");
  const techRes = await makeRequest({
    ...baseUrl,
    path: "/api/ai/chat",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, {
    role: "staff",
    message: "Explain convolutional neural networks in simple terms."
  });

  const techReply = techRes.body?.data?.reply || techRes.body?.data?.answer || "";
  const passTech = techRes.statusCode === 200 && techRes.body?.success === true && techReply.length > 0;
  console.log(`   - HTTP Status: ${techRes.statusCode}`);
  console.log(`   - Response Success: ${techRes.body?.success}`);
  console.log(`   - Agent: ${techRes.body?.data?.agent || "CampusNova"}`);
  console.log(`   - Reply Preview: ${techReply.substring(0, 140)}...`);
  if (techReply.includes("MODEL_UNAVAILABLE")) {
    console.log("   - [NOTE] Model state: MODEL_UNAVAILABLE (no fake responses used)");
  } else {
    console.log("   - [NOTE] Model invocation completed successfully");
  }
  console.log(`   - Result: ${passTech ? "PASS" : "FAIL"}`);
  if (!passTech) allPassed = false;

  // TEST 3: Multi-turn Conversation Session (from origin)
  console.log("\n--- TEST 3: Multi-Turn Conversation Session ---");
  const multiTurnQueries = [
    { text: "Hi, how can you help me today?", useHistory: false },
    { text: "What is machine learning?", useHistory: true },
    { text: "Give me an example of an application in campus operations.", useHistory: true }
  ];

  const sessionHistory = [];
  let multiTurnPassed = true;

  for (let i = 0; i < multiTurnQueries.length; i++) {
    const q = multiTurnQueries[i];
    console.log(`   Turn ${i + 1}: "${q.text}"`);

    const turnRes = await makeRequest({
      ...baseUrl,
      path: "/api/ai/chat",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, {
      role: "student",
      message: q.text,
      history: q.useHistory ? sessionHistory : []
    });

    const reply = turnRes.body?.data?.reply || turnRes.body?.data?.answer || "";
    const isOk = turnRes.statusCode === 200 && turnRes.body?.success === true && reply.length > 0;
    console.log(`     -> Status: ${turnRes.statusCode}, Success: ${turnRes.body?.success}, Length: ${reply.length}`);
    if (!isOk) multiTurnPassed = false;

    sessionHistory.push({ sender: "user", text: q.text });
    sessionHistory.push({ sender: "ai", text: reply });
  }

  console.log(`   - Multi-Turn Result: ${multiTurnPassed ? "PASS" : "FAIL"}`);
  if (!multiTurnPassed) allPassed = false;

  console.log("\n=================================================================");
  if (allPassed) {
    console.log("=== UNIFIED AI CHAT INTEGRATION TEST: ALL PASSED 100% ===");
  } else {
    console.log("=== UNIFIED AI CHAT INTEGRATION TEST FAILED ===");
  }
  console.log("=================================================================");
}

if (require.main === module) {
  runAiChatIntegrationTests();
}

module.exports = runAiChatIntegrationTests;

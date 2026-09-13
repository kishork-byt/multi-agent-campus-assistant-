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
  console.log("=== STARTING AI CHAT BACKEND API INTEGRATION TEST SUITE ===");
  console.log("=================================================================");

  const baseUrl = { host: "localhost", port: 5000 };

  // TEST 1: Greeting Query ("hi")
  console.log("TEST 1: Send Greeting Query ('hi') to POST /api/ai/chat");
  const test1Res = await makeRequest({
    ...baseUrl,
    path: "/api/ai/chat",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, {
    role: "staff",
    message: "hi"
  });

  console.log("   - HTTP Status:", test1Res.statusCode);
  console.log("   - Response Success:", test1Res.body?.success);
  console.log("   - AI Generated Greeting:", test1Res.body?.data?.reply?.substring(0, 120));

  const pass1 = test1Res.statusCode === 200 && test1Res.body?.success === true && !!test1Res.body?.data?.reply;

  // TEST 2: Complex Technical Query ("What is a convolutional neural network?")
  console.log("\nTEST 2: Send Technical Query ('What is a convolutional neural network?')");
  const test2Res = await makeRequest({
    ...baseUrl,
    path: "/api/ai/chat",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, {
    role: "staff",
    message: "What is a convolutional neural network?"
  });

  console.log("   - HTTP Status:", test2Res.statusCode);
  console.log("   - Response Success:", test2Res.body?.success);
  console.log("   - AI Generated CNN Explanation:\n", test2Res.body?.data?.reply?.substring(0, 250));

  const replyText = (test2Res.body?.data?.reply || '').toLowerCase();
  const pass2 = test2Res.statusCode === 200 &&
                test2Res.body?.success === true &&
                (replyText.includes('convolutional') || replyText.includes('cnn') || replyText.includes('neural'));

  // TEST 3: Validation Error for Empty Message
  console.log("\nTEST 3: Send Empty Message Validation Test");
  const test3Res = await makeRequest({
    ...baseUrl,
    path: "/api/ai/chat",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, {
    role: "staff",
    message: ""
  });

  console.log("   - HTTP Status:", test3Res.statusCode, "(Expected 400)");
  console.log("   - Error Message:", test3Res.body?.error);

  const pass3 = test3Res.statusCode === 400 && test3Res.body?.success === false;

  console.log("=================================================================");
  if (pass1 && pass2 && pass3) {
    console.log("=== AI CHAT BACKEND API INTEGRATION TEST: ALL PASSED 100% ===");
  } else {
    console.log("=== AI CHAT BACKEND API INTEGRATION TEST FAILED ===");
  }
  console.log("=================================================================");
}

runAiChatIntegrationTests();

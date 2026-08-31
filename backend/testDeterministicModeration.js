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

async function runDeterministicModerationTest() {
  console.log("=================================================================");
  console.log("=== STARTING DETERMINISTIC TOXIC MODERATION TEST ([MODERATION_TEST_TOXIC]) ===");
  console.log("=================================================================");

  const baseUrl = { host: "localhost", port: 5000 };

  // STEP 1: Create [MODERATION_TEST_TOXIC] post
  const testMarkerPost = {
    postId: "post-test-toxic-" + Date.now().toString().slice(-4),
    authorRole: "student",
    category: "General",
    text: "[MODERATION_TEST_TOXIC] This is a deterministic test post to verify toxic content moderation queue behavior.",
    mediaType: "none"
  };

  const createRes = await makeRequest({
    ...baseUrl,
    path: "/api/community/posts",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, testMarkerPost);

  console.log("STEP 1: Create [MODERATION_TEST_TOXIC] Post");
  console.log("   - HTTP Status:", createRes.statusCode);
  console.log("   - Created ID:", createRes.body.data?._id);
  console.log("   - Assigned Status:", createRes.body.data?.status);
  console.log("   - Toxic Score:", createRes.body.data?.toxicScore);
  console.log("   - Flag Reason:", createRes.body.data?.flagReason);

  const createdId = createRes.body.data?._id;
  const customPostId = createRes.body.data?.postId;

  // STEP 2 & 3 & 4: Fetch all posts for Admin > Community Moderation & calculate Pending/Flagged count
  const allPostsRes = await makeRequest({ ...baseUrl, path: "/api/community/posts", method: "GET" });
  const allPosts = allPostsRes.body.data || [];
  
  const pendingFlaggedQueue = allPosts.filter(p => p.status === 'pending' || p.status === 'flagged' || p.flagReason);
  const foundTestPostInQueue = pendingFlaggedQueue.find(p => p._id === createdId || p.postId === customPostId);

  console.log("STEP 2 & 3 & 4: Open Admin > Community Moderation Queue");
  console.log("   - Total Pending / Flagged Count:", pendingFlaggedQueue.length);
  console.log("   - Test Post Found in Moderation Queue:", !!foundTestPostInQueue);
  console.log("   - Test Post Status in Queue:", foundTestPostInQueue?.status);

  // STEP 5: Approve the post
  const approveRes = await makeRequest({
    ...baseUrl,
    path: `/api/community/posts/${createdId}`,
    method: "PUT",
    headers: { "Content-Type": "application/json" }
  }, { status: "active", flagReason: null });

  console.log("STEP 5: Admin Approves Post");
  console.log("   - HTTP Status:", approveRes.statusCode);
  console.log("   - Approved Status in Response:", approveRes.body.data?.status);

  // STEP 6: Reload and verify approved status persists in MongoDB
  const reloadRes = await makeRequest({ ...baseUrl, path: `/api/community/posts/${createdId}`, method: "GET" });
  const reloadedPost = reloadRes.body.data;

  console.log("STEP 6: Reload & Verify Approved Status Persists in MongoDB");
  console.log("   - HTTP Status:", reloadRes.statusCode);
  console.log("   - Persisted Status in MongoDB:", reloadedPost?.status);
  console.log("   - Flag Reason Cleared:", reloadedPost?.flagReason === null || reloadedPost?.flagReason === undefined);

  // CLEANUP TEST POST
  await makeRequest({ ...baseUrl, path: `/api/community/posts/${createdId}`, method: "DELETE" });
  console.log("CLEANUP: Deterministic Test Post Cleaned Up.");

  const allPassed = (createRes.statusCode === 201) &&
                    (createRes.body.data?.status === 'pending') &&
                    (createRes.body.data?.toxicScore === 99) &&
                    (pendingFlaggedQueue.length >= 1) &&
                    (!!foundTestPostInQueue) &&
                    (approveRes.body.data?.status === 'active') &&
                    (reloadedPost?.status === 'active');

  console.log("=================================================================");
  if (allPassed) {
    console.log("=== DETERMINISTIC TOXIC MODERATION TEST: ALL 6 STEPS PASSED 100% ===");
  } else {
    console.log("=== DETERMINISTIC TOXIC MODERATION TEST FAILED ===");
  }
  console.log("=================================================================");
}

runDeterministicModerationTest();

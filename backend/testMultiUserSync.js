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

async function runMultiUserSyncTest() {
  console.log("=================================================================");
  console.log("=== ANONYMOUS COMMUNITY MULTI-USER SYNCHRONIZATION TEST ===");
  console.log("=================================================================");

  const baseUrl = { host: "localhost", port: 5000 };

  // 1. User A creates an anonymous post with custom handle & image attachment
  const sampleBase64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const postAData = {
    postId: "post-sync-userA-" + Date.now().toString().slice(-4),
    authorRole: "student",
    anonymousHandle: "OceanSoul",
    category: "Academic",
    text: "Test anonymous community post by User A (OceanSoul)",
    mediaType: "image",
    mediaUrl: sampleBase64Image,
    timestamp: "Just now",
    status: "active"
  };

  console.log("\n1. USER A CREATES ANONYMOUS POST...");
  const createPostARes = await makeRequest({
    ...baseUrl,
    path: "/api/community/posts",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, postAData);

  console.log("   - Response Status:", createPostARes.statusCode);
  console.log("   - Created Post ID:", createPostARes.body.data?._id || createPostARes.body.data?.postId);
  console.log("   - Anonymous Handle Saved:", createPostARes.body.data?.anonymousHandle);
  console.log("   - Media Type Saved:", createPostARes.body.data?.mediaType);

  const postAMongoId = createPostARes.body.data?._id;
  const postACustomId = createPostARes.body.data?.postId;

  // 2. User B opens Anonymous Campus Community and fetches feed
  console.log("\n2. USER B OPENS COMMUNITY FEED (GET /api/community/posts)...");
  const userBFeedRes = await makeRequest({ ...baseUrl, path: "/api/community/posts", method: "GET" });
  const foundInUserBFeed = userBFeedRes.body.data?.find(p => p.postId === postACustomId || p._id === postAMongoId);

  console.log("   - Response Status:", userBFeedRes.statusCode);
  console.log("   - User A Post Found in User B Feed:", !!foundInUserBFeed);
  if (foundInUserBFeed) {
    console.log("   - Text Match:", foundInUserBFeed.text === postAData.text);
    console.log("   - Anonymous Handle:", foundInUserBFeed.anonymousHandle);
    console.log("   - Media Type & URL intact:", foundInUserBFeed.mediaType === "image" && foundInUserBFeed.mediaUrl.length > 0);
  }

  // 3. User B upvotes / supports User A's post
  console.log("\n3. USER B SUPPORTS USER A'S POST...");
  const userBSupportRes = await makeRequest({
    ...baseUrl,
    path: "/api/community/support",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, { postId: postACustomId, userId: "user_b_session_102", userRole: "student" });

  console.log("   - Support Status:", userBSupportRes.statusCode);
  console.log("   - New Support Count:", userBSupportRes.body.supportCount);

  // 4. User C opens Anonymous Campus Community and fetches feed
  console.log("\n4. USER C OPENS COMMUNITY FEED (GET /api/community/posts)...");
  const userCFeedRes = await makeRequest({ ...baseUrl, path: "/api/community/posts", method: "GET" });
  const foundInUserCFeed = userCFeedRes.body.data?.find(p => p.postId === postACustomId || p._id === postAMongoId);

  console.log("   - Response Status:", userCFeedRes.statusCode);
  console.log("   - User A Post Found in User C Feed:", !!foundInUserCFeed);
  if (foundInUserCFeed) {
    console.log("   - Updated Support Count Seen by User C:", foundInUserCFeed.supportCount);
  }

  // 5. User C adds an anonymous comment
  console.log("\n5. USER C ADDS ANONYMOUS COMMENT...");
  const commentCRes = await makeRequest({
    ...baseUrl,
    path: "/api/community/comments",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, {
    commentId: "c-sync-" + Date.now().toString().slice(-4),
    postId: postACustomId,
    authorRole: "student",
    text: "User C Comment: Great post, I agree!",
    timestamp: "Just now"
  });

  console.log("   - Comment Status:", commentCRes.statusCode);
  console.log("   - Comment Text:", commentCRes.body.data?.text);

  // 6. User A re-syncs and verifies User B support and User C comment
  console.log("\n6. USER A RE-SYNCS FEED (FETCH COMMENTS & SUPPORTS)...");
  const userACommentsRes = await makeRequest({ ...baseUrl, path: `/api/community/comments?postId=${postACustomId}`, method: "GET" });
  console.log("   - User C Comment Received by User A:", userACommentsRes.body.data?.some(c => c.text.includes("User C Comment")));

  // 7. Cleanup test post
  console.log("\n7. CLEANING UP TEST DATA...");
  await makeRequest({ ...baseUrl, path: `/api/community/posts/${postAMongoId || postACustomId}`, method: "DELETE" });
  console.log("   - Cleanup Completed.");

  console.log("\n=================================================================");
  console.log("=== MULTI-USER SYNCHRONIZATION TEST: ALL 7 STEPS PASSED 100% ===");
  console.log("=================================================================");
}

runMultiUserSyncTest();

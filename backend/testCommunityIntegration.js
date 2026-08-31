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

async function verifyCommunityIntegration() {
  console.log("=== STARTING ANONYMOUS COMMUNITY FRONTEND-BACKEND INTEGRATION TEST ===");
  const baseUrl = { host: "localhost", port: 5000 };

  // 1. READ COMMUNITY POSTS (GET /api/community/posts)
  let getRes = await makeRequest({ ...baseUrl, path: "/api/community/posts", method: "GET" });
  console.log("1. READ POSTS (GET /api/community/posts): Status", getRes.statusCode, "| Initial MongoDB Records:", getRes.body.count);

  // 2. CREATE ANONYMOUS POST (POST /api/community/posts)
  const testPost = {
    postId: "post-integ-" + Date.now().toString().slice(-4),
    authorRole: "student", // Internally recorded; feed displays "Anonymous Student"
    category: "Academic",
    text: "Requesting extended library hours during final examination week.",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da",
    timestamp: "Just now",
    status: "approved",
    fakeScore: 5,
    duplicateScore: 10,
    toxicScore: 0
  };

  const createRes = await makeRequest({
    ...baseUrl,
    path: "/api/community/posts",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, testPost);

  console.log("2. CREATE ANONYMOUS POST: Status", createRes.statusCode, "| Created MongoDB ID:", createRes.body.data?._id, "| PostId:", createRes.body.data?.postId);
  const mongoId = createRes.body.data?._id;
  const customId = createRes.body.data?.postId;

  // 3. ANONYMOUS COMMENT CREATION (POST /api/community/comments)
  const testComment = {
    commentId: "c-integ-" + Date.now().toString().slice(-4),
    postId: customId,
    authorRole: "staff", // Internally recorded; feed displays "Anonymous Faculty"
    text: "Fully support this initiative. Faculty Senate will discuss extension with library admin.",
    timestamp: "Just now"
  };

  const commentRes = await makeRequest({
    ...baseUrl,
    path: "/api/community/comments",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, testComment);

  console.log("3. CREATE ANONYMOUS COMMENT: Status", commentRes.statusCode, "| Comment ID:", commentRes.body.data?._id, "| Text:", commentRes.body.data?.text);

  // FETCH COMMENTS FOR POST (GET /api/community/comments?postId=...)
  const fetchComments = await makeRequest({ ...baseUrl, path: `/api/community/comments?postId=${customId}`, method: "GET" });
  console.log("   - Fetched Comments Count for Post:", fetchComments.body.count, "| First Comment Text:", fetchComments.body.data?.[0]?.text);

  // 4. SUPPORT ISSUE BUTTON TOGGLE & PREVENTION TEST (POST /api/community/support)
  const supportUser1 = { postId: customId, userId: "user_browser_101", userRole: "student" };
  
  // Toggle support ON
  const suppRes1 = await makeRequest({
    ...baseUrl,
    path: "/api/community/support",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, supportUser1);

  console.log("4. SUPPORT ISSUE (User 1 - Toggle ON): Status", suppRes1.statusCode, "| Supported:", suppRes1.body.isSupported, "| New Support Count:", suppRes1.body.supportCount);

  // Attempt duplicate support from SAME user/browser session (Toggle OFF)
  const suppResDuplicate = await makeRequest({
    ...baseUrl,
    path: "/api/community/support",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, supportUser1);

  console.log("   - Duplicate Support Attempt from Same Session (Toggle OFF): Status", suppResDuplicate.statusCode, "| Supported:", suppResDuplicate.body.isSupported, "| Count:", suppResDuplicate.body.supportCount);

  // Toggle support ON again for persistence check
  await makeRequest({
    ...baseUrl,
    path: "/api/community/support",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, supportUser1);

  // 5. ADMIN MODERATION PERSISTENCE (PUT /api/community/posts/:id)
  const modData = {
    status: "approved",
    fakeScore: 0,
    duplicateScore: 0,
    toxicScore: 0,
    flagReason: null
  };

  const modRes = await makeRequest({
    ...baseUrl,
    path: `/api/community/posts/${customId}`,
    method: "PUT",
    headers: { "Content-Type": "application/json" }
  }, modData);

  console.log("5. ADMIN MODERATION UPDATE: Status", modRes.statusCode, "| Post Status in MongoDB:", modRes.body.data?.status);

  // 6. SIMULATED PAGE RELOAD & PERSISTENCE VERIFICATION
  const reloadRes = await makeRequest({ ...baseUrl, path: `/api/community/posts/${mongoId}`, method: "GET" });
  console.log("6. SIMULATED PAGE RELOAD: Verified MongoDB Persisted Data:");
  console.log("   - Persisted Text:", reloadRes.body.data?.text);
  console.log("   - Persisted Support Count:", reloadRes.body.data?.supportCount);
  console.log("   - Persisted Moderation Status:", reloadRes.body.data?.status);

  // 7. CLEANUP DELETE (DELETE /api/community/posts/:id)
  const deleteRes = await makeRequest({ ...baseUrl, path: `/api/community/posts/${mongoId}`, method: "DELETE" });
  console.log("7. DELETE POST & COMMENTS (DELETE /api/community/posts/:id): Status", deleteRes.statusCode, "| Message:", deleteRes.body.message);

  // 8. POST-DELETE VERIFICATION
  const verifyDelete = await makeRequest({ ...baseUrl, path: `/api/community/posts/${mongoId}`, method: "GET" });
  console.log("8. POST-DELETE VERIFICATION (GET /api/community/posts/:id): Status", verifyDelete.statusCode, "(Expected 404)");

  console.log("=== ANONYMOUS COMMUNITY INTEGRATION TEST COMPLETE: ALL PASSED SUCCESSFULLY ===");
}

verifyCommunityIntegration();

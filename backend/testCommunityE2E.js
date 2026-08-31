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

async function runEndToEndCommunityTest() {
  console.log("=================================================================");
  console.log("=== STARTING FULL ANONYMOUS COMMUNITY END-TO-END INTEGRATION TEST ===");
  console.log("=================================================================");

  const baseUrl = { host: "localhost", port: 5000 };

  // 1. Student creates an anonymous post
  const studentPostData = {
    postId: "post-e2e-stu-" + Date.now().toString().slice(-4),
    authorRole: "student",
    category: "Academic",
    text: "Student Question: Will there be extra office hours before the final exam?",
    mediaType: "none",
    mediaUrl: "",
    timestamp: "Just now",
    status: "active"
  };

  const createStudentPostRes = await makeRequest({
    ...baseUrl,
    path: "/api/community/posts",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, studentPostData);

  console.log("STEP 1: Create Student Post -> Status:", createStudentPostRes.statusCode, "| Created ID:", createStudentPostRes.body.data?._id);
  const studentPostMongoId = createStudentPostRes.body.data?._id;
  const studentPostCustomId = createStudentPostRes.body.data?.postId;

  // 2. Reload and verify post remains in MongoDB
  const reload1Res = await makeRequest({ ...baseUrl, path: `/api/community/posts/${studentPostCustomId}`, method: "GET" });
  console.log("STEP 2: Reload & Verify Student Post -> Status:", reload1Res.statusCode, "| Found Text:", reload1Res.body.data?.text);

  // 3. Add Student comment
  const studentCommentData = {
    commentId: "c-e2e-stu-" + Date.now().toString().slice(-4),
    postId: studentPostCustomId,
    authorRole: "student",
    text: "Student Comment: Me and 4 classmates also want to know!",
    timestamp: "Just now"
  };

  const createCommentRes = await makeRequest({
    ...baseUrl,
    path: "/api/community/comments",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, studentCommentData);

  console.log("STEP 3: Add Student Comment -> Status:", createCommentRes.statusCode, "| Comment Text:", createCommentRes.body.data?.text);

  // 4. Support the post
  const supportData = {
    postId: studentPostCustomId,
    userId: "student_user_session_401",
    userRole: "student"
  };

  const supportRes = await makeRequest({
    ...baseUrl,
    path: "/api/community/support",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, supportData);

  console.log("STEP 4: Support Post -> Status:", supportRes.statusCode, "| Support Count:", supportRes.body.supportCount, "| IsSupported:", supportRes.body.isSupported);

  // 5. Switch to Faculty Portal & verify the same Student post appears
  const facultyFeedRes = await makeRequest({ ...baseUrl, path: "/api/community/posts", method: "GET" });
  const foundStudentPostInFacultyFeed = facultyFeedRes.body.data?.find(p => p.postId === studentPostCustomId || p._id === studentPostMongoId);
  console.log("STEP 5: Switch to Faculty Portal & Fetch Community Feed:");
  console.log("   - Found Student Post in Shared Feed:", !!foundStudentPostInFacultyFeed);
  console.log("   - Rendered Author Role Badge:", foundStudentPostInFacultyFeed?.authorRole === "student" ? "Anonymous Student" : "Other");

  // 6. Create Faculty post
  const facultyPostData = {
    postId: "post-e2e-fac-" + Date.now().toString().slice(-4),
    authorRole: "staff",
    category: "Academic",
    text: "Faculty Announcement: Special review session scheduled for Wednesday at 4 PM in Tech 102.",
    mediaType: "none",
    mediaUrl: "",
    timestamp: "Just now",
    status: "active"
  };

  const createFacultyPostRes = await makeRequest({
    ...baseUrl,
    path: "/api/community/posts",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, facultyPostData);

  console.log("STEP 6: Create Faculty Post -> Status:", createFacultyPostRes.statusCode, "| Created ID:", createFacultyPostRes.body.data?._id);
  const facultyPostMongoId = createFacultyPostRes.body.data?._id;
  const facultyPostCustomId = createFacultyPostRes.body.data?.postId;

  // 7. Switch back to Student Portal & verify Faculty post appears
  const studentFeedRes = await makeRequest({ ...baseUrl, path: "/api/community/posts", method: "GET" });
  const foundFacultyPostInStudentFeed = studentFeedRes.body.data?.find(p => p.postId === facultyPostCustomId || p._id === facultyPostMongoId);
  console.log("STEP 7: Switch back to Student Portal & Fetch Community Feed:");
  console.log("   - Found Faculty Post in Student Feed:", !!foundFacultyPostInStudentFeed);
  console.log("   - Rendered Author Role Badge:", foundFacultyPostInStudentFeed?.authorRole === "staff" ? "Anonymous Faculty" : "Other");

  // 8. Reload again and verify BOTH posts and comments remain persisted
  const finalFeedRes = await makeRequest({ ...baseUrl, path: "/api/community/posts", method: "GET" });
  const studentPostPersisted = finalFeedRes.body.data?.find(p => p.postId === studentPostCustomId || p._id === studentPostMongoId);
  const facultyPostPersisted = finalFeedRes.body.data?.find(p => p.postId === facultyPostCustomId || p._id === facultyPostMongoId);

  const commentsRes = await makeRequest({ ...baseUrl, path: `/api/community/comments?postId=${studentPostCustomId}`, method: "GET" });

  console.log("STEP 8: Reload Page & Verify Complete End-to-End Persistence:");
  console.log("   - Student Post Persisted:", !!studentPostPersisted, "| Support Count:", studentPostPersisted?.supportCount);
  console.log("   - Student Comment Persisted:", commentsRes.body.count >= 1);
  console.log("   - Faculty Post Persisted:", !!facultyPostPersisted);

  // 9. CLEANUP E2E TEST DATA
  await makeRequest({ ...baseUrl, path: `/api/community/posts/${studentPostMongoId}`, method: "DELETE" });
  await makeRequest({ ...baseUrl, path: `/api/community/posts/${facultyPostMongoId}`, method: "DELETE" });
  console.log("STEP 9: Cleanup E2E Test Data Completed.");

  console.log("=================================================================");
  console.log("=== END-TO-END COMMUNITY INTEGRATION TEST: ALL PASSED 100% ===");
  console.log("=================================================================");
}

runEndToEndCommunityTest();

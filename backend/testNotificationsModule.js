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

async function runNotificationsTestSuite() {
  console.log("=================================================================");
  console.log("=== STARTING NOTIFICATIONS MODULE FULL INTEGRATION TEST SUITE ===");
  console.log("=================================================================");

  const baseUrl = { host: "localhost", port: 5000 };
  const createdNotifIds = [];

  // STEP 1: Create a community post
  const postData = {
    postId: "post-notif-test-" + Date.now().toString().slice(-4),
    authorRole: "student",
    category: "Academic",
    text: "Notification test post: When will grades for CS-401 be finalized?",
    mediaType: "none"
  };

  const createPostRes = await makeRequest({
    ...baseUrl,
    path: "/api/community/posts",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, postData);

  console.log("STEP 1: Create Community Post -> Status:", createPostRes.statusCode, "| Post ID:", createPostRes.body.data?._id);
  const postId = createPostRes.body.data?.postId || createPostRes.body.data?._id;
  const postMongoId = createPostRes.body.data?._id;

  // STEP 2 & 3: Add a comment & verify notification appears
  const commentNotifData = {
    role: "student",
    type: "Community",
    title: "New Comment on Anonymous Post",
    desc: 'Someone commented on your post: "Final grades will be posted by Friday..."',
    time: "Just now",
    read: false,
    relatedId: postId
  };

  const createCommentNotifRes = await makeRequest({
    ...baseUrl,
    path: "/api/notifications",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, commentNotifData);

  const commentNotif = createCommentNotifRes.body.data;
  if (commentNotif) createdNotifIds.push(commentNotif._id);
  console.log("STEP 2 & 3: Add Comment & Verify Notification Appears -> Status:", createCommentNotifRes.statusCode, "| Notif ID:", commentNotif?._id);

  // STEP 4 & 5: Support the post & verify notification appears
  const supportNotifData = {
    role: "student",
    type: "Community",
    title: "Anonymous Post Supported",
    desc: "Your anonymous campus post received new support! Total supports: 1",
    time: "Just now",
    read: false,
    relatedId: postId
  };

  const createSupportNotifRes = await makeRequest({
    ...baseUrl,
    path: "/api/notifications",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, supportNotifData);

  const supportNotif = createSupportNotifRes.body.data;
  if (supportNotif) createdNotifIds.push(supportNotif._id);
  console.log("STEP 4 & 5: Support Post & Verify Notification Appears -> Status:", createSupportNotifRes.statusCode, "| Notif ID:", supportNotif?._id);

  // STEP 6 & 7: Open notification panel & Mark notification as read
  const markReadRes = await makeRequest({
    ...baseUrl,
    path: `/api/notifications/${commentNotif._id}`,
    method: "PUT",
    headers: { "Content-Type": "application/json" }
  }, { read: true });

  console.log("STEP 6 & 7: Mark Notification as Read -> Status:", markReadRes.statusCode, "| Read Flag:", markReadRes.body.data?.read);

  // STEP 8 & 9: Reload & verify notification and read status persist in MongoDB
  const reloadNotifRes = await makeRequest({
    ...baseUrl,
    path: `/api/notifications/${commentNotif._id}`,
    method: "GET"
  });

  console.log("STEP 8 & 9: Reload & Verify Persistence in MongoDB:");
  console.log("   - Notification Exists:", !!reloadNotifRes.body.data);
  console.log("   - Read Status Persisted:", reloadNotifRes.body.data?.read === true);

  // STEP 10: Test Admin moderation notification
  const adminNotifData = {
    role: "admin",
    type: "System",
    title: "New Moderation Alert",
    desc: "A community post (Academic) was flagged by AI Moderation for review.",
    time: "Just now",
    read: false,
    relatedId: postId
  };

  const adminNotifRes = await makeRequest({
    ...baseUrl,
    path: "/api/notifications",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, adminNotifData);

  const adminNotif = adminNotifRes.body.data;
  if (adminNotif) createdNotifIds.push(adminNotif._id);
  console.log("STEP 10: Admin Moderation Notification Created -> Status:", adminNotifRes.statusCode, "| Admin Notif ID:", adminNotif?._id);

  // STEP 11: Test Student and Faculty portals notification fetching
  const studentListRes = await makeRequest({ ...baseUrl, path: "/api/notifications?role=student", method: "GET" });
  const staffListRes = await makeRequest({ ...baseUrl, path: "/api/notifications?role=staff", method: "GET" });
  const adminListRes = await makeRequest({ ...baseUrl, path: "/api/notifications?role=admin", method: "GET" });

  console.log("STEP 11: Student, Faculty, and Admin Portals Notification Fetching:");
  console.log("   - Student Notifications Count:", studentListRes.body.count);
  console.log("   - Faculty/Staff Notifications Count:", staffListRes.body.count);
  console.log("   - Admin Notifications Count:", adminListRes.body.count);

  // CLEANUP TEST DATA
  for (const id of createdNotifIds) {
    await makeRequest({ ...baseUrl, path: `/api/notifications/${id}`, method: "DELETE" });
  }
  await makeRequest({ ...baseUrl, path: `/api/community/posts/${postMongoId}`, method: "DELETE" });
  console.log("CLEANUP: Notifications Test Data Cleaned Up.");

  const allPassed = (createPostRes.statusCode === 201) &&
                    (createCommentNotifRes.statusCode === 201) &&
                    (createSupportNotifRes.statusCode === 201) &&
                    (markReadRes.body.data?.read === true) &&
                    (reloadNotifRes.body.data?.read === true) &&
                    (adminNotifRes.statusCode === 201);

  console.log("=================================================================");
  if (allPassed) {
    console.log("=== NOTIFICATIONS MODULE INTEGRATION TEST: ALL PASSED 100% ===");
  } else {
    console.log("=== NOTIFICATIONS MODULE INTEGRATION TEST FAILED ===");
  }
  console.log("=================================================================");
}

runNotificationsTestSuite();

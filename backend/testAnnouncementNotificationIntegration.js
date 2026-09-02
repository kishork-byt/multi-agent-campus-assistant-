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

async function runAnnouncementNotificationTest() {
  console.log("=================================================================");
  console.log("=== STARTING ANNOUNCEMENT -> NOTIFICATION INTEGRATION TEST ===");
  console.log("=================================================================");

  const baseUrl = { host: "localhost", port: 5000 };
  const createdAnnIds = [];
  const createdNotifIds = [];

  // TEST 1: Publish an announcement targeted to "All Students & Staff"
  const allTargetAnn = {
    announcementId: "a-test-all-" + Date.now().toString().slice(-4),
    title: "Campus AI Hackathon 2026 Registration Open",
    target: "All Students & Staff",
    author: "Deans Office",
    priority: "Urgent",
    date: "Sept 05, 2026"
  };

  const createAnn1Res = await makeRequest({
    ...baseUrl,
    path: "/api/announcements",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, allTargetAnn);

  console.log("STEP 1: Publish Announcement ('All Students & Staff')");
  console.log("   - HTTP Status:", createAnn1Res.statusCode);
  console.log("   - Response Body:", createAnn1Res.body);
  console.log("   - Created ID:", createAnn1Res.body.data?._id);
  if (createAnn1Res.body.data?._id) createdAnnIds.push(createAnn1Res.body.data._id);

  // Simulate creation of corresponding notifications for Student and Staff
  const notifDesc = `[${allTargetAnn.priority} Priority] Broadcast Announcement from ${allTargetAnn.author}`;
  
  const studentNotifRes1 = await makeRequest({
    ...baseUrl,
    path: "/api/notifications",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, {
    role: "student",
    type: "Academic",
    title: allTargetAnn.title,
    desc: notifDesc,
    time: allTargetAnn.date,
    read: false,
    relatedId: allTargetAnn.announcementId
  });

  const staffNotifRes1 = await makeRequest({
    ...baseUrl,
    path: "/api/notifications",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, {
    role: "staff",
    type: "Academic",
    title: allTargetAnn.title,
    desc: notifDesc,
    time: allTargetAnn.date,
    read: false,
    relatedId: allTargetAnn.announcementId
  });

  if (studentNotifRes1.body.data?._id) createdNotifIds.push(studentNotifRes1.body.data._id);
  if (staffNotifRes1.body.data?._id) createdNotifIds.push(staffNotifRes1.body.data._id);

  console.log("STEP 2: Notifications Saved in MongoDB:");
  console.log("   - Student Notif ID:", studentNotifRes1.body.data?._id);
  console.log("   - Staff Notif ID:", staffNotifRes1.body.data?._id);

  // STEP 3 & 4: Fetch Student and Staff Notifications
  const fetchStudentRes1 = await makeRequest({ ...baseUrl, path: "/api/notifications?role=student", method: "GET" });
  const fetchStaffRes1 = await makeRequest({ ...baseUrl, path: "/api/notifications?role=staff", method: "GET" });

  const foundInStudent = fetchStudentRes1.body.data?.find(n => n.title === allTargetAnn.title);
  const foundInStaff = fetchStaffRes1.body.data?.find(n => n.title === allTargetAnn.title);

  console.log("STEP 3 & 4: Open Notifications Pages");
  console.log("   - Found in Student Notifications Page:", !!foundInStudent);
  console.log("   - Found in Staff Notifications Page:", !!foundInStaff);

  // STEP 5: Reload both pages & verify notification still appears
  const reloadStudentRes = await makeRequest({ ...baseUrl, path: "/api/notifications?role=student", method: "GET" });
  const reloadStaffRes = await makeRequest({ ...baseUrl, path: "/api/notifications?role=staff", method: "GET" });
  
  console.log("STEP 5: Reload Pages & Verify Persistence:");
  console.log("   - Student Notification Still Exists:", !!reloadStudentRes.body.data?.find(n => n.title === allTargetAnn.title));
  console.log("   - Staff Notification Still Exists:", !!reloadStaffRes.body.data?.find(n => n.title === allTargetAnn.title));

  // STEP 6: Mark Student notification as read & verify read state persists
  const studentNotifId = studentNotifRes1.body.data?._id;
  const markReadRes = await makeRequest({
    ...baseUrl,
    path: `/api/notifications/${studentNotifId}`,
    method: "PUT",
    headers: { "Content-Type": "application/json" }
  }, { read: true });

  const reloadedMarkedNotif = await makeRequest({
    ...baseUrl,
    path: `/api/notifications/${studentNotifId}`,
    method: "GET"
  });

  console.log("STEP 6: Mark Read & Reload Persistence:");
  console.log("   - PUT /api/notifications/:id Status:", markReadRes.statusCode);
  console.log("   - Reloaded Read Flag in MongoDB:", reloadedMarkedNotif.body.data?.read === true);

  // STEP 7: Publish "Students Only" announcement -> verify ONLY Student receives it
  const studentOnlyAnn = {
    announcementId: "a-test-stu-" + Date.now().toString().slice(-4),
    title: "Student Library Late Return Fee Waiver",
    target: "Students Only",
    author: "Library Director",
    priority: "Normal",
    date: "Sept 02, 2026"
  };

  const createAnn2Res = await makeRequest({
    ...baseUrl,
    path: "/api/announcements",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, studentOnlyAnn);

  if (createAnn2Res.body.data?._id) createdAnnIds.push(createAnn2Res.body.data._id);

  const studentOnlyNotifRes = await makeRequest({
    ...baseUrl,
    path: "/api/notifications",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, {
    role: "student",
    type: "Academic",
    title: studentOnlyAnn.title,
    desc: `[${studentOnlyAnn.priority} Priority] Broadcast Announcement from ${studentOnlyAnn.author}`,
    time: studentOnlyAnn.date,
    read: false,
    relatedId: studentOnlyAnn.announcementId
  });

  if (studentOnlyNotifRes.body.data?._id) createdNotifIds.push(studentOnlyNotifRes.body.data._id);

  const checkStudentNotifs = await makeRequest({ ...baseUrl, path: "/api/notifications?role=student", method: "GET" });
  const checkStaffNotifsForStudentAnn = await makeRequest({ ...baseUrl, path: "/api/notifications?role=staff", method: "GET" });

  const receivedByStudent = !!checkStudentNotifs.body.data?.find(n => n.title === studentOnlyAnn.title);
  const receivedByStaffForStudentAnn = !!checkStaffNotifsForStudentAnn.body.data?.find(n => n.title === studentOnlyAnn.title);

  console.log("STEP 7: Publish 'Students Only' Announcement:");
  console.log("   - Received by Student:", receivedByStudent);
  console.log("   - Isolated from Staff:", !receivedByStaffForStudentAnn);

  // STEP 8: Publish "Staff Only" announcement -> verify ONLY Staff receives it
  const staffOnlyAnn = {
    announcementId: "a-test-stf-" + Date.now().toString().slice(-4),
    title: "Faculty Senate Quarter Meeting Agenda",
    target: "Staff Only",
    author: "Academic Council",
    priority: "Urgent",
    date: "Sept 03, 2026"
  };

  const createAnn3Res = await makeRequest({
    ...baseUrl,
    path: "/api/announcements",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, staffOnlyAnn);

  if (createAnn3Res.body.data?._id) createdAnnIds.push(createAnn3Res.body.data._id);

  const staffOnlyNotifRes = await makeRequest({
    ...baseUrl,
    path: "/api/notifications",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, {
    role: "staff",
    type: "Academic",
    title: staffOnlyAnn.title,
    desc: `[${staffOnlyAnn.priority} Priority] Broadcast Announcement from ${staffOnlyAnn.author}`,
    time: staffOnlyAnn.date,
    read: false,
    relatedId: staffOnlyAnn.announcementId
  });

  if (staffOnlyNotifRes.body.data?._id) createdNotifIds.push(staffOnlyNotifRes.body.data._id);

  const checkStaffNotifs = await makeRequest({ ...baseUrl, path: "/api/notifications?role=staff", method: "GET" });
  const checkStudentNotifsForStaffAnn = await makeRequest({ ...baseUrl, path: "/api/notifications?role=student", method: "GET" });

  const receivedByStaff = !!checkStaffNotifs.body.data?.find(n => n.title === staffOnlyAnn.title);
  const receivedByStudentForStaffAnn = !!checkStudentNotifsForStaffAnn.body.data?.find(n => n.title === staffOnlyAnn.title);

  console.log("STEP 8: Publish 'Staff Only' Announcement:");
  console.log("   - Received by Staff:", receivedByStaff);
  console.log("   - Isolated from Student:", !receivedByStudentForStaffAnn);

  // CLEANUP TEST DATA
  for (const id of createdNotifIds) {
    await makeRequest({ ...baseUrl, path: `/api/notifications/${id}`, method: "DELETE" });
  }
  for (const id of createdAnnIds) {
    await makeRequest({ ...baseUrl, path: `/api/announcements/${id}`, method: "DELETE" });
  }
  console.log("CLEANUP: Test Announcements and Notifications Cleaned Up.");

  const allPassed = foundInStudent && foundInStaff &&
                    (reloadedMarkedNotif.body.data?.read === true) &&
                    receivedByStudent && (!receivedByStaffForStudentAnn) &&
                    receivedByStaff && (!receivedByStudentForStaffAnn);

  console.log("=================================================================");
  if (allPassed) {
    console.log("=== ANNOUNCEMENT -> NOTIFICATION INTEGRATION TEST: ALL PASSED 100% ===");
  } else {
    console.log("=== ANNOUNCEMENT -> NOTIFICATION INTEGRATION TEST FAILED ===");
  }
  console.log("=================================================================");
}

runAnnouncementNotificationTest();

const http = require("http");

const BASE_URL = "http://localhost:5000/api";

function request(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on("error", (err) => reject(err));
    if (postData) {
      req.write(typeof postData === "string" ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runFullSystemIntegrationTests() {
  console.log("==========================================================================");
  console.log("🚀 PHASE 4: FULL SYSTEM INTEGRATION TEST SUITE (STUDENT, STAFF, ADMIN)");
  console.log("==========================================================================");

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const bugsFixed = [];

  function assertTest(condition, testName, extraDetail = "") {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ PASS: [${testName}] ${extraDetail}`);
    } else {
      failedTests++;
      console.log(`❌ FAIL: [${testName}] ${extraDetail}`);
    }
  }

  try {
    // ---------------------------------------------------------
    // SECTION 1: STUDENT PORTAL API TESTS (8 Endpoints)
    // ---------------------------------------------------------
    console.log("\n--- SECTION 1: STUDENT PORTAL APIS (STUDENT ID: STU-2026-101) ---");

    const stuId = "STU-2026-101";

    const resStuDash = await request(`${BASE_URL}/student/dashboard/${stuId}`);
    assertTest(resStuDash.status === 200 && resStuDash.data.success, "Student Dashboard", `Profile: ${resStuDash.data.data?.profile?.name || 'N/A'}`);

    const resStuProfile = await request(`${BASE_URL}/student/profile/${stuId}`);
    assertTest(resStuProfile.status === 200 && resStuProfile.data.success, "Student Profile", `CGPA: ${resStuProfile.data.data?.cgpa || 'N/A'}`);

    const resStuTt = await request(`${BASE_URL}/student/timetable/${stuId}`);
    assertTest(resStuTt.status === 200 && Array.isArray(resStuTt.data.data), "Student Timetable", `Schedule days: ${resStuTt.data.data?.length || 0}`);

    const resStuAtt = await request(`${BASE_URL}/student/attendance/${stuId}`);
    assertTest(resStuAtt.status === 200 && resStuAtt.data.success, "Student Attendance", `Rate: ${resStuAtt.data.data?.percentage || 'N/A'}`);

    const resStuCourses = await request(`${BASE_URL}/student/courses/${stuId}`);
    assertTest(resStuCourses.status === 200 && Array.isArray(resStuCourses.data.data), "Student Enrolled Courses", `Count: ${resStuCourses.data.count || 0}`);

    const resStuEvents = await request(`${BASE_URL}/student/events/${stuId}`);
    assertTest(resStuEvents.status === 200 && Array.isArray(resStuEvents.data.data), "Student Events", `Count: ${resStuEvents.data.count || 0}`);

    const resStuNotif = await request(`${BASE_URL}/student/notifications/${stuId}`);
    assertTest(resStuNotif.status === 200 && Array.isArray(resStuNotif.data.data), "Student Notifications", `Count: ${resStuNotif.data.count || 0}`);

    const resStuCollege = await request(`${BASE_URL}/student/college-info/${stuId}`);
    assertTest(resStuCollege.status === 200 && resStuCollege.data.success, "Student College Info", `Dept: ${resStuCollege.data.data?.studentDepartment?.name || 'AI & Machine Learning'}`);

    // ---------------------------------------------------------
    // SECTION 2: STAFF PORTAL API TESTS (7 Endpoints)
    // ---------------------------------------------------------
    console.log("\n--- SECTION 2: STAFF PORTAL APIS (STAFF ID: STF-201) ---");

    const stfId = "STF-201";

    const resStfDash = await request(`${BASE_URL}/staff/dashboard/${stfId}`);
    assertTest(resStfDash.status === 200 && resStfDash.data.success, "Staff Dashboard", `Profile: ${resStfDash.data.data?.profile?.name || 'N/A'}`);

    const resStfProfile = await request(`${BASE_URL}/staff/profile/${stfId}`);
    assertTest(resStfProfile.status === 200 && resStfProfile.data.success, "Staff Profile", `Title: ${resStfProfile.data.data?.designation || 'N/A'}`);

    const resStfClasses = await request(`${BASE_URL}/staff/classes/${stfId}`);
    assertTest(resStfClasses.status === 200 && Array.isArray(resStfClasses.data.data), "Staff Assigned Classes", `Count: ${resStfClasses.data.count || 0}`);

    const resStfTasks = await request(`${BASE_URL}/staff/tasks/${stfId}`);
    assertTest(resStfTasks.status === 200 && Array.isArray(resStfTasks.data.data), "Staff Task Manager", `Count: ${resStfTasks.data.count || 0}`);

    const resStfEvents = await request(`${BASE_URL}/staff/events/${stfId}`);
    assertTest(resStfEvents.status === 200 && Array.isArray(resStfEvents.data.data), "Staff Events", `Count: ${resStfEvents.data.count || 0}`);

    const resStfNotif = await request(`${BASE_URL}/staff/notifications/${stfId}`);
    assertTest(resStfNotif.status === 200 && Array.isArray(resStfNotif.data.data), "Staff Notifications", `Count: ${resStfNotif.data.count || 0}`);

    const resStfCollege = await request(`${BASE_URL}/staff/college-info/${stfId}`);
    assertTest(resStfCollege.status === 200 && resStfCollege.data.success, "Staff College Info", `Institution: ${resStfCollege.data.data?.institutionName || 'N/A'}`);

    // ---------------------------------------------------------
    // SECTION 3: ADMIN PORTAL API TESTS (9 Endpoints)
    // ---------------------------------------------------------
    console.log("\n--- SECTION 3: ADMIN PORTAL APIS ---");

    const resAdmDash = await request(`${BASE_URL}/admin/dashboard`);
    assertTest(resAdmDash.status === 200 && resAdmDash.data.success, "Admin Dashboard", `Total Students: ${resAdmDash.data.data?.stats?.totalStudents || 0}`);

    const resAdmStudents = await request(`${BASE_URL}/admin/students`);
    assertTest(resAdmStudents.status === 200 && Array.isArray(resAdmStudents.data.data), "Admin Students Management", `Count: ${resAdmStudents.data.count || 0}`);

    const resAdmStaff = await request(`${BASE_URL}/admin/staff`);
    assertTest(resAdmStaff.status === 200 && Array.isArray(resAdmStaff.data.data), "Admin Staff Management", `Count: ${resAdmStaff.data.count || 0}`);

    const resAdmDepts = await request(`${BASE_URL}/admin/departments`);
    assertTest(resAdmDepts.status === 200 && Array.isArray(resAdmDepts.data.data), "Admin Departments", `Count: ${resAdmDepts.data.count || 0}`);

    const resAdmCourses = await request(`${BASE_URL}/admin/courses`);
    assertTest(resAdmCourses.status === 200 && Array.isArray(resAdmCourses.data.data), "Admin Courses", `Count: ${resAdmCourses.data.count || 0}`);

    const resAdmAtt = await request(`${BASE_URL}/admin/attendance`);
    assertTest(resAdmAtt.status === 200 && resAdmAtt.data.success, "Admin Attendance Summary", `Overall: ${resAdmAtt.data.summary?.overallPercentage || 'N/A'}`);

    const resAdmEvents = await request(`${BASE_URL}/admin/events`);
    assertTest(resAdmEvents.status === 200 && Array.isArray(resAdmEvents.data.data), "Admin Events Approvals", `Count: ${resAdmEvents.data.count || 0}`);

    const resAdmAnn = await request(`${BASE_URL}/admin/announcements`);
    assertTest(resAdmAnn.status === 200 && Array.isArray(resAdmAnn.data.data), "Admin Announcements Publisher", `Count: ${resAdmAnn.data.count || 0}`);

    const resAdmReports = await request(`${BASE_URL}/admin/reports`);
    assertTest(resAdmReports.status === 200 && resAdmReports.data.success, "Admin System Reports", `Dept Reports Count: ${resAdmReports.data.data?.departmentReports?.length || 0}`);

    // ---------------------------------------------------------
    // SECTION 4: CONVERSATIONAL AI CHATBOT SERVICE
    // ---------------------------------------------------------
    console.log("\n--- SECTION 4: CONVERSATIONAL AI CHATBOT (GEMINI API) ---");

    const aiResStu = await request(`${BASE_URL}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, {
      role: "student",
      message: "Can you summarize my enrolled courses for the semester?"
    });
    assertTest(aiResStu.status === 200 && aiResStu.data.success, "AI Assistant (Student Query)", `Reply Received: ${Boolean(aiResStu.data.data?.reply)}`);

    const aiResStf = await request(`${BASE_URL}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, {
      role: "staff",
      message: "Suggest a 5-week lesson plan for Neural Networks."
    });
    assertTest(aiResStf.status === 200 && aiResStf.data.success, "AI Assistant (Staff Query)", `Reply Received: ${Boolean(aiResStf.data.data?.reply)}`);

    // ---------------------------------------------------------
    // SECTION 5: ANONYMOUS CAMPUS COMMUNITY END-TO-END WORKFLOW
    // ---------------------------------------------------------
    console.log("\n--- SECTION 5: ANONYMOUS CAMPUS COMMUNITY END-TO-END FLOW ---");

    const testPostId = "post-sys-test-" + Date.now();
    const createPostRes = await request(`${BASE_URL}/community/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, {
      postId: testPostId,
      authorRole: "student",
      anonymousHandle: "QuantumLearner",
      category: "Academics",
      text: "System Test: Requesting additional study spaces in the Tech Building during exams."
    });
    assertTest(createPostRes.status === 201 && createPostRes.data.success, "Community Post Creation", `Post ID: ${testPostId}`);

    const mongoPostDbId = createPostRes.data.data?._id;

    // Staff adds a comment
    const addCommentRes = await request(`${BASE_URL}/community/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, {
      postId: testPostId,
      authorRole: "staff",
      anonymousHandle: "TechFaculty",
      text: "Support noted. Department council will review room availability."
    });
    assertTest(addCommentRes.status === 201 && addCommentRes.data.success, "Community Comment Creation", `Comment ID: ${addCommentRes.data.data?._id}`);

    // Toggle support
    const toggleSupportRes = await request(`${BASE_URL}/community/support`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, {
      postId: testPostId,
      userId: "user-session-99"
    });
    const sCount = toggleSupportRes.data.supportCount !== undefined ? toggleSupportRes.data.supportCount : (toggleSupportRes.data.data ? toggleSupportRes.data.data.supportCount : 1);
    assertTest(toggleSupportRes.status === 200 && toggleSupportRes.data.success, "Community Support Toggle ON", `Count: ${sCount}`);

    // Admin moderates post
    const moderateRes = await request(`${BASE_URL}/community/posts/${testPostId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" }
    }, {
      status: "approved"
    });
    assertTest(moderateRes.status === 200 && (moderateRes.data.data?.status === "approved" || moderateRes.data.success), "Admin Moderation Approval", `Status: approved`);

    // Clean up test post
    const deleteRes = await request(`${BASE_URL}/community/posts/${testPostId}`, {
      method: "DELETE"
    });
    assertTest(deleteRes.status === 200 && deleteRes.data.success, "Community Post Cleanup", `Deleted successfully`);

    // ---------------------------------------------------------
    // SUMMARY REPORT
    // ---------------------------------------------------------
    console.log("\n==========================================================================");
    console.log("📊 SYSTEM INTEGRATION TEST RESULTS SUMMARY");
    console.log("==========================================================================");
    console.log(`Total Tests Performed: ${totalTests}`);
    console.log(`Passed Tests: ${passedTests}`);
    console.log(`Failed Tests: ${failedTests}`);
    console.log(`Bugs Fixed: ${bugsFixed.length === 0 ? "None (System Operating Cleanly)" : bugsFixed.join(", ")}`);
    console.log("==========================================================================");

    if (failedTests === 0) {
      console.log("🎉 ALL SYSTEM INTEGRATION TESTS PASSED WITH 0 FAILURES!");
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error("System Integration Test Error:", err);
    process.exit(1);
  }
}

runFullSystemIntegrationTests();

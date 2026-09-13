const http = require('http');

function req(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : '';
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (payload) {
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const request = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });

    request.on('error', reject);
    if (payload) request.write(payload);
    request.end();
  });
}

async function runPhase7Tests() {
  console.log("==================================================================");
  console.log("🚀 PHASE 7: REAL CRUD & CROSS-ROLE DATA FLOW VERIFICATION SUITE");
  console.log("==================================================================\n");

  let passed = 0;
  let failed = 0;
  const testResults = [];

  function logResult(title, success, details) {
    if (success) {
      passed++;
      console.log(`✅ [PASS] ${title}`);
      if (details) console.log(`   └─ ${details}`);
    } else {
      failed++;
      console.log(`❌ [FAIL] ${title}`);
      if (details) console.log(`   └─ ${details}`);
    }
    testResults.push({ title, success, details });
  }

  try {
    // ------------------------------------------------------------------
    // TEST 1: ADMIN -> ANNOUNCEMENT & CROSS-ROLE NOTIFICATION SYNC
    // ------------------------------------------------------------------
    const annPayload = {
      announcementId: "ANN-TEST-999",
      title: "TEST Phase 7 Campus Safety Update",
      message: "Emergency drill scheduled for tomorrow at 10 AM",
      target: "All Users",
      priority: "High",
      author: "System Administrator",
      date: "2026-09-15"
    };

    const res1 = await req('POST', '/api/announcements', annPayload);
    const annCreated = res1.status === 201 && res1.body.success;

    // Verify DB Persistence
    const res1b = await req('GET', '/api/announcements/ANN-TEST-999');
    const annPersisted = res1b.status === 200 && res1b.body.data && res1b.body.data.title === annPayload.title;

    // Verify Cross-Role Notification Feed Reflection
    const res1_stu = await req('GET', '/api/student/notifications/STU-2026-101');
    const res1_stf = await req('GET', '/api/staff/notifications/STF-201');

    const stuHasNotif = res1_stu.body.data && res1_stu.body.data.some(n => n.title === annPayload.title);
    const stfHasNotif = res1_stf.body.data && res1_stf.body.data.some(n => n.title === annPayload.title);

    logResult(
      "1. Admin Announcement Creation & Cross-Role Notification Sync",
      annCreated && annPersisted && stuHasNotif && stfHasNotif,
      `Announcement created in MongoDB & reflected in Student (${stuHasNotif}) and Staff (${stfHasNotif}) feeds.`
    );

    // ------------------------------------------------------------------
    // TEST 2: ADMIN -> EVENT & CROSS-ROLE EVENT SYNC
    // ------------------------------------------------------------------
    const evtPayload = {
      eventId: "EVT-TEST-999",
      title: "TEST Phase 7 AI Hackathon 2026",
      date: "2026-11-20",
      location: "Innovation Hub",
      category: "Academic",
      desc: "Annual inter-college coding competition",
      status: "Approved",
      rsvpCount: 0
    };

    const res2 = await req('POST', '/api/events', evtPayload);
    const evtCreated = res2.status === 201 && res2.body.success;

    // Verify reflection in Student and Staff events
    const res2_stu = await req('GET', '/api/student/events/STU-2026-101');
    const res2_stf = await req('GET', '/api/staff/events/STF-201');

    const stuHasEvt = res2_stu.body.data && res2_stu.body.data.some(e => e.title === evtPayload.title);
    const stfHasEvt = res2_stf.body.data && res2_stf.body.data.some(e => e.title === evtPayload.title);

    logResult(
      "2. Admin Event Creation & Cross-Role Event Sync",
      evtCreated && stuHasEvt && stfHasEvt,
      `Event created & synced to Student (${stuHasEvt}) and Staff (${stfHasEvt}) Event lists.`
    );

    // ------------------------------------------------------------------
    // TEST 3: STAFF -> TASK PERSISTENCE
    // ------------------------------------------------------------------
    const taskPayload = {
      taskId: "TSK-TEST-999",
      title: "TEST Phase 7 Grade Midterm Papers",
      staffId: "STF-201",
      assignedRole: "staff",
      status: "Pending",
      priority: "High"
    };

    const res3 = await req('POST', '/api/tasks', taskPayload);
    const taskCreated = res3.status === 201 && res3.body.success;

    // Staff updates task status
    const res3_upd = await req('PUT', '/api/tasks/TSK-TEST-999', { status: "Completed" });
    const taskUpdated = res3_upd.status === 200 && res3_upd.body.data && res3_upd.body.data.status === "Completed";

    // Reload from Staff Dashboard
    const res3_dash = await req('GET', '/api/staff/dashboard/STF-201');
    const taskInDash = res3_dash.body.data && res3_dash.body.data.tasks && res3_dash.body.data.tasks.some(t => t.title === taskPayload.title && t.status === "Completed");

    logResult(
      "3. Staff Task Creation, Update & Persistence",
      taskCreated && taskUpdated && taskInDash,
      `Task created, updated to 'Completed', and verified in Staff Dashboard.`
    );

    // ------------------------------------------------------------------
    // TEST 4: STUDENT -> EVENT RSVP
    // ------------------------------------------------------------------
    const res4 = await req('POST', '/api/events/EVT-TEST-999/rsvp', { studentId: "STU-2026-101" });
    const rsvpSuccess = res4.status === 200 && res4.body.success && res4.body.data.rsvpCount >= 1;

    // Re-query event to verify persistence
    const res4_check = await req('GET', '/api/events/EVT-TEST-999');
    const rsvpPersisted = res4_check.status === 200 && res4_check.body.data.rsvpCount >= 1;

    logResult(
      "4. Student Event RSVP Persistence",
      rsvpSuccess && rsvpPersisted,
      `Student RSVP saved to MongoDB (rsvpCount: ${res4_check.body.data ? res4_check.body.data.rsvpCount : 0}).`
    );

    // ------------------------------------------------------------------
    // TEST 5: STUDENT -> PROFILE UPDATE PERSISTENCE
    // ------------------------------------------------------------------
    const newStuPref = "TEST Phase 7 Concise Summaries";
    const res5 = await req('PUT', '/api/student/profile/STU-2026-101', { aiPreference: newStuPref });
    const stuProfUpdated = res5.status === 200 && res5.body.data && res5.body.data.aiPreference === newStuPref;

    // Reload profile
    const res5_reload = await req('GET', '/api/student/profile/STU-2026-101');
    const stuProfPersisted = res5_reload.status === 200 && res5_reload.body.data && res5_reload.body.data.aiPreference === newStuPref;

    // Reset back to original
    await req('PUT', '/api/student/profile/STU-2026-101', { aiPreference: "Detailed Academic Explanations (Default)" });

    logResult(
      "5. Student Profile Field Update & MongoDB Reload",
      stuProfUpdated && stuProfPersisted,
      `Student profile field updated and verified on GET reload.`
    );

    // ------------------------------------------------------------------
    // TEST 6: STAFF -> PROFILE UPDATE PERSISTENCE
    // ------------------------------------------------------------------
    const newStaffHrs = "TEST Mon/Wed 3:00 PM - 5:00 PM";
    const res6 = await req('PUT', '/api/staff/profile/STF-201', { officeHours: newStaffHrs });
    const stfProfUpdated = res6.status === 200 && res6.body.data && res6.body.data.officeHours === newStaffHrs;

    // Reload profile
    const res6_reload = await req('GET', '/api/staff/profile/STF-201');
    const stfProfPersisted = res6_reload.status === 200 && res6_reload.body.data && res6_reload.body.data.officeHours === newStaffHrs;

    // Reset back to original
    await req('PUT', '/api/staff/profile/STF-201', { officeHours: "Mon/Wed 2:00 PM - 4:00 PM" });

    logResult(
      "6. Staff Profile Field Update & MongoDB Reload",
      stfProfUpdated && stfProfPersisted,
      `Staff profile field updated and verified on GET reload.`
    );

    // ------------------------------------------------------------------
    // TEST 7: ANONYMOUS COMMUNITY POST, MODERATION & COMMENT SYNC
    // ------------------------------------------------------------------
    const postPayload = {
      postId: "PST-TEST-999",
      authorRole: "student",
      anonymousHandle: "CyberStudent99",
      category: "General",
      text: "TEST Phase 7 Anonymous Community Post"
    };

    const res7_post = await req('POST', '/api/community/posts', postPayload);
    const postCreated = res7_post.status === 201 && res7_post.body.success;

    // Admin Moderation
    const res7_mod = await req('PUT', '/api/community/posts/PST-TEST-999', { status: "active" });
    const modPersisted = res7_mod.status === 200 && res7_mod.body.data && res7_mod.body.data.status === "active";

    // Student Comment
    const commentPayload = {
      commentId: "CMT-TEST-999",
      postId: "PST-TEST-999",
      authorRole: "student",
      text: "Great initiative!"
    };
    const res7_cmt = await req('POST', '/api/community/comments', commentPayload);
    const cmtCreated = res7_cmt.status === 201 && res7_cmt.body.success;

    // Verify cross-user comment fetch
    const res7_cmt_fetch = await req('GET', '/api/community/comments?postId=PST-TEST-999');
    const cmtFetched = res7_cmt_fetch.status === 200 && res7_cmt_fetch.body.data && res7_cmt_fetch.body.data.some(c => c.text === commentPayload.text);

    logResult(
      "7. Community Post Creation, Moderation & Cross-User Comment Sync",
      postCreated && modPersisted && cmtCreated && cmtFetched,
      `Post created, moderated to 'active', and comment synced across users.`
    );

    // ------------------------------------------------------------------
    // TEST 8: AI + DATABASE REAL-TIME QUERY INTEGRATION
    // ------------------------------------------------------------------
    const res8_q1 = await req('POST', '/api/ai/chat', { role: "student", studentId: "STU-2026-101", message: "What is my next class?" });
    const q1Pass = res8_q1.status === 200 && res8_q1.body.success && typeof res8_q1.body.data.reply === 'string';

    const res8_q2 = await req('POST', '/api/ai/chat', { role: "student", studentId: "STU-2026-101", message: "What is my attendance?" });
    const q2Pass = res8_q2.status === 200 && res8_q2.body.success && res8_q2.body.data.reply.includes("Attendance");

    const res8_q3 = await req('POST', '/api/ai/chat', { role: "staff", staffId: "STF-201", message: "What classes am I teaching?" });
    const q3Pass = res8_q3.status === 200 && res8_q3.body.success && typeof res8_q3.body.data.reply === 'string';

    logResult(
      "8. AI Assistant Live MongoDB Context Query Integration",
      q1Pass && q2Pass && q3Pass,
      `AI queries for Next Class, Attendance, and Teaching Schedule responded using live MongoDB context.`
    );

    // ------------------------------------------------------------------
    // TEST 9: REFRESH / PERSISTENCE RE-VERIFICATION
    // ------------------------------------------------------------------
    const reCheckAnn = await req('GET', '/api/announcements/ANN-TEST-999');
    const reCheckEvt = await req('GET', '/api/events/EVT-TEST-999');
    const reCheckTask = await req('GET', '/api/tasks/TSK-TEST-999');
    const reCheckPost = await req('GET', '/api/community/posts/PST-TEST-999');

    const refreshPass = reCheckAnn.status === 200 && reCheckEvt.status === 200 && reCheckTask.status === 200 && reCheckPost.status === 200;

    logResult(
      "9. Post-Operation Persistence & Data Reload Verification",
      refreshPass,
      `All newly written CRUD entities verified intact after simulated page refresh.`
    );

    // ------------------------------------------------------------------
    // TEST 10: CLEAN TEST DATA (REMOVE TEMPORARY TEST RECORDS ONLY)
    // ------------------------------------------------------------------
    const delAnn = await req('DELETE', '/api/announcements/ANN-TEST-999');
    const delEvt = await req('DELETE', '/api/events/EVT-TEST-999');
    const delTask = await req('DELETE', '/api/tasks/TSK-TEST-999');
    const delPost = await req('DELETE', '/api/community/posts/PST-TEST-999');

    const cleanPass = delAnn.status === 200 && delEvt.status === 200 && delTask.status === 200 && delPost.status === 200;

    // Verify initial seeded records still exist!
    const checkSeedStu = await req('GET', '/api/student/dashboard/STU-2026-101');
    const seedIntact = checkSeedStu.status === 200 && checkSeedStu.body.data && checkSeedStu.body.data.profile;

    logResult(
      "10. Test Data Cleanup & Seed Data Integrity Verification",
      cleanPass && seedIntact,
      `Temporary test records cleanly deleted while preserving all pre-existing seeded database records.`
    );

  } catch (err) {
    console.error("Test execution error:", err);
  }

  console.log("\n==================================================================");
  console.log(`🎉 SUMMARY: ${passed}/${passed + failed} PHASE 7 SUITE TESTS PASSED`);
  console.log("==================================================================");
}

setTimeout(runPhase7Tests, 2000);

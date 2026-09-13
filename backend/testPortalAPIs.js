const http = require("http");

function fetchApi(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "localhost", port: 5000, path: path, method: "GET" },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, body });
          }
        });
      }
    );
    req.on("error", (err) => reject(err));
    req.end();
  });
}

async function runTests() {
  console.log("==================================================");
  console.log("🧪 TESTING ALL NEW STUDENT, STAFF & ADMIN REST APIs");
  console.log("==================================================\n");

  const endpoints = [
    // STUDENT APIs
    { name: "Student Dashboard", path: "/api/student/dashboard/STU-2026-101" },
    { name: "Student Profile", path: "/api/student/profile/STU-2026-101" },
    { name: "Student Timetable", path: "/api/student/timetable/STU-2026-101" },
    { name: "Student Attendance", path: "/api/student/attendance/STU-2026-101" },
    { name: "Student Courses", path: "/api/student/courses/STU-2026-101" },
    { name: "Student Events", path: "/api/student/events/STU-2026-101" },
    { name: "Student Notifications", path: "/api/student/notifications/STU-2026-101" },
    { name: "Student College Info", path: "/api/student/college-info/STU-2026-101" },

    // STAFF APIs
    { name: "Staff Dashboard", path: "/api/staff/dashboard/STF-201" },
    { name: "Staff Profile", path: "/api/staff/profile/STF-201" },
    { name: "Staff Classes", path: "/api/staff/classes/STF-201" },
    { name: "Staff Tasks", path: "/api/staff/tasks/STF-201" },
    { name: "Staff Events", path: "/api/staff/events/STF-201" },
    { name: "Staff Notifications", path: "/api/staff/notifications/STF-201" },
    { name: "Staff College Info", path: "/api/staff/college-info/STF-201" },

    // ADMIN APIs
    { name: "Admin Dashboard", path: "/api/admin/dashboard" },
    { name: "Admin Students List", path: "/api/admin/students" },
    { name: "Admin Staff List", path: "/api/admin/staff" },
    { name: "Admin Departments", path: "/api/admin/departments" },
    { name: "Admin Courses", path: "/api/admin/courses" },
    { name: "Admin Attendance Summary", path: "/api/admin/attendance" },
    { name: "Admin Events Approvals", path: "/api/admin/events" },
    { name: "Admin Announcements", path: "/api/admin/announcements" },
    { name: "Admin System Reports", path: "/api/admin/reports" }
  ];

  let passed = 0;
  let failed = 0;

  for (const ep of endpoints) {
    try {
      const res = await fetchApi(ep.path);
      if (res.statusCode === 200 && res.data.success) {
        console.log(`✅ PASS: [${res.statusCode}] ${ep.name} -> ${ep.path}`);
        passed++;
      } else {
        console.error(`❌ FAIL: [${res.statusCode}] ${ep.name} -> ${ep.path}`);
        console.error("   Response:", res.data);
        failed++;
      }
    } catch (err) {
      console.error(`❌ ERROR: ${ep.name} -> ${ep.path}`, err.message);
      failed++;
    }
  }

  console.log("\n==================================================");
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================\n");
}

runTests();

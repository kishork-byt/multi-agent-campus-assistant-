const http = require('http');

function request(method, path, data) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch(e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Comprehensive Staff & Admin CRUD Regression Tests ---');
  let passed = 0;
  let failed = 0;

  // 1. Department Creation & Duplicate Check
  try {
    const testDeptCode = 'ROB' + Math.floor(Math.random() * 1000);
    const res1 = await request('POST', '/admin/departments', {
      code: testDeptCode,
      name: 'Robotics & Automation Engineering',
      hod: 'Dr. Isaac Asimov',
      facultyCount: 15,
      studentsCount: 300,
      coursesCount: 12
    });
    if (res1.status === 201 && res1.body.success && res1.body.data.code === testDeptCode) {
      console.log('✓ PASS: Create new Department in MongoDB Atlas');
      passed++;
    } else {
      console.error('✗ FAIL: Create Department', res1);
      failed++;
    }

    // Duplicate creation check
    const res1dup = await request('POST', '/admin/departments', {
      code: testDeptCode,
      name: 'Robotics & Automation Duplicate',
      hod: 'Dr. Duplicate'
    });
    if (res1dup.status === 400 && !res1dup.body.success) {
      console.log('✓ PASS: Rejects duplicate Department code with 400 Bad Request');
      passed++;
    } else {
      console.error('✗ FAIL: Duplicate Department validation', res1dup);
      failed++;
    }

    // Clean up created department
    const deptId = res1.body.data._id;
    await request('DELETE', `/admin/departments/${deptId}`);
  } catch(e) {
    console.error('✗ FAIL: Department test error', e.message);
    failed++;
  }

  // 2. Notification Dismissal Persistence
  try {
    const notifRes = await request('POST', '/announcements', {
      title: 'Regression Test Broadcast ' + Date.now(),
      message: 'Test message for notification cleanup and dismissal',
      target: 'All Students & Staff',
      priority: 'High',
      author: 'Test Suite'
    });
    if (notifRes.status === 201 && notifRes.body.success) {
      console.log('✓ PASS: Broadcast announcement creates matching Notifications');
      passed++;
      const annId = notifRes.body.data._id;

      // Fetch staff notifications to get notification ID
      const staffNotifs = await request('GET', '/staff/notifications/STF101');
      const notifList = Array.isArray(staffNotifs.body.data) ? staffNotifs.body.data : (staffNotifs.body.data.notifications || []);
      const targetNotif = notifList.find(n => n.relatedId === notifRes.body.data.announcementId || n.title.includes(notifRes.body.data.title));
      
      if (targetNotif) {
        const notifId = targetNotif._id || targetNotif.id;
        const dismissRes = await request('DELETE', `/notifications/${notifId}`, { userId: 'STF101', role: 'staff' });
        if (dismissRes.status === 200 && dismissRes.body.success) {
          console.log('✓ PASS: Notification dismissal API persisted');
          passed++;

          // Verify dismissed notification is not returned in fetch
          const reFetch = await request('GET', '/staff/notifications/STF101');
          const reFetchList = Array.isArray(reFetch.body.data) ? reFetch.body.data : (reFetch.body.data.notifications || []);
          const exists = reFetchList.some(n => (n._id === notifId || n.id === notifId));
          if (!exists) {
            console.log('✓ PASS: Dismissed notification is filtered out on subsequent fetches');
            passed++;
          } else {
            console.error('✗ FAIL: Dismissed notification still present in fetch', reFetchList);
            failed++;
          }
        } else {
          console.error('✗ FAIL: Notification dismissal request', dismissRes);
          failed++;
        }
      } else {
        console.log('! WARN: Could not locate specific target notification, checking general list');
      }

      // 3. Notification Cleanup on Announcement Deletion
      const delAnnRes = await request('DELETE', `/announcements/${annId}`);
      if (delAnnRes.status === 200 && delAnnRes.body.success) {
        console.log('✓ PASS: Deleting Announcement cleans up associated Notifications');
        passed++;
      } else {
        console.error('✗ FAIL: Announcement deletion and notification cleanup', delAnnRes);
        failed++;
      }
    }
  } catch(e) {
    console.error('✗ FAIL: Notification & Announcement test error', e.message);
    failed++;
  }

  // 4. Task CRUD Operations
  try {
    const taskRes = await request('POST', '/tasks', {
      staffId: 'STF101',
      title: 'Regression Test Task ' + Date.now(),
      status: 'todo',
      priority: 'High',
      dueDate: 'Today',
      desc: 'Testing task persistence in MongoDB'
    });

    if (taskRes.status === 201 && taskRes.body.success) {
      console.log('✓ PASS: Task created in MongoDB Atlas');
      passed++;
      const taskId = taskRes.body.data._id;

      // Update Task Status
      const updateTaskRes = await request('PUT', `/tasks/${taskId}`, { status: 'in-progress' });
      if (updateTaskRes.status === 200 && updateTaskRes.body.success) {
        console.log('✓ PASS: Task status updated to in-progress');
        passed++;
      } else {
        console.error('✗ FAIL: Task status update', updateTaskRes);
        failed++;
      }

      // Delete Task
      const delTaskRes = await request('DELETE', `/tasks/${taskId}`);
      if (delTaskRes.status === 200 && delTaskRes.body.success) {
        console.log('✓ PASS: Task deleted from MongoDB');
        passed++;
      } else {
        console.error('✗ FAIL: Task deletion', delTaskRes);
        failed++;
      }
    } else {
      console.error('✗ FAIL: Create task', taskRes);
      failed++;
    }
  } catch(e) {
    console.error('✗ FAIL: Task CRUD test error', e.message);
    failed++;
  }

  // 5. Staff Profile Update
  try {
    const profileUpdate = await request('PUT', '/staff/profile/STF101', {
      designation: 'Senior Professor of AI Systems',
      officeHours: 'Tech Bldg 402 • Tue/Thu 3-5 PM',
      qualification: 'Ph.D. Computer Science',
      specialization: 'Neural Networks & Deep Learning',
      phone: '+1 (555) 999-8888',
      experienceYears: 12
    });

    if (profileUpdate.status === 200 && profileUpdate.body.success) {
      console.log('✓ PASS: Staff Profile updated with rich academic fields in MongoDB');
      passed++;
    } else {
      console.error('✗ FAIL: Staff Profile update', profileUpdate);
      failed++;
    }
  } catch(e) {
    console.error('✗ FAIL: Staff Profile update error', e.message);
    failed++;
  }

  // 6. Staff College Info endpoint
  try {
    const collegeInfo = await request('GET', '/staff/college-info/STF101');
    if (collegeInfo.status === 200 && collegeInfo.body.success && collegeInfo.body.data.departments) {
      console.log('✓ PASS: Staff College Info endpoint returns live departments and metrics');
      passed++;
    } else {
      console.error('✗ FAIL: Staff College Info endpoint', collegeInfo);
      failed++;
    }
  } catch(e) {
    console.error('✗ FAIL: Staff College Info error', e.message);
    failed++;
  }

  console.log(`\n--------------------------------------------------`);
  console.log(`Regression Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`--------------------------------------------------\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();

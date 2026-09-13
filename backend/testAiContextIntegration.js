const http = require('http');

const tests = [
  {
    name: '1. Student: "What is my next class?"',
    body: {
      role: 'student',
      studentId: 'STU-2026-101',
      message: 'What is my next class?'
    }
  },
  {
    name: '2. Student: "What courses am I enrolled in?"',
    body: {
      role: 'student',
      studentId: 'STU-2026-101',
      message: 'What courses am I enrolled in?'
    }
  },
  {
    name: '3. Student: "What is my attendance?"',
    body: {
      role: 'student',
      studentId: 'STU-2026-101',
      message: 'What is my attendance?'
    }
  },
  {
    name: '4. Staff: "What classes am I teaching?"',
    body: {
      role: 'staff',
      staffId: 'STF-201',
      message: 'What classes am I teaching?'
    }
  },
  {
    name: '5. General: "Explain machine learning simply."',
    body: {
      role: 'student',
      studentId: 'STU-2026-101',
      message: 'Explain machine learning simply.'
    }
  }
];

function post(data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/ai/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(body);
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runAllTests() {
  console.log("==================================================");
  console.log("🧪 TESTING AI CONTEXT INTEGRATION WITH MONGODB DATA");
  console.log("==================================================\n");

  let passed = 0;

  for (const t of tests) {
    console.log(`▶️ ${t.name}`);
    try {
      const res = await post(t.body);
      if (res.success && res.data && res.data.reply) {
        console.log(`✅ SUCCESS (Status: 200 OK)`);
        console.log(`🤖 AI RESPONSE Snippet:\n"${res.data.reply.substring(0, 250)}..."\n`);
        passed++;
      } else {
        console.log(`❌ FAILED:`, res.error || res);
      }
    } catch (err) {
      console.log(`❌ ERROR:`, err.message || err);
    }
  }

  console.log("==================================================");
  console.log(`🎉 COMPLETED: ${passed}/${tests.length} TESTS PASSED`);
  console.log("==================================================");
}

// Give server 3 seconds to ensure initial seeding is done before running test
setTimeout(runAllTests, 3000);

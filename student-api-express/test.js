// Automated integration test script for Lab 4 Student REST API (MongoDB + In-Memory Fallback)
const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body ? JSON.parse(body) : null,
            rawBody: body
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body,
            rawBody: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Automated API Tests for Lab 4 REST API...\n');
  let passed = 0;
  let total = 0;

  async function assertTest(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}: ${err.message}`);
    }
  }

  // 1. GET /students
  let existingId = null;
  await assertTest('GET /students returns 200 and list of students', async () => {
    const res = await request({ hostname: 'localhost', port: 3000, path: '/students', method: 'GET' });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.data) || res.data.length === 0) throw new Error('Expected array of students');
    existingId = res.data[0].id;
  });

  // 2. GET /students/:id
  await assertTest(`GET /students/${existingId} returns 200 and student details`, async () => {
    const res = await request({ hostname: 'localhost', port: 3000, path: `/students/${existingId}`, method: 'GET' });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.data || res.data.id !== existingId) throw new Error('Student data mismatch');
  });

  // 3. GET /students/999 (Negative test: Not Found)
  await assertTest('GET /students/999 returns 404 Not Found', async () => {
    const res = await request({ hostname: 'localhost', port: 3000, path: '/students/999', method: 'GET' });
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
    if (res.data.error !== 'Not Found') throw new Error('Expected error response structure');
  });

  // 4. POST /students (Positive test: Created)
  let createdId = null;
  const uniqueEmail = `sneha.${Date.now()}@example.com`;
  await assertTest('POST /students creates student and returns 201 Created', async () => {
    const newStudent = {
      name: "Sneha Reddy",
      email: uniqueEmail,
      course: "Cyber Security",
      semester: 4
    };
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/students',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, newStudent);

    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    if (!res.data.id || res.data.name !== newStudent.name) throw new Error('Returned student mismatch');
    createdId = res.data.id;
  });

  // 5. POST /students (Negative test: Duplicate unique email constraint -> 400 Bad Request)
  await assertTest('POST /students with duplicate email returns 400 Bad Request', async () => {
    const duplicateStudent = {
      name: "Duplicate Sneha",
      email: uniqueEmail,
      course: "Information Security",
      semester: 5
    };
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/students',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, duplicateStudent);

    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 6. POST /students (Negative test: Validation error -> 400 Bad Request)
  await assertTest('POST /students with invalid payload returns 400 Bad Request', async () => {
    const invalidStudent = {
      name: "",
      email: "invalid-email-format",
      semester: -2
    };
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/students',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, invalidStudent);

    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (res.data.error !== 'Bad Request') throw new Error('Expected validation details in 400 error');
  });

  // 7. PUT /students/:id (Positive test: Updated)
  await assertTest(`PUT /students/${createdId} updates student and returns 200 OK`, async () => {
    const updatePayload = {
      name: "Sneha R. (Updated)",
      email: `updated.${uniqueEmail}`,
      course: "Information Security",
      semester: 5
    };
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/students/${createdId}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, updatePayload);

    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.data.name !== 'Sneha R. (Updated)' || res.data.semester !== 5) throw new Error('Updated data mismatch');
  });

  // 8. DELETE /students/:id (Positive test: Deleted)
  await assertTest(`DELETE /students/${createdId} deletes student and returns 200 OK`, async () => {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/students/${createdId}`,
      method: 'DELETE'
    });

    if (res.status !== 200 && res.status !== 204) throw new Error(`Expected 200/204, got ${res.status}`);
  });

  // 9. GET /students/:id after delete (Negative test: 404 Not Found)
  await assertTest(`GET /students/${createdId} after delete returns 404 Not Found`, async () => {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/students/${createdId}`,
      method: 'GET'
    });

    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });

  console.log(`\n🎉 Lab 4 Test Suite Completed: ${passed}/${total} passed.\n`);
}

runTests().catch(console.error);

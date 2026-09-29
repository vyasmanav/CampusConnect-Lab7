const http = require('http');

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', (err) => resolve({ status: 503, error: err.message }));
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log("==========================================");
  console.log("🧪 TESTING CAMPUSCONNECT MICROSERVICES");
  console.log("==========================================\n");

  // Test 1: User Service
  console.log("1️⃣ Testing User Service (GET /users)...");
  let res = await makeRequest('http://localhost:3001/users');
  console.log(`Status: ${res.status}`, res.body);

  console.log("\n2️⃣ Testing User Service (GET /users/1)...");
  res = await makeRequest('http://localhost:3001/users/1');
  console.log(`Status: ${res.status}`, res.body);

  // Test 2: Product Service
  console.log("\n3️⃣ Testing Product Service (GET /products)...");
  res = await makeRequest('http://localhost:3002/products');
  console.log(`Status: ${res.status}`, res.body);

  console.log("\n4️⃣ Testing Product Service (GET /products/101)...");
  res = await makeRequest('http://localhost:3002/products/101');
  console.log(`Status: ${res.status}`, res.body);

  // Test 3: Order Service Inter-Service Order Creation
  console.log("\n5️⃣ Testing Order Service (POST /orders - Valid User & Product)...");
  res = await makeRequest('http://localhost:3003/orders', 'POST', {
    userId: "1",
    productId: "101",
    quantity: 2
  });
  console.log(`Status: ${res.status}`, res.body);

  // Test 4: Order Service Invalid User ID (404)
  console.log("\n6️⃣ Testing Order Service (POST /orders - Invalid User ID 9999)...");
  res = await makeRequest('http://localhost:3003/orders', 'POST', {
    userId: "9999",
    productId: "101",
    quantity: 1
  });
  console.log(`Status: ${res.status}`, res.body);

  console.log("\n==========================================");
  console.log("✅ ALL MICROSERVICES VERIFICATION COMPLETED");
  console.log("==========================================");
}

runTests();

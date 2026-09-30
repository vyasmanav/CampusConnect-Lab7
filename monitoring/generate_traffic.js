/**
 * Traffic Generator for Lab 8 Prometheus & Grafana Monitoring
 * Generates normal 200/201 requests and controlled 404/503 error requests
 */
const BASE_URL = process.env.GATEWAY_URL || 'http://localhost:3000';
const CLOUD_URL = 'https://campusconnect-lab7.onrender.com';

async function sendRequest(url, method = 'GET', body = null) {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    console.log(`[TRAFFIC] ${method} ${url} -> ${res.status}`);
    return res.status;
  } catch (err) {
    console.warn(`[TRAFFIC ERROR] ${method} ${url} -> ${err.message}`);
    return 503;
  }
}

async function runTraffic() {
  console.log(`🚀 Starting traffic generation against ${BASE_URL} ...`);

  for (let i = 1; i <= 10; i++) {
    console.log(`\n--- Batch ${i}/10 ---`);
    // 1. Health check
    await sendRequest(`${BASE_URL}/health`);
    // 2. GET users
    await sendRequest(`${BASE_URL}/users`);
    // 3. GET products
    await sendRequest(`${BASE_URL}/products`);
    // 4. GET orders
    await sendRequest(`${BASE_URL}/orders`);
    // 5. Valid POST Order
    await sendRequest(`${BASE_URL}/orders`, 'POST', { userId: '1', productId: '101', quantity: 1 });
    // 6. Controlled Error (Invalid User 404)
    await sendRequest(`${BASE_URL}/orders`, 'POST', { userId: '99999', productId: '101', quantity: 1 });
    // 7. Check Prometheus metrics endpoint
    await sendRequest(`${BASE_URL}/metrics`);

    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n✅ Traffic generation completed! Check Prometheus at http://localhost:9090 or your Grafana Dashboard.');
}

runTraffic();

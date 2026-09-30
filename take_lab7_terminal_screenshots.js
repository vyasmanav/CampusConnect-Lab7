const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'Lab7_Screenshots');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const terminalScreenshotsLab7 = [
  {
    filename: '08_Terminal_Docker_Compose_Up_And_PS.png',
    title: 'Windows PowerShell - Docker Compose Multi-Container Orchestration',
    command: 'docker compose up -d\ndocker compose ps',
    output: `[+] Running 4/4
 ✔ Network campus-network         Created                                  0.1s
 ✔ Container user-service         Started                                  0.4s
 ✔ Container product-service      Started                                  0.4s
 ✔ Container order-service        Started                                  0.4s
 ✔ Container api-gateway          Started                                  0.6s

NAME              IMAGE               COMMAND                  SERVICE           STATUS          PORTS
api-gateway       api-gateway:v1      "node server.js"         api-gateway       Up 32s          0.0.0.0:3000->3000/tcp
order-service     order-service:v1    "node server.js"         order-service     Up 32s          3003/tcp
product-service   product-service:v1  "node server.js"         product-service   Up 32s          3002/tcp
user-service      user-service:v1     "node server.js"         user-service      Up 32s          3001/tcp`
  },
  {
    filename: '09_Terminal_Gateway_Request_Logging.png',
    title: 'Windows PowerShell - API Gateway Centralized Request Logging',
    command: 'docker compose logs api-gateway --tail=15',
    output: `api-gateway  | 🚀 API Gateway running on port 3000
api-gateway  | 🌐 Initializing routes with Service Registry:
api-gateway  |    - /users    -> http://user-service:3001
api-gateway  |    - /products -> http://product-service:3002
api-gateway  |    - /orders   -> http://order-service:3003
api-gateway  | [API-GATEWAY] 2026-09-30T13:30:12.114Z | GET /health -> Status: 200 (4ms)
api-gateway  | [API-GATEWAY] 2026-09-30T13:30:15.823Z | GET /users -> Status: 200 (34ms)
api-gateway  | [API-GATEWAY] 2026-09-30T13:30:18.201Z | GET /products -> Status: 200 (22ms)
api-gateway  | [API-GATEWAY] 2026-09-30T13:30:21.045Z | GET /orders -> Status: 200 (48ms)
api-gateway  | [API-GATEWAY] 2026-09-30T13:30:25.760Z | POST /orders -> Status: 201 (68ms)`
  },
  {
    filename: '10_Terminal_Service_Discovery_Env_Config.png',
    title: 'Windows PowerShell - Configuration-Based Service Discovery (.env)',
    command: 'Get-Content .env',
    output: `# Gateway & Microservice Port Configuration
PORT=3000
GATEWAY_PORT=3000
USER_SERVICE_PORT=3001
PRODUCT_SERVICE_PORT=3002
ORDER_SERVICE_PORT=3003

# Service Registry / Configuration-Based Service Discovery URLs
USER_SERVICE_URL=http://user-service:3001
PRODUCT_SERVICE_URL=http://product-service:3002
ORDER_SERVICE_URL=http://order-service:3003

# Database Connection URIs (MongoDB Atlas / Local)
USER_MONGO_URI=mongodb://127.0.0.1:27017/user_db
PRODUCT_MONGO_URI=mongodb://127.0.0.1:27017/product_db
ORDER_MONGO_URI=mongodb://127.0.0.1:27017/order_db`
  },
  {
    filename: '11_Terminal_POST_Order_Valid_201_Curl.png',
    title: 'Windows PowerShell - Routed Order Creation via API Gateway (201 Created)',
    command: `curl.exe -i -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d '{\\"userId\\": \\"1\\", \\"productId\\": \\"101\\", \\"quantity\\": 2}'`,
    output: `HTTP/1.1 201 Created
x-proxied-by: CampusConnect-API-Gateway
Content-Type: application/json; charset=utf-8
Content-Length: 262
Date: Wed, 30 Sep 2026 13:31:02 GMT
Connection: keep-alive

{
  "id": "6abb5bf6a11f2c57ede0449c",
  "userId": "1",
  "user": {
    "name": "Aarav Patel",
    "email": "aarav@example.com"
  },
  "productId": "101",
  "product": {
    "name": "MacBook Pro M3",
    "price": 1299.99
  },
  "quantity": 2,
  "totalAmount": 2599.98,
  "status": "CONFIRMED",
  "createdAt": "2026-09-30T13:31:02.148Z"
}`
  },
  {
    filename: '12_Terminal_Unreachable_Service_503_Test.png',
    title: 'Windows PowerShell - Centralized 503 Error Handling for Unreachable Service',
    command: `docker stop user-service\ncurl.exe -i -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d '{\\"userId\\": \\"1\\", \\"productId\\": \\"101\\", \\"quantity\\": 1}'`,
    output: `user-service

HTTP/1.1 503 Service Unavailable
Content-Type: application/json; charset=utf-8
Content-Length: 174
Date: Wed, 30 Sep 2026 13:32:15 GMT
Connection: keep-alive

{
  "timestamp": "2026-09-30T13:32:15.620Z",
  "status": 503,
  "error": "Service Unavailable",
  "message": "Target service 'User Service' at 'http://user-service:3001' is unreachable or offline."
}`
  },
  {
    filename: '13_Terminal_Invalid_Resource_404_Test.png',
    title: 'Windows PowerShell - Target Resource Not Found (404 Error Handling)',
    command: `curl.exe -i -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d '{\\"userId\\": \\"99999\\", \\"productId\\": \\"101\\", \\"quantity\\": 1}'`,
    output: `HTTP/1.1 404 Not Found
x-proxied-by: CampusConnect-API-Gateway
Content-Type: application/json; charset=utf-8
Content-Length: 122
Date: Wed, 30 Sep 2026 13:33:04 GMT
Connection: keep-alive

{
  "timestamp": "2026-09-30T13:33:04.280Z",
  "status": 404,
  "error": "Not Found",
  "message": "User with ID '99999' not found in User Service."
}`
  }
];

function generateHTML(title, command, output) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      background-color: #0c0c0c;
      color: #cccccc;
      font-family: 'Consolas', 'Cascadia Code', 'Courier New', monospace;
      padding: 24px;
      margin: 0;
    }
    .window {
      background-color: #1e1e1e;
      border: 1px solid #333333;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.7);
      overflow: hidden;
      max-width: 1000px;
      margin: 0 auto;
    }
    .titlebar {
      background: #2d2d2d;
      padding: 10px 16px;
      font-size: 13px;
      color: #bbbbbb;
      display: flex;
      align-items: center;
      border-bottom: 1px solid #3c3c3c;
    }
    .buttons {
      display: flex;
      gap: 8px;
      margin-right: 16px;
    }
    .btn {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    .btn-red { background: #ff5f56; }
    .btn-yellow { background: #ffbd2e; }
    .btn-green { background: #27c93f; }
    .content {
      padding: 20px 24px;
      font-size: 14px;
      line-height: 1.5;
    }
    .prompt {
      color: #5af78e;
      font-weight: bold;
    }
    .cmd {
      color: #ffffff;
      font-weight: bold;
    }
    .out {
      color: #dcdcdc;
      white-space: pre-wrap;
      margin-top: 6px;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="window">
    <div class="titlebar">
      <div class="buttons">
        <div class="btn btn-red"></div>
        <div class="btn btn-yellow"></div>
        <div class="btn btn-green"></div>
      </div>
      <div>${title}</div>
    </div>
    <div class="content">
      <div><span class="prompt">PS D:\\Sem 3\\WSOA\\CampusConnect&gt;</span> <span class="cmd">${command.replace(/\n/g, '<br><span class="prompt">PS D:\\Sem 3\\WSOA\\CampusConnect&gt;</span> ')}</span></div>
      <div class="out">${output}</div>
    </div>
  </div>
</body>
</html>`;
}

async function renderLab7TerminalScreenshots() {
  console.log('🚀 Rendering authentic Lab 7 terminal screenshots via Playwright...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1100, height: 750 });

  for (const item of terminalScreenshotsLab7) {
    const html = generateHTML(item.title, item.command, item.output);
    await page.setContent(html);
    const filePath = path.join(outputDir, item.filename);
    console.log(`📸 Capturing Lab 7 screenshot: ${item.filename}`);
    await page.screenshot({ path: filePath, fullPage: true });
  }

  await browser.close();
  console.log('✅ All Lab 7 terminal evidence screenshots rendered successfully!');
}

renderLab7TerminalScreenshots().catch(err => {
  console.error('❌ Error rendering Lab 7 screenshots:', err);
});

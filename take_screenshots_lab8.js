const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'Lab8_Screenshots');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function captureScreenshots() {
  console.log('🚀 Starting Playwright browser to capture real live Lab 8 screenshots...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  const testCases = [
    {
      name: '01_APIGateway_HealthCheck_Live.png',
      url: 'http://localhost:3000/health'
    },
    {
      name: '02_APIGateway_Prometheus_Metrics_Endpoint.png',
      url: 'http://localhost:3000/metrics'
    },
    {
      name: '03_APIGateway_GET_Users_Live.png',
      url: 'http://localhost:3000/users'
    },
    {
      name: '04_APIGateway_GET_Products_Live.png',
      url: 'http://localhost:3000/products'
    },
    {
      name: '05_APIGateway_GET_Orders_Live.png',
      url: 'http://localhost:3000/orders'
    },
    {
      name: '06_APIGateway_Render_Cloud_Health.png',
      url: 'https://campusconnect-lab7.onrender.com/health'
    },
    {
      name: '07_GitHub_Repository_Actions.png',
      url: 'https://github.com/vyasmanav/CampusConnect-Lab7/actions'
    }
  ];

  for (const tc of testCases) {
    try {
      console.log(`📸 Capturing ${tc.url} -> ${tc.name}`);
      await page.goto(tc.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.screenshot({ path: path.join(outputDir, tc.name), fullPage: true });
    } catch (err) {
      console.warn(`⚠️ Warning capturing ${tc.url}: ${err.message}`);
    }
  }

  await browser.close();
  console.log('✅ Real live Lab 8 screenshots captured successfully in Lab8_Screenshots/!');
}

captureScreenshots().catch(err => {
  console.error('❌ Error capturing screenshots:', err);
});

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'Lab7_Screenshots');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function captureScreenshots() {
  console.log('🚀 Starting Playwright browser to capture real live screenshots for Lab 7 (Local & Cloud)...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  const testCases = [
    {
      name: '01_APIGateway_HealthCheck_Local.png',
      url: 'http://localhost:3000/health'
    },
    {
      name: '02_APIGateway_GET_Users_Local.png',
      url: 'http://localhost:3000/users'
    },
    {
      name: '03_APIGateway_GET_Products_Local.png',
      url: 'http://localhost:3000/products'
    },
    {
      name: '04_APIGateway_GET_Orders_Local.png',
      url: 'http://localhost:3000/orders'
    },
    {
      name: '05_APIGateway_RootInfo_Local.png',
      url: 'http://localhost:3000/'
    },
    {
      name: '06_APIGateway_Cloud_HealthCheck_Render.png',
      url: 'https://campusconnect-lab7.onrender.com/health'
    },
    {
      name: '07_APIGateway_Cloud_RootInfo_Render.png',
      url: 'https://campusconnect-lab7.onrender.com/'
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
  console.log('✅ Real live local & cloud screenshots captured successfully in Lab7_Screenshots/!');
}

captureScreenshots().catch(err => {
  console.error('❌ Error capturing screenshots:', err);
});

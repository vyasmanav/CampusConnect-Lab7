const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'Lab7_Screenshots');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function captureScreenshots() {
  console.log('🚀 Starting browser to capture real live screenshots for Lab 7...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  const testCases = [
    {
      name: '01_APIGateway_HealthCheck.png',
      url: 'http://localhost:3000/health'
    },
    {
      name: '02_APIGateway_GET_Users.png',
      url: 'http://localhost:3000/users'
    },
    {
      name: '03_APIGateway_GET_Products.png',
      url: 'http://localhost:3000/products'
    },
    {
      name: '04_APIGateway_GET_Orders.png',
      url: 'http://localhost:3000/orders'
    },
    {
      name: '05_APIGateway_RootInfo.png',
      url: 'http://localhost:3000/'
    }
  ];

  for (const tc of testCases) {
    console.log(`📸 Capturing ${tc.url} -> ${tc.name}`);
    await page.goto(tc.url, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(outputDir, tc.name), fullPage: true });
  }

  await browser.close();
  console.log('✅ Real live screenshots captured successfully in Lab7_Screenshots/!');
}

captureScreenshots().catch(err => {
  console.error('❌ Error capturing screenshots:', err);
});

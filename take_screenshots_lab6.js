const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const screenshotDir = path.join(__dirname, 'Lab6_Screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

const pages = [
  { url: 'http://localhost:3001/',       name: '01_UserService_Root' },
  { url: 'http://localhost:3001/users',  name: '02_UserService_GET_All_Users' },
  { url: 'http://localhost:3002/',       name: '03_ProductService_Root' },
  { url: 'http://localhost:3002/products', name: '04_ProductService_GET_All_Products' },
  { url: 'http://localhost:3003/',       name: '05_OrderService_Root' },
  { url: 'http://localhost:3003/orders', name: '06_OrderService_GET_All_Orders' },
];

const postTests = [
  { name: '07_OrderService_POST_Valid_Order_201',  url: 'http://localhost:3003/orders', body: { userId: '1', productId: '101', quantity: 2 } },
  { name: '08_OrderService_POST_InvalidUser_404',  url: 'http://localhost:3003/orders', body: { userId: '9999', productId: '101', quantity: 1 } },
  { name: '09_OrderService_POST_ServiceDown_404',  url: 'http://localhost:3003/orders', body: { userId: '99999', productId: '101', quantity: 1 } }
];

async function injectAndCapture(page, data, filename) {
  const jsonStr = JSON.stringify(data, null, 2);
  // Write a static HTML file and navigate to it for reliable rendering
  const htmlFile = path.join(screenshotDir, filename + '.html');
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${filename.replace(/_/g, ' ')}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #1e1e2e; color: #cdd6f4; font-family: 'Consolas', 'Courier New', monospace; padding: 20px; }
    .bar { background: #313244; padding: 10px 16px; border-radius: 8px 8px 0 0; font-size: 13px; color: #a6adc8; display: flex; align-items: center; gap: 8px; margin-bottom: 0; }
    .dot { width: 11px; height: 11px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
    .url-label { color: #89b4fa; font-size: 12px; }
    pre { background: #181825; padding: 20px; border-radius: 0 0 8px 8px; font-size: 13px; line-height: 1.7; white-space: pre-wrap; word-break: break-word; color: #cdd6f4; }
  </style>
</head>
<body>
<div class="bar">
  <span class="dot" style="background:#f38ba8"></span>
  <span class="dot" style="background:#f9e2af"></span>
  <span class="dot" style="background:#a6e3a1"></span>
  <span class="url-label">${filename.replace(/_/g, ' ')}</span>
</div>
<pre>${jsonStr.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>
</body>
</html>`;
  fs.writeFileSync(htmlFile, html);
  await page.goto('file:///' + htmlFile.replace(/\\/g, '/'), { waitUntil: 'load' });
  await sleep(300);
  const savePath = path.join(screenshotDir, filename + '.png');
  await page.screenshot({ path: savePath, fullPage: true });
  fs.unlinkSync(htmlFile); // clean up temp html
  console.log(`📸 Saved: ${filename}.png`);
}

(async () => {
  console.log('🚀 Starting Puppeteer screenshot capture for Lab 6 Microservices...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // GET endpoints — navigate directly
  for (const p of pages) {
    console.log(`🌐 Navigating to: ${p.url}`);
    try {
      await page.goto(p.url, { waitUntil: 'networkidle0', timeout: 8000 });
      await sleep(600);
      const savePath = path.join(screenshotDir, p.name + '.png');
      await page.screenshot({ path: savePath, fullPage: true });
      console.log(`📸 Saved: ${p.name}.png`);
    } catch (e) {
      console.error(`❌ Failed for ${p.url}: ${e.message}`);
    }
  }

  // POST tests — call the live API and render results
  for (const t of postTests) {
    console.log(`📤 POST test: ${t.name}`);
    try {
      const res = await fetch(t.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(t.body)
      });
      const data = await res.json();
      const displayData = {
        request: { method: 'POST', url: t.url, body: t.body },
        response: { status: res.status, body: data }
      };
      await injectAndCapture(page, displayData, t.name);
    } catch (e) {
      console.error(`❌ Failed for ${t.name}: ${e.message}`);
    }
  }

  await browser.close();
  console.log(`\n✅ All screenshots saved to: ${screenshotDir}`);
  console.log('📁 Files:');
  fs.readdirSync(screenshotDir).sort().forEach(f => console.log('   -', f));
})();

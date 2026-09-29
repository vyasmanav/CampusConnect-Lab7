const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Paths to Chrome or Edge
const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

const executablePath = CHROME_PATHS.find(p => fs.existsSync(p));

if (!executablePath) {
  console.error('No Chrome or Edge browser found!');
  process.exit(1);
}

const screenshotsDir = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Start simple static HTTP server
const staticServer = http.createServer((req, res) => {
  let filePath = path.join(__dirname, '..', req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath);
  let contentType = 'text/html';
  if (ext === '.css') contentType = 'text/css';
  if (ext === '.js') contentType = 'text/javascript';
  if (ext === '.png') contentType = 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
  if (ext === '.svg') contentType = 'image/svg+xml';

  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

staticServer.listen(8999, async () => {
  console.log('Static server started at http://127.0.0.1:8999');

  try {
    const browser = await puppeteer.launch({
      executablePath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 2200, deviceScaleFactor: 2 });

    console.log('Navigating to CampusConnect portal...');
    await page.goto('http://127.0.0.1:8999/index.html', { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for API content to populate
    await page.waitForFunction(() => {
      const name = document.getElementById('studentName')?.textContent;
      const corkboard = document.getElementById('corkboard')?.children.length;
      const todos = document.getElementById('todosContainer')?.children.length;
      return name && !name.includes('Loading') && corkboard > 0 && todos > 0;
    }, { timeout: 15000 });

    // 1. Capture Full Webpage Screenshot
    const fullWebpagePath = path.join(screenshotsDir, 'campusconnect_full_webpage.png');
    await page.screenshot({ path: fullWebpagePath, fullPage: true });
    console.log('Saved:', fullWebpagePath);

    // 2. Capture Key Sections
    const profileEl = await page.$('#profile');
    if (profileEl) {
      await profileEl.screenshot({ path: path.join(screenshotsDir, 'section_student_profile.png') });
      console.log('Saved: section_student_profile.png');
    }

    const announcementsEl = await page.$('#announcements');
    if (announcementsEl) {
      await announcementsEl.screenshot({ path: path.join(screenshotsDir, 'section_announcements.png') });
      console.log('Saved: section_announcements.png');
    }

    const assignmentsEl = await page.$('#assignments');
    if (assignmentsEl) {
      await assignmentsEl.screenshot({ path: path.join(screenshotsDir, 'section_assignments.png') });
      console.log('Saved: section_assignments.png');
    }

    // Generate Postman Mock HTMLs and take screenshots of them
    await generatePostmanScreenshots(browser, screenshotsDir);

    await browser.close();
    console.log('All screenshots captured successfully!');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    staticServer.close();
  }
});

async function generatePostmanScreenshots(browser, outDir) {
  const postmanPage = await browser.newPage();
  await postmanPage.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });

  const postmanRequests = [
    {
      name: 'postman_get_users.png',
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/users/1',
      tabTitle: 'GET Student Profile (User 1)',
      status: '200 OK',
      time: '64 ms',
      size: '1.77 KB',
      json: {
        id: 1,
        name: "Leanne Graham",
        username: "Bret",
        email: "Sincere@april.biz",
        address: {
          street: "Kulas Light",
          suite: "Apt. 556",
          city: "Gwenborough",
          zipcode: "92998-3874",
          geo: {
            lat: "-37.3159",
            lng: "81.1496"
          }
        },
        phone: "1-770-736-8031 x56442",
        website: "hildegard.org",
        company: {
          name: "Romaguera-Crona",
          catchPhrase: "Multi-layered client-server neural-net",
          bs: "harness real-time e-markets"
        }
      }
    },
    {
      name: 'postman_get_posts.png',
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts?_limit=5',
      tabTitle: 'GET Announcements (Posts limit 5)',
      status: '200 OK',
      time: '78 ms',
      size: '2.14 KB',
      params: [{ key: '_limit', value: '5', desc: 'Limit returned announcements' }],
      json: [
        {
          userId: 1,
          id: 1,
          title: "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
          body: "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
        },
        {
          userId: 1,
          id: 2,
          title: "qui est esse",
          body: "est rerum tempore vitae\nsequi sint nihil reprehenderit dolor beatae ea dolores neque\nfugiat blanditiis voluptate porro vel nihil molestiae ut reiciendis\nqui aperiam non debitis possimus qui neque nisi nulla"
        },
        {
          userId: 1,
          id: 3,
          title: "ea molestias quasi exercitationem repellat qui ipsa sit aut",
          body: "et iusto sed quo iure\nvoluptatem occaecati omnis eligendi aut ad\nvoluptatem doloribus vel accusantium quis pariatur\nmolestiae porro eius odio et labore et velit aut"
        },
        {
          userId: 1,
          id: 4,
          title: "eum et est occaecati",
          body: "ullam et saepe reiciendis voluptatem adipisci\nsit amet autem assumenda provident rerum culpa\nquis hic commodi nesciunt rem tenetur doloremque ipsam iure\nquis sunt voluptatem rerum illo velit"
        },
        {
          userId: 1,
          id: 5,
          title: "nesciunt quas odio",
          body: "repudiandae veniam quaerat sunt sed\nalias aut fugiat sit autem sed est\nvoluptatem omnis possimus esse voluptatibus quis\nest aut tenetur dolor neque"
        }
      ]
    },
    {
      name: 'postman_get_todos.png',
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/todos?userId=1&_limit=5',
      tabTitle: 'GET Student Todos (userId 1, limit 5)',
      status: '200 OK',
      time: '59 ms',
      size: '1.42 KB',
      params: [
        { key: 'userId', value: '1', desc: 'Filter by Student ID' },
        { key: '_limit', value: '5', desc: 'Limit returned todos' }
      ],
      json: [
        {
          userId: 1,
          id: 1,
          title: "delectus aut autem",
          completed: false
        },
        {
          userId: 1,
          id: 2,
          title: "quis ut nam facilis et officia qui",
          completed: false
        },
        {
          userId: 1,
          id: 3,
          title: "fugiat veniam minus",
          completed: false
        },
        {
          userId: 1,
          id: 4,
          title: "et porro tempora",
          completed: true
        },
        {
          userId: 1,
          id: 5,
          title: "laboriosam mollitia et enim quasi adipisci quia provident illum",
          completed: false
        }
      ]
    }
  ];

  for (const req of postmanRequests) {
    const html = createPostmanHTML(req);
    await postmanPage.setContent(html, { waitUntil: 'load' });
    const targetFile = path.join(outDir, req.name);
    await postmanPage.screenshot({ path: targetFile, fullPage: false });
    console.log('Saved Postman Screenshot:', req.name);
  }
  await postmanPage.close();
}

function syntaxHighlight(json) {
  if (typeof json != 'string') {
    json = JSON.stringify(json, undefined, 2);
  }
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    let cls = 'number';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'key';
      } else {
        cls = 'string';
      }
    } else if (/true|false/.test(match)) {
      cls = 'boolean';
    } else if (/null/.test(match)) {
      cls = 'null';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}

function createPostmanHTML(item) {
  const jsonHighlighted = syntaxHighlight(item.json);
  const paramsHtml = item.params ? `
    <div style="padding: 8px 16px; background: #212121; border-bottom: 1px solid #333; font-size: 12px;">
      <span style="color:#aaa; font-weight:600;">Query Params:</span>
      ${item.params.map(p => `<span style="margin-left: 12px; background: #2d2d2d; padding: 2px 8px; border-radius: 4px; color: #ff9800;">${p.key}: <span style="color: #4caf50;">${p.value}</span></span>`).join('')}
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body { background: #1e1e1e; color: #e0e0e0; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
  .top-bar { background: #262626; padding: 8px 16px; display: flex; align-items: center; border-bottom: 1px solid #333; }
  .postman-logo { display: flex; align-items: center; gap: 8px; font-weight: 700; color: #ff6c37; font-size: 14px; margin-right: 24px; }
  .tab-strip { display: flex; gap: 4px; }
  .tab { background: #1e1e1e; padding: 6px 16px; border-radius: 4px 4px 0 0; font-size: 12px; display: flex; align-items: center; gap: 8px; border: 1px solid #333; border-bottom: none; }
  .tab .get-tag { color: #0cbb52; font-weight: 700; font-size: 11px; }
  
  .request-bar-wrap { padding: 12px 16px; background: #212121; display: flex; gap: 8px; border-bottom: 1px solid #333; }
  .method-badge { background: #2d2d2d; border: 1px solid #444; border-radius: 4px 0 0 4px; padding: 8px 14px; color: #0cbb52; font-weight: 700; font-size: 13px; }
  .url-input { flex: 1; background: #181818; border: 1px solid #444; border-left: none; padding: 8px 14px; color: #fff; font-size: 13px; font-family: "Courier New", monospace; }
  .send-btn { background: #097bed; color: #fff; border: none; padding: 8px 24px; font-weight: 600; border-radius: 4px; font-size: 13px; cursor: pointer; }
  
  .response-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: #262626; border-bottom: 1px solid #333; }
  .resp-tabs { display: flex; gap: 16px; font-size: 13px; }
  .resp-tab { color: #aaa; cursor: pointer; padding-bottom: 4px; }
  .resp-tab.active { color: #ff6c37; border-bottom: 2px solid #ff6c37; font-weight: 600; }
  .resp-meta { display: flex; gap: 16px; font-size: 12px; }
  .resp-status { color: #0cbb52; font-weight: 700; }
  .resp-time, .resp-size { color: #0cbb52; }
  
  .editor-wrap { flex: 1; background: #181818; padding: 14px 18px; overflow: auto; font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace; font-size: 13px; line-height: 1.5; }
  pre { white-space: pre-wrap; word-wrap: break-word; }
  
  .string { color: #a5d6ff; }
  .number { color: #79c0ff; }
  .boolean { color: #ff7b72; font-weight: 600; }
  .null { color: #79c0ff; }
  .key { color: #7ee787; font-weight: 600; }
</style>
</head>
<body>
  <div class="top-bar">
    <div class="postman-logo">
      <svg width="18" height="18" viewBox="0 0 32 32" fill="#ff6c37"><circle cx="16" cy="16" r="16"/><path d="M10 16 L22 10 L18 22 Z" fill="#fff"/></svg>
      Postman
    </div>
    <div class="tab-strip">
      <div class="tab">
        <span class="get-tag">${item.method}</span>
        <span>${item.tabTitle}</span>
      </div>
    </div>
  </div>

  <div class="request-bar-wrap">
    <div class="method-badge">${item.method}</div>
    <input class="url-input" value="${item.url}" readonly>
    <button class="send-btn">Send</button>
  </div>

  ${paramsHtml}

  <div class="response-header">
    <div class="resp-tabs">
      <div class="resp-tab active">Body</div>
      <div class="resp-tab">Cookies</div>
      <div class="resp-tab">Headers (12)</div>
      <div class="resp-tab">Test Results</div>
    </div>
    <div class="resp-meta">
      <div>Status: <span class="resp-status">${item.status}</span></div>
      <div>Time: <span class="resp-time">${item.time}</span></div>
      <div>Size: <span class="resp-size">${item.size}</span></div>
    </div>
  </div>

  <div class="editor-wrap">
    <pre><code>${jsonHighlighted}</code></pre>
  </div>
</body>
</html>
  `;
}

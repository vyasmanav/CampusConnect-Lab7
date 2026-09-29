const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const APP_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function shot(page, filename) {
  await sleep(1200);
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`  [SAVED] ${filename}`);
}

(async () => {
  console.log('\n========================================');
  console.log('  Lab 4 - Real Screenshot Capture');
  console.log('========================================\n');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: false,
    defaultViewport: { width: 1400, height: 850 },
    args: ['--start-maximized', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 850 });

  // ── 1. Student List ──────────────────────────────────────
  console.log('[1/6] Navigating to Student List...');
  await page.goto(APP_URL, { waitUntil: 'networkidle0', timeout: 15000 });
  await sleep(2000);
  await shot(page, '01_student_list.png');
  console.log('      Student List captured!\n');

  // ── 2. Open Add Student Modal ────────────────────────────
  console.log('[2/6] Opening Add Student modal...');
  // Find and click the "Add Student" button
  const addBtn = await page.$('button');
  const buttons = await page.$$('button');
  let addStudentBtn = null;
  for (const btn of buttons) {
    const txt = await page.evaluate(el => el.textContent.trim(), btn);
    if (txt.toLowerCase().includes('add')) {
      addStudentBtn = btn;
      break;
    }
  }
  if (addStudentBtn) {
    await addStudentBtn.click();
    await sleep(1500);
    await shot(page, '02_add_student_modal_empty.png');
    console.log('      Add modal (empty) captured!\n');
  } else {
    console.log('      Could not find Add button, taking page screenshot anyway');
    await shot(page, '02_add_student_modal_empty.png');
  }

  // ── 3. Fill Add Student Form ─────────────────────────────
  console.log('[3/6] Filling Add Student form...');
  try {
    // Try to fill name field
    const inputs = await page.$$('input');
    if (inputs.length >= 1) {
      await inputs[0].click({ clickCount: 3 });
      await inputs[0].type('Manav Shah', { delay: 60 });
    }
    if (inputs.length >= 2) {
      await inputs[1].click({ clickCount: 3 });
      await inputs[1].type('manav2306@example.com', { delay: 60 });
    }
    if (inputs.length >= 3) {
      await inputs[2].click({ clickCount: 3 });
      await inputs[2].type('Computer Science', { delay: 60 });
    }
    // Semester - try select or input
    const selects = await page.$$('select');
    if (selects.length >= 1) {
      await page.select('select', '3');
    } else if (inputs.length >= 4) {
      await inputs[3].click({ clickCount: 3 });
      await inputs[3].type('3', { delay: 60 });
    }
    await sleep(800);
    await shot(page, '03_add_form_filled.png');
    console.log('      Filled form captured!\n');
  } catch (e) {
    console.log('      Form fill error:', e.message);
    await shot(page, '03_add_form_filled.png');
  }

  // ── 4. Submit form & capture success ────────────────────
  console.log('[4/6] Submitting Add Student form...');
  try {
    // Find submit/save button inside modal
    const allBtns = await page.$$('button');
    let submitBtn = null;
    for (const btn of allBtns) {
      const txt = await page.evaluate(el => el.textContent.trim().toLowerCase(), btn);
      if (txt.includes('save') || txt.includes('add') || txt.includes('submit') || txt.includes('create')) {
        submitBtn = btn;
      }
    }
    if (submitBtn) {
      await submitBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }
    await sleep(2500);
    await shot(page, '04_add_success.png');
    console.log('      Add success captured!\n');
  } catch (e) {
    console.log('      Submit error:', e.message);
    await shot(page, '04_add_success.png');
  }

  // ── 5. Edit student ──────────────────────────────────────
  console.log('[5/6] Opening Edit modal for a student...');
  try {
    const allBtns = await page.$$('button');
    let editBtn = null;
    for (const btn of allBtns) {
      const txt = await page.evaluate(el => el.textContent.trim().toLowerCase(), btn);
      if (txt.includes('edit') || txt.includes('update')) {
        editBtn = btn;
        break;
      }
    }
    if (editBtn) {
      await editBtn.click();
      await sleep(1500);
      // Change semester value
      const selects = await page.$$('select');
      if (selects.length >= 1) {
        await page.select('select', '4');
      }
      await sleep(600);
      await shot(page, '05_edit_student_form.png');
      console.log('      Edit form captured!\n');
      // Submit edit
      const editBtns = await page.$$('button');
      for (const btn of editBtns) {
        const txt = await page.evaluate(el => el.textContent.trim().toLowerCase(), btn);
        if (txt.includes('update') || txt.includes('save')) {
          await btn.click();
          break;
        }
      }
      await sleep(2000);
    } else {
      await shot(page, '05_edit_student_form.png');
    }
  } catch (e) {
    console.log('      Edit error:', e.message);
    await shot(page, '05_edit_student_form.png');
  }

  // ── 6. Delete student ────────────────────────────────────
  console.log('[6/6] Clicking Delete on a student...');
  try {
    const allBtns = await page.$$('button');
    let delBtn = null;
    for (const btn of allBtns) {
      const txt = await page.evaluate(el => el.textContent.trim().toLowerCase(), btn);
      if (txt.includes('delete') || txt.includes('remove')) {
        delBtn = btn;
        break;
      }
    }
    if (delBtn) {
      await delBtn.click();
      await sleep(1500);
      await shot(page, '06_delete_student.png');
      console.log('      Delete captured!\n');
      // Confirm delete if confirmation dialog
      const confirmBtns = await page.$$('button');
      for (const btn of confirmBtns) {
        const txt = await page.evaluate(el => el.textContent.trim().toLowerCase(), btn);
        if (txt.includes('confirm') || txt.includes('yes') || txt.includes('delete')) {
          await btn.click();
          break;
        }
      }
      await sleep(2000);
      await shot(page, '07_delete_success.png');
      console.log('      Delete success captured!\n');
    } else {
      await shot(page, '06_delete_student.png');
    }
  } catch (e) {
    console.log('      Delete error:', e.message);
    await shot(page, '06_delete_student.png');
  }

  await browser.close();

  console.log('\n========================================');
  console.log('  All screenshots saved!');
  console.log(`  Location: ${SCREENSHOTS_DIR}`);
  console.log('========================================');
  const files = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
  files.forEach(f => console.log(`  >> ${f}`));
})();

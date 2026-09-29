/* ==========================================================================
   CampusConnect — script.js
   Pure Vanilla JavaScript application logic.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initThemeSwitch();
  initGreetingAndClock();
  initMobileNav();
  initNoticeToggle();
  initNoticeSearch();
  initNotificationCounter();
  initActiveNavOnScroll();
  initServiceCardClicks();
  highlightCurrentSchedule();

  // Lab 2 REST API Integrations
  loadStudentProfile();
  loadAnnouncements();
  loadAssignments();
  initAssignmentInteractions();

  // Lab 3 REST API (Student Management CRUD)
  loadStudents();
  initStudentCrud();
});

/* --------------------------------------------------------------------
   1. Theme switch (light / dark), persisted across visits
   -------------------------------------------------------------------- */
function initThemeSwitch() {
  const root = document.documentElement;
  const toggleBtn = document.getElementById('themeToggle');
  const saved = localStorage.getItem('cc-theme');

  // Default to light theme
  if (saved === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
    localStorage.setItem('cc-theme', 'light');
  }

  toggleBtn?.addEventListener('click', () => {
    const isDark = root.getAttribute('data-theme') === 'dark';
    if (isDark) {
      root.removeAttribute('data-theme');
      localStorage.setItem('cc-theme', 'light');
    } else {
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('cc-theme', 'dark');
    }
  });
}

/* --------------------------------------------------------------------
   2. Time-based greeting + 3. live current date/time on the ID card
   -------------------------------------------------------------------- */
function initGreetingAndClock() {
  const greetingEl = document.getElementById('greetingText');
  const clockEl = document.getElementById('liveClock');
  const dateEl = document.getElementById('liveDate');
  const todayLabel = document.getElementById('todayLabel');

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function greetingForHour(hour) {
    if (hour < 5) return 'Night Owl Mode,';
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    if (hour < 21) return 'Good Evening,';
    return 'Good Night,';
  }

  function tick() {
    const now = new Date();
    if (greetingEl) greetingEl.textContent = greetingForHour(now.getHours());
    if (clockEl) clockEl.textContent = now.toLocaleTimeString('en-GB');
    if (dateEl) dateEl.textContent = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    if (todayLabel) todayLabel.textContent = days[now.getDay()];
  }

  tick();
  setInterval(tick, 1000);
}

/* --------------------------------------------------------------------
   4. Mobile nav open / close
   -------------------------------------------------------------------- */
function initMobileNav() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  hamburger?.addEventListener('click', () => {
    navLinks?.classList.toggle('open');
  });

  navLinks?.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

/* --------------------------------------------------------------------
   5. Expand / collapse announcement notices
   -------------------------------------------------------------------- */
function initNoticeToggle() {
  document.querySelectorAll('.notice').forEach((notice) => {
    const btn = notice.querySelector('.notice-toggle');
    const fullText = notice.dataset.full;

    if (!notice.querySelector('.notice-full') && fullText) {
      const fullEl = document.createElement('p');
      fullEl.className = 'notice-full';
      fullEl.textContent = fullText;
      notice.querySelector('.notice-preview')?.insertAdjacentElement('afterend', fullEl);
    }

    btn?.addEventListener('click', () => {
      const expanded = notice.classList.toggle('expanded');
      btn.textContent = expanded ? 'Show less' : 'Read more';
    });
  });
}

/* --------------------------------------------------------------------
   6. Search / filter notices on the notice board
   -------------------------------------------------------------------- */
function initNoticeSearch() {
  const input = document.getElementById('noticeSearch');
  const notices = Array.from(document.querySelectorAll('.notice'));
  const emptyMsg = document.getElementById('noticeEmpty');

  input?.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    let visibleCount = 0;

    notices.forEach((notice) => {
      const haystack = (
        (notice.querySelector('h3')?.textContent || '') +
        ' ' + (notice.dataset.tag || '') +
        ' ' + (notice.querySelector('.notice-preview')?.textContent || '')
      ).toLowerCase();

      const match = haystack.includes(q);
      notice.classList.toggle('hide', !match);
      if (match) visibleCount++;
    });

    if (emptyMsg) emptyMsg.hidden = visibleCount !== 0;
  });
}

/* --------------------------------------------------------------------
   7. Notification counter — reflects unread notices, clears on visit
   -------------------------------------------------------------------- */
function initNotificationCounter() {
  const navPill = document.getElementById('notifCount');
  const statPill = document.getElementById('statNotif');
  const notifLink = document.querySelector('a[href="#announcements"]');

  let unread = parseInt(navPill?.textContent || '0', 10);

  function render() {
    if (navPill) {
      if (unread > 0) {
        navPill.textContent = unread.toString();
        navPill.style.display = 'inline-block';
      } else {
        navPill.style.display = 'none';
      }
    }
    if (statPill) statPill.textContent = unread.toString();
  }

  notifLink?.addEventListener('click', () => {
    unread = 0;
    render();
  });

  render();
}

/* --------------------------------------------------------------------
   8. Highlight the active nav link based on scroll position
   -------------------------------------------------------------------- */
function initActiveNavOnScroll() {
  const sections = ['top', 'dashboard', 'announcements', 'services', 'profile']
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const links = Array.from(document.querySelectorAll('.nav-link'));

  function onScroll() {
    const scrollPos = window.scrollY + 140;
    let currentId = 'top';

    sections.forEach((section) => {
      if (section.offsetTop <= scrollPos) currentId = section.id;
    });

    links.forEach((link) => {
      const href = link.getAttribute('href')?.replace('#', '');
      link.classList.toggle('active', href === currentId);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* --------------------------------------------------------------------
   9. Quick service cards modal interaction
   -------------------------------------------------------------------- */
function initServiceCardClicks() {
  const modal = document.getElementById('serviceModal');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');

  const serviceDetails = {
    attendance: {
      title: 'Attendance Overview',
      desc: 'Your current overall attendance is 91% across 6 enrolled courses. You meet all academic eligibility requirements for Semester 3.',
      action: 'View Detailed Attendance Record'
    },
    registration: {
      title: 'Course Registration',
      desc: 'Pre-registration for Semester 4 electives opens on 25 August 2026. Make sure to consult your academic advisor.',
      action: 'Open Course Catalog'
    },
    fees: {
      title: 'Semester Fee Clearance',
      desc: 'Semester 3 fee status: Clear (No outstanding dues). Next installment deadline: 20 August 2026.',
      action: 'Download Payment Receipt'
    },
    transcript: {
      title: 'Official Academic Transcript',
      desc: 'Request a digitally signed PDF copy of your official grade transcript for Semester 1 and 2.',
      action: 'Request Digital Transcript'
    },
    library: {
      title: 'University Library Portal',
      desc: 'You have 2 books currently checked out. Extended 24-hour reading room access is enabled.',
      action: 'Reserve Study Station'
    },
    timetable: {
      title: 'Semester 3 Timetable',
      desc: 'Your active schedule includes 5 classes today. Room allocations are updated daily.',
      action: 'Download Full Timetable PDF'
    },
    grades: {
      title: 'Grade Report',
      desc: 'Semester 2 CGPA: 8.7 / 10.0 (Ranked Top 5% in Computer Science & Engineering).',
      action: 'View Grade Sheet'
    },
    support: {
      title: 'Campus IT & Help Desk',
      desc: 'Need assistance with Wi-Fi, lab credentials, or portal access? Our team is available Mon-Sat 9AM-6PM.',
      action: 'Submit Support Ticket'
    }
  };

  document.querySelectorAll('.service-card').forEach((card) => {
    card.addEventListener('click', () => {
      const info = serviceDetails[card.dataset.service];
      if (info && modal && modalBody) {
        modalBody.innerHTML = `
          <h3 class="modal-title">${info.title}</h3>
          <p class="modal-desc">${info.desc}</p>
          <button class="modal-action-btn" onclick="document.getElementById('serviceModal').close()">${info.action}</button>
        `;
        modal.showModal();
      }
    });
  });

  modalClose?.addEventListener('click', () => modal?.close());
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.close();
  });
}

/* --------------------------------------------------------------------
   10. Highlight current schedule time slot
   -------------------------------------------------------------------- */
function highlightCurrentSchedule() {
  const rows = document.querySelectorAll('.tt-row');
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  rows.forEach((row) => {
    const timeStr = row.getAttribute('data-time');
    if (!timeStr) return;
    const [h, m] = timeStr.split(':').map(Number);
    const rowMinutes = h * 60 + m;

    if (Math.abs(currentMinutes - rowMinutes) < 60) {
      row.style.background = 'rgba(212, 163, 69, 0.12)';
      row.style.borderLeft = '3px solid var(--gold-500)';
    }
  });
}

/* ==========================================================================
   Lab 2 — REST API Integration (JSONPlaceholder)
   ========================================================================== */

// 11. Fetch and Display Student Profile (GET https://jsonplaceholder.typicode.com/users/1)
async function loadStudentProfile() {
  const nameEl = document.getElementById('studentName');
  const usernameEl = document.getElementById('studentUsername');
  const emailEl = document.getElementById('studentEmail');
  const phoneEl = document.getElementById('studentPhone');
  const deptEl = document.getElementById('studentDept');

  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users/1');
    if (!response.ok) {
      throw new Error('Unable to load data. Please try again.');
    }
    const user = await response.json();
    
    // Display dynamic API fields (name, username, email, phone)
    if (nameEl) nameEl.textContent = user.name;
    if (usernameEl) usernameEl.textContent = `@${user.username}`;
    if (emailEl) emailEl.textContent = user.email;
    if (phoneEl) phoneEl.textContent = user.phone;
    if (deptEl) deptEl.textContent = user.company ? user.company.name : 'Engineering & Applied Sciences';
  } catch (error) {
    console.error('Error fetching student profile:', error);
    if (nameEl) nameEl.textContent = 'Unable to load data. Please try again.';
    if (usernameEl) usernameEl.textContent = '—';
    if (emailEl) emailEl.textContent = '—';
    if (phoneEl) phoneEl.textContent = '—';
    if (deptEl) deptEl.textContent = '—';
  }
}

// 12. Fetch and Display Announcements (GET https://jsonplaceholder.typicode.com/posts?_limit=5)
async function loadAnnouncements() {
  const corkboard = document.getElementById('corkboard');
  const notifCountEl = document.getElementById('notifCount');
  const statNotifEl = document.getElementById('statNotif');

  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
    if (!response.ok) {
      throw new Error('Unable to load data. Please try again.');
    }
    const posts = await response.json();

    if (corkboard) {
      corkboard.innerHTML = posts.map((post) => `
        <article class="notice" data-tag="Notice #${post.id}" data-full="${post.body.replace(/"/g, '&quot;')}">
          <span class="notice-pin" aria-hidden="true"></span>
          <span class="notice-tag">Notice #${post.id}</span>
          <h3>${post.title}</h3>
          <p class="notice-preview">${post.body.slice(0, 80)}…</p>
          <button class="notice-toggle" type="button">Read more</button>
          <time class="notice-date">Post ID: ${post.id}</time>
        </article>
      `).join('');

      initNoticeToggle();
      initNoticeSearch();
    }

    if (notifCountEl) notifCountEl.textContent = posts.length;
    if (statNotifEl) statNotifEl.textContent = posts.length;

  } catch (error) {
    console.error('Error fetching announcements:', error);
    if (corkboard) {
      corkboard.innerHTML = '<p class="notice-empty" style="display:block; color:var(--crimson-500); font-weight:600;">Unable to load data. Please try again.</p>';
    }
  }
}

// 13. Fetch and Display Assignments (GET https://jsonplaceholder.typicode.com/todos?userId=1&_limit=5)
let globalTodos = [];

async function loadAssignments() {
  const container = document.getElementById('todosContainer');

  try {
    if (container) container.innerHTML = '<div class="stat-card"><p>Loading assignments from API...</p></div>';

    const response = await fetch('https://jsonplaceholder.typicode.com/todos?userId=1&_limit=5');
    if (!response.ok) {
      throw new Error('Unable to load data. Please try again.');
    }
    globalTodos = await response.json();
    
    // Apply current filter
    const filterSelect = document.getElementById('todoFilter');
    const filterVal = filterSelect ? filterSelect.value : 'all';
    applyTodoFilter(filterVal);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    if (container) {
      container.innerHTML = `
        <div class="stat-card" style="border-left: 4px solid var(--crimson-500)">
          <span class="stat-label">Error</span>
          <p style="margin: 8px 0; color: var(--crimson-500); font-weight:600;">Unable to load data. Please try again.</p>
        </div>`;
    }
  }
}

function applyTodoFilter(val) {
  if (val === 'completed') {
    renderAssignments(globalTodos.filter(t => t.completed));
  } else if (val === 'pending') {
    renderAssignments(globalTodos.filter(t => !t.completed));
  } else {
    renderAssignments(globalTodos);
  }
}

function renderAssignments(todos) {
  const container = document.getElementById('todosContainer');
  if (!container) return;

  if (todos.length === 0) {
    container.innerHTML = '<div class="stat-card"><p>No assignments match filter.</p></div>';
    return;
  }

  container.innerHTML = todos.map(todo => `
    <div class="stat-card" style="border-left: 4px solid ${todo.completed ? 'var(--sage-500)' : 'var(--gold-500)'}">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="stat-label">Assignment #${todo.id}</span>
        <span class="stat-note ${todo.completed ? 'stat-note--good' : 'stat-note--warn'}" style="font-weight:600;">
          ${todo.completed ? '✓ Completed' : '⏳ Pending'}
        </span>
      </div>
      <p style="font-size:0.95rem; font-weight:600; margin:12px 0 8px; text-transform:capitalize;">${todo.title}</p>
      <span class="stat-note">User ID: ${todo.userId}</span>
    </div>
  `).join('');
}

function initAssignmentInteractions() {
  const filterSelect = document.getElementById('todoFilter');
  const refreshBtn = document.getElementById('refreshTodosBtn');

  filterSelect?.addEventListener('change', (e) => {
    applyTodoFilter(e.target.value);
  });

  refreshBtn?.addEventListener('click', () => {
    loadAssignments();
  });
}

/* --------------------------------------------------------------------
   14. Lab 3 REST API: Student Management CRUD
   Base URL: http://localhost:3000 (Express.js) or http://localhost:8080 (Spring Boot)
   -------------------------------------------------------------------- */
const STUDENT_API_BASE = 'http://localhost:3000/students';
let globalStudents = [];

async function loadStudents() {
  const container = document.getElementById('studentsContainer');
  if (!container) return;

  try {
    container.innerHTML = '<div class="stat-card"><p>Loading students from REST API...</p></div>';

    const response = await fetch(STUDENT_API_BASE);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to load students`);
    }

    globalStudents = await response.json();
    renderStudents(globalStudents);
  } catch (error) {
    console.error('Error fetching students:', error);
    container.innerHTML = `
      <div class="stat-card" style="border-left: 4px solid var(--crimson-500); grid-column: 1 / -1;">
        <span class="stat-label">Backend Connection Notice</span>
        <p style="margin: 8px 0; color: var(--crimson-500); font-weight:600;">
          Unable to connect to Student REST API at <code>http://localhost:3000/students</code>.
        </p>
        <p style="font-size:0.85rem; color:var(--text-muted);">
          Make sure the Express server is running (<code>cd student-api-express &amp;&amp; npm start</code>).
        </p>
      </div>`;
  }
}

function renderStudents(studentsList) {
  const container = document.getElementById('studentsContainer');
  if (!container) return;

  if (studentsList.length === 0) {
    container.innerHTML = '<div class="stat-card" style="grid-column: 1 / -1;"><p>No student records found in in-memory store. Click "+ Add Student" to create one.</p></div>';
    return;
  }

  container.innerHTML = studentsList.map(student => `
    <div class="stat-card" style="border-left: 4px solid var(--gold-500); display:flex; flex-direction:column; justify-content:space-between;">
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span class="stat-label">Student ID #${student.id}</span>
          <span class="stat-note stat-note--good" style="font-weight:600;">Sem ${student.semester}</span>
        </div>
        <h3 style="font-size:1.15rem; margin:0 0 6px; color:var(--text);">${student.name}</h3>
        <p style="font-size:0.85rem; color:var(--text-muted); margin:0 0 4px;">📧 ${student.email}</p>
        <p style="font-size:0.85rem; font-weight:600; color:var(--gold-500); margin:0 0 12px;">📚 ${student.course}</p>
      </div>
      <div style="display:flex; gap:8px; margin-top:12px; border-top: 1px solid var(--border); padding-top: 10px;">
        <button type="button" class="notice-toggle" onclick="openEditStudent(${student.id})" style="flex:1; text-align:center;">Edit</button>
        <button type="button" class="notice-toggle" onclick="deleteStudentById(${student.id})" style="flex:1; text-align:center; color:var(--crimson-500); border-color:var(--crimson-500);">Delete</button>
      </div>
    </div>
  `).join('');
}

function initStudentCrud() {
  const refreshBtn = document.getElementById('refreshStudentsBtn');
  const openCreateBtn = document.getElementById('openCreateStudentBtn');
  const closeFormBtn = document.getElementById('closeStudentFormBtn');
  const cancelFormBtn = document.getElementById('cancelStudentFormBtn');
  const form = document.getElementById('studentForm');

  refreshBtn?.addEventListener('click', () => loadStudents());

  openCreateBtn?.addEventListener('click', () => {
    openStudentForm();
  });

  closeFormBtn?.addEventListener('click', () => {
    closeStudentForm();
  });

  cancelFormBtn?.addEventListener('click', () => {
    closeStudentForm();
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleStudentFormSubmit();
  });
}

function openStudentForm(student = null) {
  const formCard = document.getElementById('studentFormCard');
  const formTitle = document.getElementById('studentFormTitle');
  const formId = document.getElementById('studentFormId');
  const inputName = document.getElementById('inputStudentName');
  const inputEmail = document.getElementById('inputStudentEmail');
  const inputCourse = document.getElementById('inputStudentCourse');
  const inputSemester = document.getElementById('inputStudentSemester');
  const alertBox = document.getElementById('studentFormAlert');

  if (alertBox) alertBox.style.display = 'none';

  if (student) {
    if (formTitle) formTitle.textContent = `Edit Student #${student.id}`;
    if (formId) formId.value = student.id;
    if (inputName) inputName.value = student.name;
    if (inputEmail) inputEmail.value = student.email;
    if (inputCourse) inputCourse.value = student.course;
    if (inputSemester) inputSemester.value = student.semester;
  } else {
    if (formTitle) formTitle.textContent = 'Add New Student';
    if (formId) formId.value = '';
    if (inputName) inputName.value = '';
    if (inputEmail) inputEmail.value = '';
    if (inputCourse) inputCourse.value = '';
    if (inputSemester) inputSemester.value = '';
  }

  if (formCard) {
    formCard.style.display = 'block';
    formCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function closeStudentForm() {
  const formCard = document.getElementById('studentFormCard');
  if (formCard) formCard.style.display = 'none';
}

window.openEditStudent = function(id) {
  const student = globalStudents.find(s => s.id === id);
  if (student) {
    openStudentForm(student);
  }
};

window.deleteStudentById = async function(id) {
  if (!confirm(`Are you sure you want to delete student with ID #${id}?`)) return;

  try {
    const response = await fetch(`${STUDENT_API_BASE}/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to delete student.');
    }

    await loadStudents();
  } catch (error) {
    alert(`Delete Error: ${error.message}`);
  }
};

async function handleStudentFormSubmit() {
  const formId = document.getElementById('studentFormId').value;
  const name = document.getElementById('inputStudentName').value;
  const email = document.getElementById('inputStudentEmail').value;
  const course = document.getElementById('inputStudentCourse').value;
  const semester = parseInt(document.getElementById('inputStudentSemester').value, 10);
  const alertBox = document.getElementById('studentFormAlert');

  const isEdit = !!formId;
  const url = isEdit ? `${STUDENT_API_BASE}/${formId}` : STUDENT_API_BASE;
  const method = isEdit ? 'PUT' : 'POST';

  const payload = { name, email, course, semester };

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      if (alertBox) {
        alertBox.style.display = 'block';
        alertBox.style.background = '#fed7d7';
        alertBox.style.color = '#c53030';
        alertBox.innerHTML = `<strong>Error (${data.status || 400} ${data.error || 'Bad Request'}):</strong> ${data.message || 'Validation failed'}` + 
          (data.details ? `<br><small>${data.details.join(', ')}</small>` : '');
      }
      return;
    }

    closeStudentForm();
    await loadStudents();
  } catch (error) {
    if (alertBox) {
      alertBox.style.display = 'block';
      alertBox.style.background = '#fed7d7';
      alertBox.style.color = '#c53030';
      alertBox.textContent = `Network Error: ${error.message}`;
    }
  }
}




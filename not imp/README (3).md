# CampusConnect — Smart University Service Portal

A responsive, dashboard-style frontend prototype for a university service portal, built with semantic HTML, external CSS, and vanilla JavaScript on mock data. The interface is structured so each UI section can be wired to a real Web Service later with minimal rework.

## Project structure

```
CampusConnect/
├── index.html        Semantic page structure (nav, sections, footer)
├── css/
│   └── style.css      All styling — tokens, layout, components, responsive rules
├── js/
│   └── script.js       DOM interactions (theme, clock, search, expand/collapse, etc.)
├── assets/             Reserved for future icons/images
└── README.md
```

Open `index.html` in a browser — no build step or server required.

## Design notes

The page is framed as a physical **student ID card** and **notice board**, reflecting the two things a student actually carries and checks day to day:

- The welcome section renders as an ID card with a perforated stub showing a live clock, echoing a real campus ID.
- Announcements are styled as pinned notices on a corkboard, each expandable and searchable.
- Palette: deep ink navy, warm parchment, and a brass/gold accent — closer to a university seal than a generic SaaS theme.
- Type: **Fraunces** (display/serif) for headings, **Inter** for body text, **IBM Plex Mono** for data (times, IDs, tags).

## JavaScript features implemented

| # | Feature | Where |
|---|---|---|
| 1 | Theme switch (light/dark, persisted) | Nav bar toggle button |
| 2 | Greeting based on time of day | ID card |
| 3 | Live current date & time | ID card stub |
| 4 | Search / filter | Notice board |
| 5 | Expand / collapse | Each notice ("Read more") |
| 6 | Notification counter | Nav badge + summary card |
| 7 | Show / hide | Mobile nav menu |
| 8 | Active-section highlighting on scroll | Nav links |

(8 implemented in total — the brief asked for at least 3.)

## Future service mapping

All data on this page is currently mock/static, embedded directly in `index.html` and `script.js`. The table below maps each UI component to the Web Service endpoint the backend team is expected to expose, so integration is a matter of replacing mock arrays with `fetch()` calls.

| UI Component | Description | Future API Endpoint | Method |
|---|---|---|---|
| Welcome / ID card | Student name, ID, department, semester | `/api/student/profile` | GET |
| Attendance summary card | Attendance percentage | `/api/attendance` | GET |
| Active courses card | Enrolled course count | `/api/courses` | GET |
| Assignments due card | Pending assignment count | `/api/assignments` | GET |
| Upcoming exams card | Exam count and next date | `/api/exams` | GET |
| CGPA card | Cumulative GPA | `/api/grades/cgpa` | GET |
| Notifications card / nav badge | Unread notification count | `/api/notifications/unread-count` | GET |
| Today's timetable | Class schedule for current day | `/api/timetable?day=today` | GET |
| Notice board | Campus announcements | `/api/announcements` | GET |
| Upcoming events | Event calendar | `/api/events` | GET |
| Quick service: Attendance | Detailed attendance log | `/api/attendance` | GET |
| Quick service: Registration | Course registration | `/api/registration` | POST |
| Quick service: Fee Payment | Fee payment initiation | `/api/payment` | POST |
| Quick service: Transcript | Transcript request/download | `/api/transcript` | GET |
| Quick service: Library | Library catalog / borrow status | `/api/library` | GET |
| Quick service: Timetable | Full weekly timetable | `/api/timetable` | GET |
| Theme preference | Persisted UI theme | `/api/user/preferences` | PATCH |

## Learning outcomes covered

- Semantic HTML structure (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`)
- CSS custom properties, responsive grid/flex layout, hover and focus states
- DOM manipulation and event-driven interactivity in vanilla JavaScript
- Organizing a frontend project so it's ready to consume real Web Services later

# 🚀 Learnova Hackathon Sprint Plan (24h)

## Rules To Consider

- Strict UI tokens applied (Primary `#714b67`, Accent `#f3f4f6`, Base `#ffffff`).
- All Add/Edit actions must use modals; all Delete actions must have confirmation.
- Local Auth + Local DB required (no Supabase); currently using mock auth + mock data.
- Publishing: only published courses are visible to learners.
- Guests can browse (if allowed) but must sign in to start learning.

## ✅ Completed so far
- Next.js App Router + TypeScript + Tailwind scaffolded in repo root.
- Basic UI kit primitives created: Button/Card/Input/Modal/ConfirmDialog.
- Route groups created for `(learner)` and `(backoffice)`.
- Auth pages split into `/auth/sign-in` and `/auth/sign-up` (mock cookie session).
- Role-based protection added for `/backoffice/*` (instructor/admin only).
- Learner navbar shows Courses + auth status (Sign in / user + Logout).
- Learner discovery `/courses` implemented with dynamic CTA (Join/Start/Continue/Buy).
- Learner `/my-courses` implemented with progress cards + total points + badge (trimmed to 4 demo items).
- Learner `/profile` implemented with badge ladder (Newbie → Master).
- Learner course details `/courses/[courseId]` redesigned to match raw mockup (cover + thumbnail placeholders, progress/stats card, tabs, searchable content list).
- Learner player `/learn/[courseId]/[lessonId]` redesigned to match raw mockup (left course panel + right viewer pane).
- YouTube video embeds wired for video lessons (placeholder URLs supported).
- Proper quiz flow implemented (start → questions → results modal) with simple scoring.
- Quiz completion marks course as 100% complete across learner pages (demo persistence via httpOnly cookie + API route).
- Quiz points now sync into `/my-courses` + `/profile` totals (demo persistence via httpOnly cookie).
- Demo utility: “Reset progress” button on course details clears completion + points for a course.
- Visual polish: green progress indicators everywhere; paid price emphasized; “Enrolled” ribbon shown on catalog cards.

---

## Local Auth + Local DB (NEW requirement — no Supabase)

Goal: persist users (and later learning data) using a local database while **keeping the existing** `/api/auth/*` endpoints and the `learnova_session` cookie shape so current flows don’t break.

### L1) Database & ORM setup
- [ ] Pick DB engine for hackathon runtime:
    - SQLite via Prisma (fastest local setup)
    - OR Postgres local/Docker (best parity)
- [ ] Add Prisma to the project (`prisma/`, `schema.prisma`, migrations)
- [ ] Create seed script to insert demo users (learner/instructor/admin)
- [ ] Add `.env` with `DATABASE_URL` (+ app secret if signing sessions)

### L2) Auth persistence (compatible migration)
- [ ] Update `/api/auth/signup` to create a DB user (unique email) + hash password
- [ ] Update `/api/auth/login` to verify password hash against DB
- [ ] Keep `/api/auth/me` + `/api/auth/logout` behavior unchanged
- [ ] (Optional but recommended) Sign the session cookie to prevent tampering (keep same session payload contract)

### L3) Learning persistence (incremental, after L1–L2)
- [ ] Move reviews persistence from localStorage → DB (per-course, per-user)
- [ ] Move quiz attempts from localStorage → DB (per-course, per-quiz, per-user)
- [ ] Move completion + points from cookies → DB (store by userId + courseId)
- [ ] Keep cookie-based behavior as a temporary fallback during migration


## Module A — Instructor/Admin Backoffice (Architecture Checklist)

### A1) Courses Dashboard (Kanban/List)
- [x] Backoffice route skeleton exists: `/backoffice`, `/backoffice/courses`
- [ ] Kanban view
- [ ] List view
- [ ] Search courses by name
- [ ] Course card info: title, tags, views, total lessons, total duration, published badge
- [ ] Actions: Edit, Share (generate/copy link)
- [ ] Create course: `+` button → popup modal → enter course name

### A2) Course Form (Edit Course)
- [x] Edit route skeleton exists: `/backoffice/courses/[courseId]`
- [ ] Header actions: Publish toggle, Preview (learner view), Add Attendees (invite), Contact Attendees, Upload image
- [ ] Fields: Title (required), Tags, Website (required when published), Responsible/Course Admin
- [ ] Tabs: Content / Description / Options / Quiz (4-tab layout)

### A3) Lessons / Content Management
- [ ] Lesson list (title + type)
- [ ] 3-dot menu actions: Edit, Delete (with confirmation)
- [ ] Add Content button opens Lesson Editor popup

### A4) Lesson Editor (Add/Edit)
- [ ] Modal with tabs: Content / Description / Additional Attachments
- [ ] Content tab: title (required), type selector (Video/Document/Image), responsible (optional)
- [ ] Video fields: URL + duration
- [ ] Document fields: upload + allow download toggle
- [ ] Image fields: upload + allow download toggle
- [ ] Description tab: text or rich editor
- [ ] Additional attachments: upload OR external link

### A5) Course Options (Access Rules)
- [ ] Visibility: Everyone / Signed In
- [ ] Access rules: Open / On Invitation / On Payment (+ price)
- [ ] Course admin selector

### A6) Quizzes (Instructor Side)
- [ ] Quizzes list per course
- [ ] Add Quiz (modal)
- [ ] Edit/Delete quiz (delete with confirmation)

### A7) Quiz Builder
- [ ] Left panel: question list + Add Question + Rewards
- [ ] Question editor: question text + multiple options + mark correct answer(s)
- [ ] Rewards system: 1st attempt → X, 2nd → Y, 3rd → Z, 4th+ → W

### A8) Reporting Dashboard
- [x] Reporting route skeleton exists: `/backoffice/reports` (placeholder cards/table)
- [ ] Overview cards wired to real data: Total Participants / Yet to Start / In Progress / Completed
- [ ] Table columns per architecture: Sr No, Course name, Participant, Enrolled date, Start date, Time spent, Completion %, Completed date, Status
- [ ] Show/hide columns (column picker)

---

## Module B — Learner Website/App (Architecture Checklist)

### B1) Courses Page
- [x] Navbar → Courses
- [x] Show published courses based on Visibility (Everyone / Signed In)
- [x] Access rules supported in UI/CTA (Open / Invitation / Payment)

### B2) My Courses (Dashboard)
- [x] Course cards (image placeholder, title, description, tags)
- [x] State-based buttons (Join / Start / Continue / Buy)
- [x] Search by course name
- [x] Profile panel (total points + badge level)

### B3) Course Detail Page
- [x] Overview tab (title, image placeholders, description)
- [x] Progress + total lessons + completed/incomplete counts
- [x] Lessons/content list with completion status + search
- [x] Lesson click opens player

### B4) Ratings & Reviews
- [x] Average rating + reviews list
- [x] Add/Edit review (logged-in users) via modal
    - MVP persistence: stored per-course in localStorage.

### B5) Full-Screen Lesson Player
- [x] Sidebar: course title + progress % + lesson list + toggle sidebar
- [x] Main area: title + description strip + viewer
- [x] Video viewer (YouTube embed)
- [x] Quiz viewer (one question per page)
- [ ] Document viewer (currently placeholder UI)
- [ ] Image viewer (currently placeholder UI)
- [ ] Attachments (currently UI hint only; no attachment data/rendering yet)

### B6) Quiz (Learner Side)
- [x] Intro screen (total questions, multiple attempts text, Start Quiz)
- [x] One-question-per-page flow + Proceed
- [x] Completion modal shows points earned
- [x] Attempt-based scoring reduction (1st attempt → X, 2nd → Y, etc.)
- [x] Persist attempts per quiz/course (localStorage)

### B7) Points & Completion
- [x] Badges based on total points (dashboard + profile view)
- [x] Course completion reflected (quiz completion marks course 100% for demo)
- [ ] “Complete course” button/action (explicit completion outside quiz)
- [ ] Points popup with progress to next rank (points are synced; popup lacks next-rank computation/UI)

---

## Phase 1: Foundation & Routing (Hours 0-3)
- [x] Initialize Next.js (App Router) + Tailwind CSS + Lucide Icons.
- [ ] Define shared Types/Interfaces (Course, Lesson, Quiz, User, Progress).
    - [x] Course + Enrollment + CourseProgress (mock-first)
    - [x] Lesson + Quiz (player + quiz flow)
    - [ ] Richer User/Points types (for real points engine + ranks)
- [x] Setup Directory Structure:
        - `/app/(backoffice)` -> Admin/Instructor routes.
        - `/app/(learner)` -> Website/App routes.
    - `/components/ui` -> Shared buttons, cards, inputs.
- [x] Implement Navbar with "Courses" menu.

## Phase 2: Instructor Backoffice (Hours 3-8)
- [ ] **Courses Dashboard:** Kanban/List toggle + search + card actions.
- [ ] **Course Form:** Header actions + fields + 4 tabs.
- [ ] **Content Management:** lesson list + 3-dot edit/delete (confirm) + Add Content (modal).
- [ ] **Lesson Editor:** video/doc/image + description + attachments.
- [ ] **Quiz Builder:** question editor + rewards system.

## Phase 3: Learner Experience & Player (Hours 8-14)
- [x] **My Courses Page:** Cards showing progress, tags, and dynamic buttons (Join/Start/Continue).
- [x] **Profile Panel:** Badge levels based on total points (Newbie to Master).
- [x] **Full-Screen Player:** Sidebar with % completion and collapsible state.
    - Video + Quiz implemented; Document/Image viewers still placeholders.
- [x] **Quiz Interface:** One-question-per-page logic with "Proceed" flow + results modal.

## Phase 4: Business Logic & Gamification (Hours 14-18)
- [ ] **Points Engine:** Implement reduction logic (Attempt 1: X, Attempt 2: Y, etc.).
    - Current: learner quiz uses attempt-based reduction + persisted attempts; backoffice quiz rewards config + full aggregation/reporting still pending.
- [x] **Access Guard:** Redirect users based on Visibility (Everyone/Signed In) and Access (Open/Invitation/Payment).
- [ ] **Reporting:** Instructor table showing time spent and completion %.

## Phase 5: Polish & Deployment (Hours 18-24)
- [ ] Final UI Audit against SVG mockups (especially quiz spacing/typography).
- [ ] Add Framer Motion for "Points Earned" popups (optional).
- [ ] Deploy to Vercel/Netlify.
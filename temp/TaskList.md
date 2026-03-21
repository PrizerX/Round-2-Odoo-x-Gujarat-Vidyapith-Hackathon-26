# 🚀 Learnova Hackathon Sprint Plan (24h)

## Rules To Consider

- Strict UI tokens applied (Primary `#714b67`, Accent `#f3f4f6`, Base `#ffffff`).
- All Add/Edit actions must use modals; all Delete actions must have confirmation.
- Local Auth + Local DB required (no Supabase); users are persisted in local SQLite (Prisma).
    - Course catalog/content is now DB-driven for Module B (published courses) so Module A changes flow through to learners.
    - Learning state is DB-first when signed-in (attempts/reviews/progress/points), with cookie/localStorage fallback kept for MVP robustness.
- This TaskList mirrors the provided Learnova Architecture sections (Module A + Module B).
- Publishing: only published courses are visible to learners.
- Guests can browse (if allowed) but must sign in to start learning.

## ✅ Completed so far
- Next.js App Router + TypeScript + Tailwind scaffolded in repo root.
- Basic UI kit primitives created: Button/Card/Input/Modal/ConfirmDialog.
- Route groups created for `(learner)` and `(backoffice)`.
- Auth pages split into `/auth/sign-in` and `/auth/sign-up` (DB-backed auth; session stored in `learnova_session` cookie).
- Branding polish: auth pages now show the horizontal PNG logo above the form card (not inside the card header/box).
- Role-based protection added for `/backoffice/*` (instructor/admin only).
- Backoffice course access scoping: admin can access all courses; instructors only see/edit courses they’re responsible for / course admin of.
- Learner navbar shows Courses + auth status (Sign in / user + Logout).
- Learner discovery `/courses` implemented with dynamic CTA (Join/Start/Continue/Buy), now backed by SQLite (Prisma) instead of mock catalog.
- Join-first UX: open courses require explicit Join before learning; player route is gated to prevent bypass.
- Learner `/my-courses` implemented with progress cards + total points + badge (trimmed to 4 demo items).
- Learner `/profile` implemented with badge ladder (Newbie → Master).
- Learner course details `/courses/[courseId]` redesigned to match raw mockup (banner + cover + square thumbnail placeholders, progress/stats card, tabs, searchable content list).
- Learner player `/learn/[courseId]/[lessonId]` redesigned to match raw mockup (left course panel + right viewer pane), now backed by SQLite lessons/quizzes.
- YouTube video embeds wired for video lessons (placeholder URLs supported).
- Proper quiz flow implemented (start → questions → results modal) with simple scoring.
- Quiz completion marks course as 100% complete across learner pages (demo persistence via httpOnly cookie + API route).
- Quiz points now sync into `/my-courses` + `/profile` totals (demo persistence via httpOnly cookie).
- Points now start at 0 (no mock base points).
- Demo utility: “Reset progress” button on course details clears completion + points for a course (DB + cookie/localStorage) and redirects back to details.
- Visual polish: green progress indicators everywhere; paid price emphasized; “Enrolled” ribbon shown on catalog cards.
- Course images now support 3 distinct URLs: cover (landscape), banner (wide header), thumbnail (square). Upload UI is deferred to Module A.
- Module A navbar updated to match mock layout (top tabs: Courses / Reporting / Settings).
- Module A course form page layout updated to match mock layout (publish/share widget, right-side image card placeholder, 4-tab section, content table layout).
- Module A Units/Sections added inside courses (group lessons by unit; CRUD in backoffice; learner grouping).
- Module A Quiz tab implemented (quiz list + Add Quiz modal + quiz builder: questions/choices + correct answer + rewards by attempt).
- Module A Reporting UI implemented with real Prisma data + overview cards, full table columns, and a show/hide column picker.
- Backoffice Settings is admin-only; instructors see it greyed/disabled in nav and cannot open the page.

---

## Local Auth + Local DB (NEW requirement — no Supabase)

Goal: persist users (and later learning data) using a local database while **keeping the existing** `/api/auth/*` endpoints and the `learnova_session` cookie shape so current flows don’t break.

### L1) Database & ORM setup
- [x] Pick DB engine for hackathon runtime:
    - [x] SQLite via Prisma (fastest local setup)
    - [ ] OR Postgres local/Docker (best parity)
- [x] Add Prisma to the project (`prisma/`, `schema.prisma`, migrations)
- [x] Create seed script to insert demo users (learner/instructor/admin)
- [x] Create core platform DB schemas (Course/Lesson/Quiz/Progress/Review/etc.) + seed a few demo rows (UI wiring pending)
- [x] Add `.env` with `DATABASE_URL` (+ app secret if signing sessions)

### L2) Auth persistence (compatible migration)
- [x] Update `/api/auth/signup` to create a DB user (unique email) + hash password
- [x] Update `/api/auth/login` to verify password hash against DB
- [x] Keep `/api/auth/me` + `/api/auth/logout` behavior unchanged
- [x] Auth UI branding: `LN_Horiz.png` displayed above the Sign in/Sign up form card; JSX/build issues resolved
- [ ] (Optional but recommended) Sign the session cookie to prevent tampering (keep same session payload contract)

### L3) Learning persistence (incremental, after L1–L2)
- [x] Move reviews persistence from localStorage → DB (per-course, per-user) via `/api/reviews` (localStorage kept as fallback/cache)
- [x] Move quiz attempts from localStorage → DB (per-course, per-quiz, per-user) via `/api/learning/attempt` (localStorage fallback)
- [x] Move completion + points from cookies → DB (store by userId + courseId)
- [x] Keep cookie-based behavior as a temporary fallback during migration


## Module A — Instructor/Admin Backoffice (Architecture Checklist)

### A1) Courses Dashboard (Kanban/List)
- [x] Backoffice route skeleton exists: `/backoffice`, `/backoffice/courses`
- [x] Kanban view
- [x] List view (DB-backed)
- [x] Search courses by name
    - [x] Instant search-as-you-type (client-side filter + debounced URL sync)
- [x] Course card info: title, tags, views, total lessons, total duration, published badge
- [x] Action: Edit
- [x] Action: Preview (learner view)
- [x] Action: Share (generate/copy link)
- [x] Create course: `+` button → popup modal → enter course name

### A2) Course Form (Edit Course)
- [x] Edit route skeleton exists: `/backoffice/courses/[courseId]`
- [x] Header actions: Publish toggle, Preview (learner view)
- [ ] Header actions: Add Attendees (invite), Contact Attendees
- [x] Header actions: Edit/clear images (thumbnail/cover/banner URLs)
- [x] Fields: Title (required), Tags, Website, Visibility, Access rules (+ price)
- [x] Fields: Responsible (assign instructor/admin)
- [x] Fields: Course Admin selector
- [x] Tabs: Content / Description / Options / Quiz (4-tab layout)

### A3) Lessons / Content Management
- [x] Lesson list (title + type)
- [x] 3-dot menu actions: Edit, Delete (with confirmation)
- [x] Add Content button opens Lesson Editor popup (basic add modal)

### A4) Lesson Editor (Add/Edit)
- [x] Modal with tabs: Content / Description / Additional Attachments
- [x] Content tab: title (required), type selector (Video/Document/Image), responsible (optional)
- [x] Video fields: URL + duration
- [x] Document fields: URL + allow download toggle
- [x] Image fields: URL + allow download toggle
- [x] Description tab: text
- [x] Additional attachments: upload (PDF only) OR external link

### A5) Course Options (Access Rules)
- [x] Visibility: Everyone / Signed In
- [x] Access rules: Open / On Invitation / On Payment (+ price)
- [x] Course admin selector

### A6) Quizzes (Instructor Side)
- [x] Quizzes list per course
- [x] Add Quiz (modal)
- [x] Edit/Delete quiz (delete with confirmation)

### A7) Quiz Builder
- [x] Left panel: question list + Add Question + Rewards
- [x] Question editor: question text + multiple options + mark correct answer(s)
- [x] Rewards system: 1st attempt → X, 2nd → Y, 3rd → Z, 4th+ → W
    - [x] Supports MSQ (multiple correct answers) + option deletion + inline option text editing

### A8) Reporting Dashboard
- [x] Reporting route exists: `/backoffice/reports`
- [x] Overview cards wired to real data: Total Participants / Yet to Start / In Progress / Completed
- [x] Table columns per architecture: Sr No, Course name, Participant, Enrolled date, Start date, Time spent, Completion %, Completed date, Status
- [x] Show/hide columns (column picker)

---

## Module B — Learner Website/App (Architecture Checklist)

### B1) Courses Page
- [x] Navbar → Courses
- [x] Show published courses based on Visibility (Everyone / Signed In)
- [x] Access rules supported in UI/CTA (Open / Invitation / Payment)
- [x] Quick search by course name/tags (instant search-as-you-type)
- [x] Join success popup (animated tick/confetti + View Course/My Courses)

### B2) My Courses (Dashboard)
- [x] Course cards (image placeholder, title, description, tags)
- [x] State-based buttons (Join / Start / Continue / Buy)
- [x] Search by course name
- [x] Profile panel (total points + badge level)

### B3) Course Detail Page
- [x] Overview tab (title, image placeholders: banner + square thumbnail, description)
- [x] Progress + total lessons + completed/incomplete counts
- [x] Lessons/content list with completion status + search
- [x] Lesson click opens player
- [x] Sequential lesson locking (must “Mark as complete” to unlock next)
- [x] Lesson status icons (completed=green, visited=orange, unvisited=gray)

### B4) Ratings & Reviews
- [x] Average rating + reviews list
- [x] Add/Edit review (logged-in users) via modal
    - L3 persistence: stored per-course in SQLite (Prisma) with localStorage fallback.

### B5) Full-Screen Lesson Player
- [x] Sidebar: course title + progress % + lesson list + toggle sidebar
- [x] Main area: title + description strip + viewer
- [x] Video viewer (YouTube embed)
- [x] Quiz viewer (one question per page)
- [x] Document viewer (PDF inline iframe when possible)
- [x] Image viewer
- [x] Attachments list + inline PDF viewer for PDF attachments
- [x] “Mark as complete” button required to unlock next lessons
- [x] Locked lessons are non-clickable in sidebar

### B6) Quiz (Learner Side)
- [x] Intro screen (total questions, multiple attempts text, Start Quiz)
- [x] One-question-per-page flow + Proceed
- [x] Completion modal shows points earned
- [x] Attempt-based scoring reduction (1st attempt → X, 2nd → Y, etc.)
- [x] Persist attempts per quiz/course (DB via Prisma; localStorage fallback)

### B7) Points & Completion
- [x] Badges based on total points (dashboard + profile view)
- [x] Course completion reflected (quiz completion marks course 100% for demo)
- [x] Points + completion prefer DB when signed-in (cookie fallback kept for MVP)
- [x] Lesson-level progress persistence (visited + completed) via `/api/learning/lesson-progress`
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
- [x] **Courses Dashboard:** Kanban/List toggle + search + card actions.
- [ ] **Course Form:** Header actions + fields + 4 tabs. (Attendees actions still pending)
- [x] **Content Management:** lesson list + 3-dot edit/delete (confirm) + Add Content (modal).
- [x] **Lesson Editor:** video/doc/image + description + attachments.
- [x] **Quiz Builder:** question editor + rewards system.

## Phase 3: Learner Experience & Player (Hours 8-14)
- [x] **My Courses Page:** Cards showing progress, tags, and dynamic buttons (Join/Start/Continue).
- [x] **Profile Panel:** Badge levels based on total points (Newbie to Master).
- [x] **Full-Screen Player:** Sidebar with % completion and collapsible state.
    - Video + Quiz + Document/Image viewers implemented.
- [x] **Quiz Interface:** One-question-per-page logic with "Proceed" flow + results modal.

## Phase 4: Business Logic & Gamification (Hours 14-18)
- [ ] **Points Engine:** Implement reduction logic (Attempt 1: X, Attempt 2: Y, etc.).
    - Current: learner quiz uses attempt-based reduction + persisted attempts; backoffice can now configure rewards per attempt; full aggregation/reporting still pending.
- [x] **Access Guard:** Redirect users based on Visibility (Everyone/Signed In) and Access (Open/Invitation/Payment).
- [x] **Reporting:** Instructor table showing time spent and completion %.

## Phase 5: Polish & Deployment (Hours 18-24)
- [ ] Final UI Audit against SVG mockups (especially quiz spacing/typography).
- [ ] Add Framer Motion for "Points Earned" popups (optional).
- [ ] Deploy to Vercel/Netlify.
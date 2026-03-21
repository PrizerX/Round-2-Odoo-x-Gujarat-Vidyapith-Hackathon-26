<p align=center>
<img width="1770" height="388" alt="Git_banner" src="https://github.com/user-attachments/assets/d3519bb7-3226-4829-9f94-21476fd5953e" />
</p>

# Learnova

Learnova is a responsive eLearning platform with two experiences: a Backoffice for instructors/admins and a Learner site/app. It’s built for the Learnova 24h hackathon with **local auth + local SQLite database (Prisma)**, so it runs end-to-end without external services.



## Product overview

- Backoffice: create and manage courses, lessons, quizzes, and track learner progress.
- Learner: browse and join courses, learn in a full-screen player, and earn points/badges.
- Reference UI: see temp/E-learning Hackathon Mockup - 24 hours.svg for the raw mockup direction.

## UI tokens and visual identity

These tokens apply to all components and views:

- Primary: #714b67 (headers, sidebars, primary buttons, active states)
- Accent: #f3f4f6 (card backgrounds, page backgrounds, hover effects)
- Base: #ffffff (main containers, inputs, modals)



<p align=center>
	<img width="600" alt="image" src="https://github.com/user-attachments/assets/8df5d358-0567-404d-a4fb-26a861301c50" />
	<img width="800" alt="image" src="https://github.com/user-attachments/assets/e1351568-faf1-416f-b81d-c4e1842d7447" />
	<img width="800 alt="image" src="https://github.com/user-attachments/assets/8b7d52bd-5a23-4b7e-99ee-5aec219b8be3" />
	<img width="800" alt="image" src="https://github.com/user-attachments/assets/59ac9bd6-c8b4-45ef-ab35-564376db1d02" />

</p>


## Tech Stack

This project is intentionally built “hackathon-first”: we ship UI + flows quickly while keeping everything self-contained (local DB + cookie session).

### Frontend framework

- Next.js (App Router)
	- Why: fast routing + layouts for the two experiences (Learner + Backoffice), and server components for auth-gated redirects without client flicker.
	- Why: built-in API routes used for auth + uploads so the project remains self-contained.

### Language & typing

- TypeScript
	- Why: keeps domain rules (visibility/access/payment, CTA state, progress calculations) correct while iterating quickly.
	- Why: keeps DB models and UI flows consistent (Prisma + API payloads map cleanly to TS models).

### Styling & UI system

- Tailwind CSS (v4)
	- Why: fast to iterate on strict mockup-driven layouts.
	- Why: easy to enforce Learnova tokens globally (Primary/Accent/Base) and keep consistent spacing/borders.

- Small internal UI primitives (`Button`, `Card`, `Modal`, `ConfirmDialog`, `Input`, `Badge`)
	- Why: the GUIDE requires consistent styling and behavior (all Add/Edit via modals, all Delete via confirmations).
	- Why: avoids heavy UI libraries for the hackathon timeline while keeping components reusable.

### Icons

- Lucide Icons (`lucide-react`)
	- Why: modern, consistent icon set (explicitly recommended in the GUIDE) and easy to theme.

### Auth (current prototype)

- DB-backed auth + cookie-based session
	- Implemented using Next.js API routes (`/api/auth/*`) + SQLite (Prisma).
	- Session is stored in the `learnova_session` httpOnly cookie.
	- Roles supported: learner / instructor / admin; `/backoffice/*` is instructor/admin only.

### Data layer (current prototype)

- SQLite (Prisma)
	- Courses, lessons (video/doc/image/quiz), quizzes/questions/options, progress/completions, quiz attempts, and reviews are persisted locally.
	- DB-first behavior is used when signed in; some views still keep a small localStorage/cookie fallback for MVP robustness.

### File uploads (PDF)

- PDF upload endpoint: `POST /api/backoffice/uploads/pdf`
	- Validates it’s a real PDF and stores it under `public/uploads/`.
	- Used for Lesson “Additional Attachments” and for Document lesson content uploads.

### Notes on “Allow download”

When `allowDownload` is disabled for a PDF, Learnova hides explicit download/open links and uses a best-effort PDF embed URL that hides the browser PDF toolbar in many viewers. This is a **UX control**, not DRM: if the browser can render the PDF, a determined user can still save it (network/devtools/cache).

### Quality & tooling

- ESLint + `eslint-config-next`
	- Why: catches common React/Next issues early (especially around server/client boundary).

- React 19 + React Compiler plugin (bundled in the setup)
	- Why: modern React runtime and performance defaults; keeps the prototype responsive as UI grows.

## Key modules

### Backoffice

- Courses dashboard with a Kanban/List toggle, searchable by course name.
- Course editor with four tabs: Content, Description, Options, Quiz.
- Quiz builder with multi-attempt scoring (points reduce per attempt).
- Reporting dashboard with overview cards and a customizable table.

### Learner

- Courses discovery with dynamic actions: Join, Start, Continue, or Buy.
- Gamification: total points and badge levels (Newbie to Master).
- Full-screen lesson player with collapsible sidebar and media viewer.

## Core business rules

- Only published courses are visible to learners.
- Invitation-only courses are accessible only to enrolled users.
- Lessons complete after viewing or passing a quiz and update course progress.
- All Add/Edit actions use modals; all Delete actions require confirmation.

## Current status

This is the live progress snapshot mirrored from [temp/TaskList.md](temp/TaskList.md).

### ✅ Completed

- App scaffold: Next.js App Router + TypeScript (strict) + Tailwind.
- UI kit primitives: Button/Card/Input/Modal/ConfirmDialog.
- Route groups: `(learner)` + `(backoffice)`.
- Local auth + local DB:
	- SQLite via Prisma + migrations + seed users.
	- DB-backed `/api/auth/*` + `learnova_session` cookie.
	- Learning persistence in DB (reviews, attempts, completion/points) with fallback caching where needed.

#### Module A — Backoffice

- Courses dashboard (Kanban + List) with instant search.
- Course editor (Content / Description / Options / Quiz) + publish toggle + image URLs (cover/banner/thumbnail).
- Units/Sections grouping + CRUD.
- Lesson Editor (Add/Edit modal) with tabs: Content / Description / Additional Attachments.
	- Lesson types: Video / Document / Image.
	- Attachments: external link OR PDF upload (PDF only).
	- Document lesson content supports URL OR PDF upload.
- Quizzes:
	- Quiz builder: questions + options + attempt-based rewards.
	- Option deletion + inline option text editing.
	- MSQ support (multiple correct answers) via per-question `allowMultipleCorrect`.

#### Module B — Learner

- Courses discovery `/courses` (published-only + visibility/access gating).
- Join-first UX (prevents bypassing the player without enrollment).
- `/my-courses` dashboard: progress cards + points + badge.
- `/profile` badge ladder.
- Course details `/courses/[courseId]` redesigned to match mock.
- Full-screen player `/learn/[courseId]/[lessonId]`:
	- Video (YouTube embed), Image viewer, Document viewer (PDF inline iframe when possible).
	- Attachments list + inline PDF viewer modal.
- Quiz UX: intro → question flow → results modal; attempts persisted; attempt-based scoring supported.

### 🟡 In progress / pending

- Backoffice course header actions: Add Attendees / Contact Attendees.
- Reporting dashboard: wire overview cards + participant table to real data (time spent, completion %, status).
- Learner: explicit “Complete course” action outside quiz.
- Points popup with “points to next rank” UI.
- (Optional) Sign session cookie to reduce tampering risk.

### Full TaskList snapshot

<details>
<summary>Open the full hackathon TaskList</summary>

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
- Module A navbar updated to match mock layout (top tabs: Courses / Reporting / Setting).
- Module A course form page layout updated to match mock layout (publish/share widget, right-side image card placeholder, 4-tab section, content table layout).
- Module A Units/Sections added inside courses (group lessons by unit; CRUD in backoffice; learner grouping).
- Module A Quiz tab implemented (quiz list + Add Quiz modal + quiz builder: questions/choices + correct answer + rewards by attempt).

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
- [x] Overview tab (title, image placeholders: banner + square thumbnail, description)
- [x] Progress + total lessons + completed/incomplete counts
- [x] Lessons/content list with completion status + search
- [x] Lesson click opens player

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
- [ ] **Lesson Editor:** video/doc/image + description + attachments.
- [x] **Quiz Builder:** question editor + rewards system.

## Phase 3: Learner Experience & Player (Hours 8-14)
- [x] **My Courses Page:** Cards showing progress, tags, and dynamic buttons (Join/Start/Continue).
- [x] **Profile Panel:** Badge levels based on total points (Newbie to Master).
- [x] **Full-Screen Player:** Sidebar with % completion and collapsible state.
	- Video + Quiz implemented; Document/Image viewers still placeholders.
- [x] **Quiz Interface:** One-question-per-page logic with "Proceed" flow + results modal.

## Phase 4: Business Logic & Gamification (Hours 14-18)
- [ ] **Points Engine:** Implement reduction logic (Attempt 1: X, Attempt 2: Y, etc.).
	- Current: learner quiz uses attempt-based reduction + persisted attempts; backoffice can now configure rewards per attempt; full aggregation/reporting still pending.
- [x] **Access Guard:** Redirect users based on Visibility (Everyone/Signed In) and Access (Open/Invitation/Payment).
- [ ] **Reporting:** Instructor table showing time spent and completion %.

## Phase 5: Polish & Deployment (Hours 18-24)
- [ ] Final UI Audit against SVG mockups (especially quiz spacing/typography).
- [ ] Add Framer Motion for "Points Earned" popups (optional).
- [ ] Deploy to Vercel/Netlify.

</details>

## Quiz scoring (MCQ & MSQ)

Learnova uses **exact-match scoring** per question and an **attempt-based points** multiplier.

### MCQ vs MSQ

- **MCQ (single-correct)**: `allowMultipleCorrect = false`
	- Learner can select exactly one option in the UI.
	- The answer is correct only if the selected index matches the single correct index.

- **MSQ (multi-correct)**: `allowMultipleCorrect = true`
	- Learner can select multiple options.
	- The answer is correct only if the selected set matches the correct set **exactly**:
		- must include all correct options
		- must include no extra (incorrect) options

Formally, for each question:

$$\text{correct}(q)=\bigl(S_q = C_q\bigr)$$

Where $S_q$ is the set of selected option indices and $C_q$ is the set of correct option indices.

### Points per attempt

The quiz defines a base `pointsPerCorrect` and can optionally provide `pointsPerCorrectByAttempt`:

- If `pointsPerCorrectByAttempt` is configured:
	- attempt 1 uses index 0, attempt 2 uses index 1, …
	- attempts beyond the array use the last value.

- Otherwise, if multiple attempts are allowed, the learner quiz uses a default reduction curve:
	- multipliers: `[1, 0.8, 0.6, 0.4]` (attempt 4+ stays at 0.4)

Total quiz points are computed as:

$$\text{rawPoints}=\text{correctCount} \times \text{pointsPerCorrectForAttempt}$$

Then clamped for “earned points” UX:

$$\text{points}=\min\bigl(100,\max(5,\text{rawPoints})\bigr)$$

## Demo accounts

The app uses a DB-backed auth flow. These credentials are intentionally not shown inside the UI.

- Learner: learner@learnova.dev / Learner@123
- Instructor: instructor@learnova.dev / Instructor@123
- Admin: admin@learnova.dev / Admin@123

Note: You can also create new users via Sign up (persisted in SQLite).

## Local development

Install dependencies and run the dev server:

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000.

## Project structure

- src/app/(backoffice) for admin and instructor routes.
- src/app/(learner) for learner routes and player views.
- src/components/ui for shared UI primitives.
- src/lib for auth, domain logic, and shared utilities.
- prisma/ for schema + migrations + seed.

Folder structure (excluding `temp/`, build outputs, and dependencies):

```text
.
├─ public/
│  └─ images/
├─ src/
│  ├─ app/
│  │  ├─ (learner)/
│  │  │  ├─ courses/
│  │  │  │  ├─ [courseId]/
│  │  │  │  │  ├─ course-details-client.tsx
│  │  │  │  │  └─ page.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ learn/
│  │  │  │  └─ [courseId]/
│  │  │  │     └─ [lessonId]/
│  │  │  │        ├─ page.tsx
│  │  │  │        └─ player-client.tsx
│  │  │  ├─ my-courses/
│  │  │  │  ├─ my-courses-client.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ profile/
│  │  │  │  └─ page.tsx
│  │  │  └─ layout.tsx
│  │  ├─ (backoffice)/
│  │  │  ├─ backoffice/
│  │  │  │  ├─ courses/
│  │  │  │  │  ├─ [courseId]/
│  │  │  │  │  │  └─ page.tsx
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ reports/
│  │  │  │  │  └─ page.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ courses/
│  │  │  │  └─ [courseId]/
│  │  │  ├─ reports/
│  │  │  └─ layout.tsx
│  │  ├─ api/
│  │  │  ├─ auth/
│  │  │  │  ├─ login/route.ts
│  │  │  │  ├─ logout/route.ts
│  │  │  │  ├─ me/route.ts
│  │  │  │  └─ signup/route.ts
│  │  │  └─ learning/
│  │  │     ├─ complete/route.ts
│  │  │     └─ reset/route.ts
│  │  ├─ auth/
│  │  │  ├─ sign-in/
│  │  │  │  ├─ page.tsx
│  │  │  │  └─ sign-in-client.tsx
│  │  │  ├─ sign-up/
│  │  │  │  ├─ page.tsx
│  │  │  │  └─ sign-up-client.tsx
│  │  │  └─ page.tsx
│  │  ├─ favicon.ico
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ components/
│  │  ├─ auth/
│  │  └─ ui/
│  └─ lib/
│     ├─ auth/
│     ├─ data/
│     ├─ domain/
│     └─ learning/
├─ package.json
└─ README.md
```

## Roadmap (short)

- Wire reporting dashboard to real analytics (participants, time spent, completion, status).
- Implement attendee/invitation flows in the backoffice.
- Improve “points to next rank” UX + dedicated points popups.

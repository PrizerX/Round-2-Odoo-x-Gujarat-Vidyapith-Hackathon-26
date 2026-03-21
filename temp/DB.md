# DB & Data Notes (for Evaluators)

This project is a hackathon MVP, so it uses a **hybrid** approach:
- **Local database (SQLite via Prisma)** for **auth + learning persistence**:
  - Users + roles
  - Courses/lessons/quizzes (seeded demo rows)
  - Enrollments + progress + quiz attempts + reviews
  - Completion + earned points (DB-first)
- **In-repo mock datasets** still power most catalog UI (until Module A backoffice wiring)
- **httpOnly cookies** and **localStorage** remain as **fallback/cache** for MVP stability

The goal was to satisfy: **“Use local systems for auth and database (no Supabase)”**, while not breaking the existing UI flows.

---

## If you’re new to databases: the 10-minute crash course (in this project’s context)

### What a “database” means here
In this project, a database is just a **local file** (SQLite) that stores structured data.

- **SQLite** = a single `.db` file on disk (`prisma/dev.db`)
- A **table** = like an Excel sheet
- A **row** = one record (e.g., one user)
- A **column** = one field (e.g., email, role)

### Why we didn’t use API keys this time
API keys are great when you call an external service.

Here, the requirement is: **“use local systems”**.
So we needed a local way to store users + passwords. That’s why we used:
- **Prisma** (ORM) to talk to the DB
- **SQLite** (local DB engine) to store data

### Key words you can confidently use
- **Schema**: definition of tables + columns (what fields exist)
- **Migration**: versioned change to the schema (Prisma generates SQL)
- **Seed**: insert demo data (we seed 3 demo users)
- **ORM (Prisma)**: lets you write TypeScript like `prisma.user.findUnique(...)` instead of raw SQL

### Big picture: “hybrid MVP” is the main idea
The database now has **auth + full scaffolding tables** (Course/Lesson/Quiz/etc.), but the current UI still reads most learning data from **mock arrays + cookies + localStorage**.

- **DB is actively used for:** Auth (users + passwordHash)
- **DB tables exist (seeded) for:** Courses, lessons, quizzes, enrollments, purchases, reviews, progress, attempts
- **UI still uses MVP storage for now:** course catalog + generated lessons + cookie/localStorage persistence

---

## 0) Project schema (what tables exist right now?)

### Current DB schema (Prisma)
Right now the database contains:
- **Auth table:** `User`
- **Platform tables (scaffolding):** `Course`, `Lesson`, `Quiz`, `Question`, `Option`, `Tag`, `CourseTag`, `Enrollment`, `Purchase`, `Review`, `CourseProgress`, `LessonProgress`, `QuizAttempt`, `Attachment`, `QuizRewardRule`

### Full schema list (enums + models) with short descriptions

**Enums**
- `UserRole`: user type (`learner`, `instructor`, `admin`)
- `CourseVisibility`: who can view a published course (`everyone`, `signed_in`)
- `CourseAccessRule`: how access is granted (`open`, `invitation`, `payment`)
- `LessonType`: content type (`video`, `doc`, `image`, `quiz`)
- `EnrollmentStatus`: enrollment state (`invited`, `enrolled`)
- `PurchaseStatus`: payment state (`pending`, `paid`, `refunded`)
- `AttachmentKind`: attachment type (`file`, `link`)

**Models (tables)**
- `User`: login identity; stores `email`, `name`, `role`, `passwordHash`.
- `Course`: publishable course; metadata + access rules; owned by a responsible instructor.
- `Tag`: unique tag names.
- `CourseTag`: many-to-many join linking `Course` ↔ `Tag`.
- `Lesson`: ordered course content items; can be video/doc/image/quiz.
- `Attachment`: extra files/links attached to a lesson.
- `Quiz`: quiz for a course (optionally linked 1:1 to a lesson).
- `QuizRewardRule`: per-attempt scoring config (attempt 1 → X, 2 → Y, ...).
- `Question`: quiz question (ordered).
- `Option`: answer choice for a question; marks `isCorrect`.
- `Enrollment`: which user is invited/enrolled in which course.
- `Purchase`: paid access record for payment-based courses.
- `Review`: 1 review per user per course (rating + text).
- `CourseProgress`: per user per course progress snapshot (percent, last lesson, timestamps).
- `LessonProgress`: per user per lesson progress (completed + time).
- `QuizAttempt`: one attempt row per try (attemptNumber, correctness, points awarded).

This is intentional for the hackathon MVP:
- We moved **auth** to a real local DB first.
- Then we added the missing **schemas** required by the Learnova Architecture, so we can proceed with Module A and L3 without redesigning later.
- The UI wiring to these new tables is the next step (Module A + L3).

The schema source-of-truth is:
- [prisma/schema.prisma](prisma/schema.prisma)

The important part of the schema looks like this (simplified):

```prisma
enum UserRole {
  learner
  instructor
  admin
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  role         UserRole @default(learner)
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### How to “show schema” live (2 easy ways)

1) Prisma Studio (recommended for demo)
- Run: `npm run db:studio`
- It prints a URL like `http://localhost:5555` or `http://localhost:5556`.
- Open that URL to show the `User` table, rows, and fields.

Note: Keep the terminal running while you demo Studio.

Extra note (VS Code / tool behavior): Prisma Studio is a long-running process. In some environments you may see a non-zero “exit code” even though Studio printed “Prisma Studio is up on http://localhost:5556”. If that URL is printed, Studio is running—open the URL in a browser.

2) SQLite CLI
- DB file: `prisma/dev.db`
- Commands (example):
  - `sqlite3 prisma/dev.db`
  - `.tables`
  - `.schema User`

---

## 0.1) Are we following the Learnova Architecture schemas?

### Short honest answer
- We are following the architecture **functionally for Module B UI/flows**.
- The **required DB schemas are now created** (Course/Lesson/Quiz/etc.) and seeded so you can show tables in Prisma Studio.
- Course creation + content management (Module A) is still pending, so the learner UI is still using mock generation for most content.

This is normal for a hackathon MVP: ship Module B screens first using mock content, then replace the mock layer with DB-backed Module A.

### What schemas are required by the architecture (ideal DB tables)
Based on the provided Learnova Architecture (Module A + Module B), a “full” DB schema would typically include:

1) **Auth / Roles**
- `User` (✅ implemented)

2) **Course publishing & catalog**
- `Course` (title, description, published flag, visibility, accessRule, price, thumbnail/image, responsible/admin)
- `Tag` and `CourseTag` (or a simple string list column)

3) **Course content (lessons)**
- `Lesson` (courseId, title, type: video/doc/image/quiz, order)
- `Attachment` (lessonId, fileUrl/filePath, allowDownload)

4) **Quizzes & rewards**
- `Quiz` (courseId or lessonId)
- `Question` (quizId)
- `Option` (questionId)
- `QuizRewardRule` (points for attempt 1/2/3/4+)

5) **Access control**
- `Enrollment` (invited/joined)
- `Purchase` (payment state, amount, timestamps)

6) **Learning progress & reporting**
- `CourseProgress` / `LessonProgress`
- `QuizAttempt` (attempt number, score, points earned, timestamps)
- Optional `TimeSpent` logs (for reporting dashboard)

7) **Ratings & reviews**
- `Review` (courseId, userId, rating, text, createdAt)

### What we have today (current reality)

**In SQLite DB (Prisma):**
- Auth + platform scaffolding tables exist (see section 0)
- Demo rows are seeded for a few courses/lessons/quizzes so Prisma Studio is not empty

**Still mock-driven in the running UI (MVP):**
- Course catalog cards and “CTA logic” are still driven by mock course definitions.
- Payment and invitation flows (Buy/Invite) are still mostly UI-only (no real payment gateway / invite emails).

**Now DB-backed (L3):**
- Reviews: stored in SQLite (API: `/api/reviews`)
- Quiz attempts: stored in SQLite (API: `/api/learning/attempt`)
- Completion + earned points: stored in SQLite (API: `/api/learning/complete` + helpers prefer DB when signed in)
- Progress snapshot: on player visit we upsert `CourseProgress` (lastLessonId + computed %)

### Why mock data is still used (and why it’s OK for now)
The architecture expects Module A to create real courses. We haven’t implemented the **admin UI + wiring** yet (even though the DB tables now exist).

So for Module B, we used mock course records with stable IDs (e.g., `course_1`) so:
- routes work (`/courses/[courseId]`, `/learn/[courseId]/[lessonId]`)
- points/completion can map to a courseId
- the learner experience can be fully demoed without waiting for the admin panel

When Module A is implemented, those mock course records will be replaced by DB-backed `Course/Lesson/Quiz/...` tables.

## 0.2) App “data schema” (courseId / lessonId / quizId) — even without Module A

Evaluators sometimes say “show schema” meaning “what IDs and fields are you using in the app?”.

In this MVP, Module A (admin course creation) is not built yet, so **courses/lessons/quizzes are generated from mock data**, but they still have stable IDs.

### Where courseIds come from
- Defined in mock data: [src/lib/data/mock-learning.ts](src/lib/data/mock-learning.ts)
- Examples: `course_1`, `course_4`, `course_7`, etc.

Also (new): these same `course_*` IDs now exist as seeded rows in the DB `Course` table, so you can show them in Prisma Studio.

These IDs are used everywhere:
- URLs like `/courses/[courseId]` and `/learn/[courseId]/[lessonId]`
- Cookies/localStorage keys use `courseId` so points and completion map to the right course

### Where lessonIds and quizIds come from
Lessons are generated for the player at runtime in:
- [src/app/(learner)/learn/[courseId]/[lessonId]/page.tsx](src/app/(learner)/learn/[courseId]/[lessonId]/page.tsx)

In that file:
- lessons are built as `lesson_1`, `lesson_2`, … up to `lessonCount`
- the final lesson is a `quiz`
- quiz id is generated as `quiz_${courseId}`

So even without Module A, IDs exist because the MVP seeds them in code.

---

## 1) What is stored where?

### A) SQLite DB (Prisma) — persisted on disk
**Purpose:** store real users for login/signup and synced learning state for signed-in users.

- DB engine: **SQLite**
- ORM: **Prisma**
- Schema: [prisma/schema.prisma](prisma/schema.prisma)
- DB file (dev): `prisma/dev.db` (created after migrate)

**Tables currently used at runtime:**
- `User` (login/signup)
- `Course`, `Quiz` (exist so learning persistence can reference stable courseIds/quizIds)
- `Enrollment` (auto-created for open courses when a signed-in user starts learning)
- `CourseProgress` (updated on player visits + completion)
- `QuizAttempt` (attempt count + awarded points)
- `Review` (ratings and reviews)

**User fields (current):**
- `id` (string)
- `email` (unique)
- `name`
- `role` (`learner` | `instructor` | `admin`)
- `passwordHash` (bcrypt hash)
- `createdAt`, `updatedAt`

### B) Mock datasets (in code) — “demo content”
**Purpose:** fast, deterministic demo of course catalog + learning screens.

Main dataset file:
- [src/lib/data/mock-learning.ts](src/lib/data/mock-learning.ts)

Contains mock data like:
- Courses
- Enrollments
- Purchases
- Progress per course
- Demo base points (starting points)

### C) Cookies (httpOnly) — fallback server persistence
**Purpose:** keep the MVP working even if DB rows are missing or when signed-out.

Cookies used:
- `learnova_completed_courses`
  - JSON array of courseIds the learner completed
- `learnova_course_points`
  - JSON map `{ [courseId]: pointsNumber }`

Implementation:
- Write/clear via API routes:
  - [src/app/api/learning/complete/route.ts](src/app/api/learning/complete/route.ts)
  - [src/app/api/learning/reset/route.ts](src/app/api/learning/reset/route.ts)
- Read helpers:
  - [src/lib/learning/completed-courses.ts](src/lib/learning/completed-courses.ts)
  - [src/lib/learning/points.ts](src/lib/learning/points.ts)

Why cookies are still kept?
- They’re **server-set** and survive refresh.
- They provide a safe fallback when demo courseIds aren’t present in DB (during hackathon iterations).

### D) localStorage — client fallback/cache
**Purpose:** offline-ish fallback so the UI still works if API calls fail.

1) Reviews (fallback)
- Key: `learnova_reviews_${courseId}`
- File: [src/app/(learner)/courses/[courseId]/course-details-client.tsx](src/app/(learner)/courses/[courseId]/course-details-client.tsx)

2) Quiz attempts (fallback)
- Key: `learnova_quiz_attempt_${courseId}:${quizId}`
- File: [src/app/(learner)/learn/[courseId]/[lessonId]/player-client.tsx](src/app/(learner)/learn/[courseId]/[lessonId]/player-client.tsx)

---

## 2) New learner user: can they see/enroll and is progress synced?

### What works now
- A new user created via signup is stored in `User` (SQLite) and can log in.
- They can browse published courses (visibility rules still apply).
- For **open** courses, when they start the player, the app auto-creates an `Enrollment` row and writes `CourseProgress` so their progress is synced in DB.
- Quiz attempts, reviews, completion, and earned points are persisted in DB for signed-in users.

### Current limitations (MVP honesty)
- **Invitation** courses still require an actual invite/enrollment record (we’re not building the full invite workflow in this hackathon MVP).
- **Payment** courses still don’t have a real purchase flow; without a `Purchase` row, the learner is blocked from the player (as intended by rules).

---

## 2) Local DB setup details

### Where is the SQLite DB file?
Configured through `.env` via `DATABASE_URL`:
- `DATABASE_URL="file:./dev.db"`

Important note:
- With Prisma + SQLite, `file:./dev.db` is resolved relative to the **Prisma schema folder**, so the DB lives at:
  - `prisma/dev.db`

### Prisma files
- Schema: [prisma/schema.prisma](prisma/schema.prisma)
- Migrations: `prisma/migrations/*`
- Seed script: [prisma/seed.ts](prisma/seed.ts)

### Commands (npm scripts)
Run these from the project root:
- Migrate DB: `npm run db:migrate`
- Seed demo users: `npm run db:seed`
- Open DB UI (Prisma Studio): `npm run db:studio`

What these commands do (beginner explanation):
- `db:migrate` creates/updates the SQLite tables based on `schema.prisma`
- `db:seed` inserts the demo learner/instructor/admin users
- `db:studio` opens a UI to browse the DB (no coding required)

---

## 3) Seeded demo accounts (for judging/demo)

Seed script: [prisma/seed.ts](prisma/seed.ts)

It inserts/updates 3 accounts with **stable IDs** (important because mock learning data expects these IDs):

- Learner
  - id: `u_learner_1`
  - email: `learner@learnova.dev`
  - password: `Learner@123`

- Instructor
  - id: `u_instructor_1`
  - email: `instructor@learnova.dev`
  - password: `Instructor@123`

- Admin
  - id: `u_admin_1`
  - email: `admin@learnova.dev`
  - password: `Admin@123`

Passwords are stored as **bcrypt hashes** in DB (not plain text).

---

## 4) Authentication: how it works (local-only)

### Endpoints
Auth endpoints live under:
- `src/app/api/auth/*`

Key routes:
- `/api/auth/signup`
  - Creates user in DB (unique email)
  - Hashes password with bcrypt
  - Sets `learnova_session` cookie
- `/api/auth/login`
  - Finds user by email in DB
  - Verifies password via bcrypt
  - Sets `learnova_session` cookie
- `/api/auth/me` and `/api/auth/logout`
  - Keep the existing behavior used by the frontend

### What actually happens during login (step-by-step)
1) You submit email/password from the sign-in page.
2) API route `/api/auth/login` runs on the server.
3) It loads the user from SQLite using Prisma.
4) It checks the password using bcrypt.
5) On success, it creates a session object and sets the `learnova_session` cookie.
6) The browser automatically sends that cookie on next requests, so pages know you’re logged in.

### Session cookie (`learnova_session`)
Session helper: [src/lib/auth/session.ts](src/lib/auth/session.ts)

What it is:
- A cookie containing a **base64url JSON payload** like:
  - user id / email / role / name

Tradeoff (important for evaluators):
- In this MVP, the session cookie is **not cryptographically signed**.
- There’s an optional TaskList item to sign it to prevent tampering.

---

## 5) Points & completion model (current MVP)

**Total points shown in UI** = `base points (mock)` + `earned points (cookie)`

- Base points (demo “starting points”):
  - stored in mock data (ex: learner starts at **57**)
  - file: [src/lib/data/mock-learning.ts](src/lib/data/mock-learning.ts)

- Earned points:
  - stored per course in cookie `learnova_course_points`
  - updated when a quiz completes via `/api/learning/complete`

### How points are calculated (exact flow)
1) Quiz points are computed client-side in the player:
  - [src/app/(learner)/learn/[courseId]/[lessonId]/player-client.tsx](src/app/(learner)/learn/[courseId]/[lessonId]/player-client.tsx)
  - Scoring is based on “attempt number” (first attempt gives more points, later attempts reduced).
  - Simplified formula used in the MVP:
    - `perCorrect` depends on attempt (1st attempt higher, 2nd lower, etc.)
    - `correct` = number of correct answers
    - `raw = correct * perCorrect`
    - `points = clamp(raw)` with a small minimum so it still feels rewarding
  - The demo “rewards per attempt” values are set when building the quiz:
    - [src/app/(learner)/learn/[courseId]/[lessonId]/page.tsx](src/app/(learner)/learn/[courseId]/[lessonId]/page.tsx)
2) When the quiz finishes, the player calls:
  - [src/app/api/learning/complete/route.ts](src/app/api/learning/complete/route.ts)
  with `{ courseId, points }`.
3) The server writes/updates cookies:
  - `learnova_completed_courses` (adds this courseId)
  - `learnova_course_points` (stores max points earned for that course)
    - If you retry a quiz, we keep the **best** score for that course (max).
4) Dashboard/profile pages read the cookies and sum points:
  - [src/lib/learning/points.ts](src/lib/learning/points.ts)
  - plus base points from [src/lib/data/mock-learning.ts](src/lib/data/mock-learning.ts)

Completion:
- a course is treated as completed in demo when the quiz is completed
- completion is stored in `learnova_completed_courses`

Important nuance (good to mention to evaluators):
- The course “progress %” shown in cards is mostly from mock data (demo snapshot),
  but if a course is in `learnova_completed_courses`, we override it to **100%** in the player.

---

## 6) Common evaluator questions (quick answers)

### “Is this a real database or just mock?”
- **Both**: users are real DB records in SQLite; course content is mock for speed.

### “Show me the schema of this project.”
- The DB schema is defined in [prisma/schema.prisma](prisma/schema.prisma).
- For the MVP, the DB currently has the `User` table only (auth).
- You can show it quickly with `npm run db:studio` or `sqlite3 prisma/dev.db` → `.schema User`.

### “If I login, will it work?”
- Yes, login/signup are **DB-backed** and should work as long as the server is running and migrations/seed have been applied.
- Demo accounts are seeded (see Section 3). You can use those credentials immediately.

Quick verification steps:
1) Make sure only one dev server is running for this repo.
  - If you see “Another next dev server is already running”, stop the existing one or use that already-running URL.
2) Ensure DB is ready:
  - `npm run db:migrate`
  - `npm run db:seed`
3) Try sign-in with:
  - `learner@learnova.dev` / `Learner@123`

What “working” means in this MVP:
- Successful login sets the `learnova_session` cookie.
- Learner pages then read that session to decide role and access.

### “We did Module B first. Without Module A, how do you have courseIds, and how are scores calculated?”
This is the core explanation:

1) **courseIds exist because courses are mocked right now**
- We are not creating courses from an admin dashboard yet.
- Course records are demo data in [src/lib/data/mock-learning.ts](src/lib/data/mock-learning.ts).
- That file defines stable IDs like `course_1`, `course_4`, etc.

2) **lessonIds/quizzes also exist because the player generates them**
- The player page builds lessons `lesson_1 ... lesson_N` based on `lessonCount` from the mock course.
- The quiz is generated with id `quiz_${courseId}`.
- Source: [src/app/(learner)/learn/[courseId]/[lessonId]/page.tsx](src/app/(learner)/learn/[courseId]/[lessonId]/page.tsx)

3) **scores are calculated from the quiz logic (not from Module A)**
- Scoring logic lives in the learner quiz viewer:
  - [src/app/(learner)/learn/[courseId]/[lessonId]/player-client.tsx](src/app/(learner)/learn/[courseId]/[lessonId]/player-client.tsx)
- The result points are stored server-side in cookies via:
  - [src/app/api/learning/complete/route.ts](src/app/api/learning/complete/route.ts)

4) **user points = demo base points + earned quiz points**
- base points are a demo constant (learner starts at 57)
- earned points come from quizzes and are stored per-course

If you want a one-line answer in the interview:
> “Module B uses mock course data with stable IDs, and quiz points are computed in the player then persisted via server-set cookies; Module A will later replace mock course creation with DB-backed course/lesson tables.”

### “Can we inspect the database?”
- Yes: run `npm run db:studio` and view the `User` table.

### “Why SQLite + Prisma?”
- Fastest local setup, no external services, and still a real migration-based DB.

### “What data is NOT in DB yet?”
- Courses/lessons, enrollments, purchases, learning progress, reviews, quiz attempts.

### “What would be the next DB tables if we continued?” (future plan)
Not implemented yet (MVP scope), but a typical next step would be to add tables like:
- `Course`, `Lesson`, `Quiz`, `Question`
- `Enrollment` / `Purchase`
- `CourseProgress` / `LessonProgress`
- `Review`
- `QuizAttempt`

That’s what L3 in [temp/TaskList.md](temp/TaskList.md) is describing: migrate learning state from cookies/localStorage to DB.

### “How would you move learning data to DB next?”
- See L3 items in [temp/TaskList.md](temp/TaskList.md): migrate reviews, quiz attempts, completion, and points to DB incrementally.

---

## 7) A simple 60-second demo script (what to say)

You can literally say this:

1) “We’re using a hybrid MVP approach.”
  - “Auth users are stored in a real local SQLite DB using Prisma.”
  - “Course content is still mock data so we could complete Module B quickly.”
2) “Here is the DB schema.”
  - “It’s defined in `prisma/schema.prisma` and currently contains the `User` table.”
3) “Here is proof login works.”
  - “Login hits `/api/auth/login`, verifies bcrypt passwordHash in SQLite, and sets `learnova_session`.”
4) “Here is how points work without Module A.”
  - “CourseIds come from mock data; quiz scoring is computed in the player; completion + points are persisted in httpOnly cookies.”

---

## 8) Troubleshooting (common live-demo issues)

### Dev server says “Another next dev server is already running”
- It means port 3000 is already used by an existing Next dev process.
- Either use the already-running URL (usually `http://localhost:3000`) or stop the old process and run `npm run dev` again.

### Login fails with “Invalid email or password”
- Usually means seed didn’t run.
- Fix:
  - `npm run db:migrate`
  - `npm run db:seed`
  - Then login with `learner@learnova.dev` / `Learner@123`

### Prisma Studio port confusion
- Studio prints the exact URL it is using (sometimes `5555`, sometimes `5556`).
- Open the printed URL in your browser to show the `User` table.

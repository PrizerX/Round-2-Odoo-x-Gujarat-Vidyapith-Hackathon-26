# Learnova — presentation notes

## One-liner
Learnova is a hackathon-built eLearning platform with two experiences: an Instructor/Admin Backoffice to create/manage courses and a Learner app to join, learn, and track progress—powered by local auth + Prisma persistence.

## Problem
Teams need a simple LMS-style tool that:
- Lets instructors publish learning content quickly.
- Lets learners join from any device, learn in a focused player, and see progress.
- Gives admins/instructors visibility into engagement and completion.

## Roles & experiences
- **Learner**: browse published courses, join/enroll, learn (video/doc/image/quiz), track visited/completed lessons, earn points/badges, and maintain a streak.
- **Instructor**: create courses, organize content into units, add lessons, build quizzes, invite attendees, contact attendees, and view reports.
- **Admin**: everything instructors can do + access to all courses + admin-only Settings.

## What to demo (suggested order)
1. **Sign in** as Instructor (Backoffice access)
2. **Backoffice → Courses**
   - Search and switch views (Kanban/List)
   - Edit a course
3. **Course Editor**
   - Publish toggle + preview
   - Content tab: units + lessons (Add/Edit modal)
   - Quiz tab: builder (questions, options, correct answers, rewards by attempt)
   - **Attendees**: Add Attendees (invite) + Contact Attendees (select all/none + search)
4. **Learner experience**
   - Courses page: quick search + Join
   - Join success popup
   - Course details: content list with status icons
   - Player: sequential lesson locking; “Mark as complete” unlocks next
   - Quiz: one-question flow; points awarded
5. **Profile & gamification**
   - Badges based on points
   - Profile settings: change name (with confirmation)
   - Points history
   - Learner streak (last 7 days)
6. **Reporting**
   - Overview cards + table with show/hide columns

## Key features (highlights)
### Backoffice
- Course dashboard (Kanban/List) + instant search
- Course editor (Content / Description / Options / Quiz)
- Units/Sections grouping + lesson ordering
- Lesson editor modal with attachments (external link or PDF upload)
- Quiz builder with attempt-based rewards
- Reporting dashboard (overview + table + show/hide columns)
- Admin-only Settings; instructors see it disabled
- Attendees: invite learners + contact attendees via selection tools

### Learner
- Course discovery with access rules (Open/Invitation/Payment)
- Quick search (search-as-you-type)
- Join flow with success animation popup
- Full-screen player with collapsible sidebar
- Lesson progress: visited vs completed, sequential locking, “Mark as complete” gating
- Points, badges, profile name updates, points history, and streak

## Data & architecture (talk track)
- **Stack**: Next.js App Router + TypeScript + Tailwind
- **DB**: Prisma (currently SQLite in hackathon mode)
- **Auth**: httpOnly cookie session (`learnova_session`) + role-based routing
- **Progress models**:
  - `Enrollment` tracks invited/enrolled
  - `LessonProgress` tracks visited/completed signals
  - `QuizAttempt` tracks points awarded over time

## Business logic focus (what makes this more than UI)

This project intentionally focuses on real product rules and the supporting data flows:

### 1) Visibility vs invitation access (who can see vs who can start)
- **Published gating**: only `Course.published=true` appears on learner catalog.
- **Visibility** (`Course.visibility`):
  - `everyone`: guests can browse.
  - `signed_in`: requires login before viewing/joining.
- **Access rules** (`Course.accessRule`):
  - `open`: learner must explicitly **Join** (creates `Enrollment`) before the player is accessible.
  - `invitation`: learner can start only when an `Enrollment` exists (invited/enrolled). Backoffice can invite attendees.
  - `payment`: UI supports the rule; production payment processing is a future improvement.

Why this matters: “visibility” is a discovery rule; “access” is an authorization rule. We treat them separately.

### 2) Progress calculation (visited vs completed) + sequential learning
- We track **lesson-level state** using `LessonProgress`.
  - “Visited” means the learner opened the lesson.
  - “Completed” means the learner explicitly clicked **Mark as complete** (or completed a quiz lesson where applicable).
- The player enforces **sequential locking**: a lesson becomes available only when the previous lesson is completed.
- This is reflected in UI via **3-state icons**:
  - completed (green)
  - visited but not completed (orange)
  - unvisited (gray)

### 3) Attempt-based scoring (real-world quiz rule)
- Each quiz attempt is persisted as `QuizAttempt` with `attemptNumber`, `correctCount`, `totalQuestions`, and `pointsAwarded`.
- Backoffice configures rewards by attempt (attempt 1/2/3/4+) so instructors can implement a real grading policy.
- Learner scoring uses that policy to compute awarded points and stores them historically.

### 4) Points, badges, history, and streak
- **Points** are not just a single total; we keep history via `QuizAttempt` so the UI can show “when and why points changed”.
- **Badges** are computed from total points (simple ladder for hackathon clarity).
- **Learner streak** uses DB-backed learning activity signals (recent progress/attempt timestamps) and presents a last-7-days view.

### 5) Reporting accuracy (data-driven, not mocked)
- Reporting is built from persisted DB data (enrollments + progress + attempts), so the counts/rows reflect actual usage.
- The reporting table supports real operational needs: filtering, scanning, and a show/hide column picker.

## Workflow logic & functions (Q&A cheat-sheet)

Use this section to answer “how does the workflow work?” questions.

### Auth & role gating
- **Session read**: `getSession()` in `src/lib/auth/session.ts` reads `learnova_session` (httpOnly cookie).
- **Role rules**:
  - Learner routes are public/gated by course rules.
  - Backoffice routes are instructor/admin only.
  - Settings is **admin-only** (UI disabled + server-side redirect).

### Backoffice workflow (Instructor/Admin)
1. **Create/edit a course**
   - Persisted via backoffice course APIs (PATCH etc.).
   - Instructors are scoped to owned courses; admins can access all.
2. **Add content** (unit/lesson/attachments)
   - Lessons support video/doc/image/quiz.
   - Attachments support link or PDF upload.
3. **Configure quiz**
   - Build questions/options; set rewards by attempt.
4. **Publish**
   - Publish toggle controls learner visibility (published-only catalog).
5. **Attendees**
   - Add Attendees: selects learners and creates/updates `Enrollment` with status `invited`.
   - Contact Attendees: select all/none + search; copies emails or opens a mail client (mailto/BCC).

### Learner workflow (Discovery → Join → Learn)
1. **Browse courses**
   - Learner catalog shows only published courses and respects Visibility.
2. **Join**
   - Join creates the `Enrollment` record (server-enforced).
   - UI shows an animated success modal after Join.
3. **Open course details**
   - Shows lessons grouped by units and status icons (completed/visited/unvisited).
4. **Learn in player**
   - Player checks whether the requested lesson is locked.
   - Opening a lesson marks it “visited”.
   - Clicking **Mark as complete** sets `LessonProgress.completed=true` and unlocks the next lesson.

### Quiz workflow (Start → Attempt → Points)
1. Learner starts a quiz lesson.
2. Submission creates a `QuizAttempt` row with attempt number and computed points.
3. Points history updates immediately (and totals/badges reflect the aggregated points).

### Profile workflow
- **Change name**
  - Profile Settings calls an API to update `User.name`.
  - Session cookie is updated so the UI reflects the new name consistently.
- **Points history**
  - Derived from `QuizAttempt` rows (timestamped).
- **Streak**
  - Derived from recent learning activity persisted in DB and displayed as last-7-days.

### “If asked: where are the key API routes?”
- Auth: `/api/auth/login`, `/api/auth/signup`, `/api/auth/me`, `/api/auth/logout`
- Join/enrollment: `/api/courses/join` (supports POST for UX)
- Lesson progress: `/api/learning/lesson-progress`
- Quiz attempts: `/api/learning/attempt`
- Backoffice attendees: `/api/backoffice/courses/[courseId]/attendees`
- Profile updates: `/api/profile/name`

### “If asked: how do you prevent bypassing rules?”
- We don’t rely only on UI state.
- The player and APIs check enrollment/access and enforce locking/authorization server-side.

## Constraints / honest notes
- Offline-first (no-net saving) is not fully implemented yet; current MVP prefers DB when signed-in and keeps limited client-side fallback.
- SQLite is ideal for local demo; for multi-device production deployment, switch to hosted Postgres.

## Next improvements
- Offline-first: service worker caching + IndexedDB offline queue + sync
- Signed session cookies for stronger tamper protection
- “Complete course” explicit action outside quiz
- Better points-to-next-rank UI
- Email delivery integration for attendee contacting (instead of mailto/copy)

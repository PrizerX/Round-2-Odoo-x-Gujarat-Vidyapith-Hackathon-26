# 🚀 Learnova Hackathon Sprint Plan (24h)

## Rules To Consider

- Strict UI tokens applied (Primary `#714b67`, Accent `#f3f4f6`, Base `#ffffff`).
- All Add/Edit actions must use modals; all Delete actions must have confirmation.
- Supabase planned for Auth + DB; currently using mock auth + mock data.

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
- Visual polish: green progress indicators everywhere; paid price emphasized; “Enrolled” ribbon shown on catalog cards.



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
- [ ] **Courses Dashboard:** Toggle between Kanban and List views.
- [ ] **Course Form:** Implement the 4-tab layout (Content, Description, Options, Quiz).
- [ ] **Lesson Editor:** Popup for Video/Doc/Image types with upload/URL fields.
- [ ] **Quiz Builder:** Question list + Points reduction settings.

## Phase 3: Learner Experience & Player (Hours 8-14)
- [x] **My Courses Page:** Cards showing progress, tags, and dynamic buttons (Join/Start/Continue).
- [x] **Profile Panel:** Badge levels based on total points (Newbie to Master).
- [x] **Full-Screen Player:** Sidebar with % completion and collapsible state.
    - Main viewer placeholder for Video/Doc/Quiz.
- [x] **Quiz Interface:** One-question-per-page logic with "Proceed" flow + results modal.

## Phase 4: Business Logic & Gamification (Hours 14-18)
- [ ] **Points Engine:** Implement reduction logic (Attempt 1: X, Attempt 2: Y, etc.).
    - Current: simple scoring shown in quiz; multiple attempts UI text exists, but attempt-based reduction is not implemented yet.
- [x] **Access Guard:** Redirect users based on Visibility (Everyone/Signed In) and Access (Open/Invitation/Payment).
- [ ] **Reporting:** Instructor table showing time spent and completion %.

## Phase 5: Polish & Deployment (Hours 18-24)
- [ ] Final UI Audit against SVG mockups (especially quiz spacing/typography).
- [ ] Add Framer Motion for "Points Earned" popups (optional).
- [ ] Deploy to Vercel/Netlify.
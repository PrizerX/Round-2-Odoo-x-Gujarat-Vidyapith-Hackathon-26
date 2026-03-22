# Learnova — 2 minute pitch video script (voiceover + screen recording)

> Target length: ~2:00
> Tip: keep cursor movements slow, zoom browser to 110–125%, and avoid scrolling too fast.

## 0:00–0:10 — Hook
“Hi, this is **Learnova** — a two-sided eLearning platform built for the hackathon. It has a Backoffice for instructors and admins, and a learner app to join courses, learn, and track progress.”

(Show: Home → sign in page)

## 0:10–0:25 — Roles & access
“We built DB-backed authentication with roles: learner, instructor, and admin. Backoffice routes are protected, and admins can access everything while instructors only manage the courses they own.”

(Show: Sign in → log in as Instructor → land in Backoffice)

## 0:25–0:55 — Backoffice course management
“In the Backoffice, instructors can create and manage courses. There’s a Kanban and List view, instant search, and a course editor with four tabs: Content, Description, Options, and Quiz.”

(Show: Backoffice courses page → search → open a course editor)

## 0:55–1:15 — Content + Quizzes
“Inside the course editor, content is organized into units and lessons. Adding and editing content happens in modals, with confirmation for deletes — consistent UX everywhere. Quizzes have a full builder: questions, options, correct answers, and rewards that can change by attempt.”

(Show: Content tab → open Add Content modal briefly → close)
(Show: Quiz tab → open a quiz → show rewards-by-attempt)

## 1:15–1:30 — Attendees (invite + contact)
“We also added attendee tools: instructors can invite learners to a course and contact attendees with select all, select none, and search — perfect for invitation-based access rules.”

(Show: Add Attendees modal → search → select all/none)
(Show: Contact Attendees modal → search → copy emails or open email)

## 1:30–1:50 — Learner experience + progress
“On the learner side, users can browse published courses with quick search, join a course with a success animation, and learn in a full-screen player. Lessons have visited and completed states, and we enforce sequential progress — you must ‘Mark as complete’ to unlock the next lesson.”

(Show: Learner /courses → search → Join popup)
(Show: Course details → lesson status icons)
(Show: Player → Mark as complete → next unlocks)

## 1:50–2:00 — Gamification + close
“Finally, we track quiz attempts and points over time. Learners get badges, a points history, and a 7‑day streak view on Profile and My Courses. Learnova is fully DB-backed with Prisma, and ready to move from local SQLite to hosted Postgres for multi-device deployment.”

(Show: Profile → points history + streak)
(End on: Backoffice reports or course dashboard)

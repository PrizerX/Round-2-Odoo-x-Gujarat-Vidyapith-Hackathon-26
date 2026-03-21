# Learnova

Learnova is a responsive eLearning platform with two experiences: a Backoffice for instructors/admins and a Learner site/app. It is built as a rapid prototype using mock data and mock auth, with a planned migration to Supabase for authentication and storage.

## Product overview

- Backoffice: create and manage courses, lessons, quizzes, and track learner progress.
- Learner: browse and join courses, learn in a full-screen player, and earn points/badges.
- Reference UI: see temp/E-learning Hackathon Mockup - 24 hours.svg for the raw mockup direction.

## UI tokens and visual identity

These tokens apply to all components and views:

- Primary: #714b67 (headers, sidebars, primary buttons, active states)
- Accent: #f3f4f6 (card backgrounds, page backgrounds, hover effects)
- Base: #ffffff (main containers, inputs, modals)

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

Completed:

- Next.js App Router + TypeScript + Tailwind scaffold.
- UI primitives: Button, Card, Input, Modal, ConfirmDialog.
- Route groups for (learner) and (backoffice).
- Auth pages with mock, cookie-based sessions.
- Role-based protection for /backoffice/*.
- Learner navbar with Courses menu and auth status.

In progress:

- Shared domain types (Course, Lesson, Quiz, Progress, User).
- Backoffice dashboards and course editor tabs.
- Learner course cards, profile badges, and player UI.

## Demo accounts (mock auth)

The app uses a mock, cookie-based auth flow for rapid prototyping. These credentials are intentionally not shown inside the UI.

- Learner: learner@learnova.dev / Password123!
- Instructor: instructor@learnova.dev / Password123!
- Admin: admin@learnova.dev / Password123!

## Local development

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Project structure

- src/app/(backoffice) for admin and instructor routes.
- src/app/(learner) for learner routes and player views.
- src/components/ui for shared UI primitives.
- src/lib for auth, domain logic, and mock data.

## Roadmap (short)

- Implement course types, lesson types, and quiz models.
- Build the backoffice course editor and quiz builder.
- Build the learner player and progress tracking.
- Replace mock auth/data with Supabase.

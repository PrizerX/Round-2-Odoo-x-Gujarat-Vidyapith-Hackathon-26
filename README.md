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

## Tech Stack

This project is intentionally built “mock-first”: we ship UI + flows quickly with local mock data/auth, then swap the data layer for Supabase once the product behavior is validated.

### Frontend framework

- Next.js (App Router)
	- Why: fast routing + layouts for the two experiences (Learner + Backoffice), and server components for auth-gated redirects without client flicker.
	- Why: built-in API routes used for the mock auth endpoints so the prototype remains self-contained.

### Language & typing

- TypeScript
	- Why: keeps domain rules (visibility/access/payment, CTA state, progress calculations) correct while iterating quickly.
	- Why: makes it easier to migrate to a real DB later (Supabase types map cleanly to TS models).

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

- Mock, cookie-based auth session
	- Implemented using Next.js API routes (`/api/auth/*`) and an httpOnly cookie session.
	- Why: allows end-to-end flows (role redirects, protected Backoffice routes) without requiring external services during rapid UI development.
	- Tradeoff: the mock signup does not persist users; it only creates a session for flow testing.

### Data layer (current prototype)

- In-memory/mock data modules
	- Why: enables UI and business rules (published filtering, invitation/payment gating, progress-based CTA) to be implemented immediately.
	- Tradeoff: data resets on refresh/restart until Supabase is added.

### Planned backend (migration target)

- Supabase (Auth + Postgres)
	- Why: relational schema fits courses/lessons/quizzes/enrollments/progress/reporting.
	- Why: Supabase Auth + Row Level Security (RLS) maps well to role-based access (learner vs instructor/admin) and invitation-only course access.
	- Why: simplifies reporting queries (time spent, completion %, attempts) compared to a pure document store.

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

- Learner: learner@learnova.dev / Learner@123
- Instructor: instructor@learnova.dev / Instructor@123
- Admin: admin@learnova.dev / Admin@123

Note: Sign up creates a session for flow testing, but does not persist users yet (Supabase will replace this).

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

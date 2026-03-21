# Presentation Questions With Answers

## Product vision and scope
- Q: Who are the primary users and what problems does Learnova solve for each?
	A: Instructors/admins need fast course creation, quiz setup, and reporting; learners need a clear path to discover courses, focus in a full-screen player, and track progress and rewards.
- Q: What is the minimum viable scope for the hackathon demo?
	A: A working backoffice course list, a basic 4-tab course editor, a learner course list with dynamic actions, and a playable lesson view with progress updates.
- Q: How does Learnova differentiate from existing eLearning platforms?
	A: A dual-sided product with rapid course ops in the backoffice and a focused learner player, plus gamification and access rules built in from day one.
- Q: Which user journey are you prioritizing for the live demo and why?
	A: The learner journey from discovery to lesson completion, because it shows the end-to-end value and highlights the player, progress, and rewards.

## Backoffice (Instructor/Admin)
- Q: How does the Kanban vs List toggle help instructors manage courses?
	A: Kanban is optimized for status-based workflow, while List is faster for scanning metrics like lessons, duration, and published state.
- Q: What does the 4-tab course editor cover, and why this structure?
	A: Content, Description, Options, and Quiz keep course setup logically separated so instructors can focus on one task at a time.
- Q: How are lessons organized and edited inside the Content tab?
	A: Lessons are listed with a quick actions menu; add/edit actions open in a modal for focused editing.
- Q: How do visibility and access rules work for a course?
	A: Visibility controls who can see a course (Everyone or Signed In), and access rules control how they can enter (Open, Invitation, or Payment).
- Q: How does the quiz builder handle multiple attempts and scoring?
	A: The first attempt awards full points, and subsequent attempts reduce points based on the defined scoring ladder.
- Q: What reporting insights are available to instructors right now?
	A: The report view includes overall participation states and a table with time spent, completion percentage, and status per participant.

## Learner experience
- Q: How does the learner discover and join courses?
	A: Learners browse a courses list from the navbar, then use context-aware actions like Join or Start depending on status.
- Q: What do the dynamic course actions (Join/Start/Continue/Buy) depend on?
	A: They depend on learner enrollment state, progress, and access rules for the course.
- Q: How does the full-screen player keep learners focused and on track?
	A: It uses a collapsible sidebar with progress indicators and a clean media viewer for lesson content.
- Q: How is progress tracked at the lesson and course level?
	A: Completing a lesson updates its status and rolls up into overall course completion percentage.
- Q: How do points and badges influence engagement?
	A: Points from quizzes feed badge tiers, giving learners visible milestones and motivation to continue.

## Business rules and logic
- Q: What qualifies a course to be visible to learners?
	A: Only courses with Published enabled are listed in the learner experience.
- Q: How is invitation-only access enforced?
	A: Learners must be explicitly enrolled before they can access invitation-only courses or the player.
- Q: When is a lesson marked completed?
	A: After the learner finishes viewing the content or passes the associated quiz.
- Q: How does the points reduction per quiz attempt work?
	A: Attempts 1-3 map to decreasing point values, with attempt 4+ awarding the minimum value.

## Architecture and data
- Q: What is mocked today and what is planned for Supabase?
	A: Auth and data are mocked for speed; Supabase will replace them for real auth, storage, and persistence.
- Q: How is auth handled in the prototype?
	A: A cookie-based mock auth flow with role-aware routes for learner and backoffice access.
- Q: Where would you store course content, lesson assets, and quiz results?
	A: Course metadata in a relational database, assets in object storage, and quiz results in per-user progress tables.
- Q: What are the core domain types you plan to model (Course, Lesson, Quiz, User, Progress)?
	A: Course and Lesson define structure, Quiz defines assessments, User defines identity and role, and Progress ties user activity to course completion.

## UI and consistency
- Q: What are the design tokens and why were those chosen?
	A: Primary #714b67, Accent #f3f4f6, Base #ffffff to keep a consistent, professional look across surfaces.
- Q: How do you ensure UI consistency across backoffice and learner views?
	A: Shared UI primitives and strict token usage keep layout, spacing, and color consistent.
- Q: What is the rationale for using modals for add/edit actions and confirmations for delete?
	A: Modals keep users in context during edits, and confirmations reduce destructive mistakes.

## Security and roles
- Q: How do you restrict access to backoffice routes?
	A: Route protection checks user role before allowing access to /backoffice/*.
- Q: How do you prevent learners from accessing instructor/admin capabilities?
	A: Role-based guards block access at both route and UI entry points.

## Roadmap and constraints
- Q: What are the biggest remaining tasks to complete the demo?
	A: Course editor tabs, quiz builder logic, learner player flow, and the reporting table.
- Q: What would be the next 2-3 features after the hackathon?
	A: Supabase integration, richer analytics, and a more advanced quiz/question bank.
- Q: What trade-offs did you make due to time constraints?
	A: We prioritized core flows and mock data over full persistence and advanced reporting.
- Q: How would you test or validate the experience with real users?
	A: Run short usability tests on course creation and lesson flow, then iterate on friction points.

## Demo readiness
- Q: Which flows are fully functional vs planned?
	A: Auth, basic navigation, and role protection are functional; course editing and player details are in progress.
- Q: What sample data or demo accounts are available?
	A: Learner, instructor, and admin demo accounts with mock data are available.
- Q: What edge cases are not covered in the demo?
	A: Payment gating, large media uploads, and complex access rules beyond invitation are not shown yet.

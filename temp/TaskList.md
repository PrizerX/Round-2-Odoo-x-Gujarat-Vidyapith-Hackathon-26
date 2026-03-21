# 🚀 Learnova Hackathon Sprint Plan (24h)

## Rules To Consider



## Phase 1: Foundation & Routing (Hours 0-3)
- [ ] Initialize Next.js (App Router) + Tailwind CSS + Lucide Icons.
- [ ] Define shared Types/Interfaces (Course, Lesson, Quiz, User, Progress).
- [ ] Setup Directory Structure:
    - [cite_start]`/app/(backoffice)` -> Admin/Instructor routes[cite: 4, 28].
    - [cite_start]`/app/(learner)` -> Website/App routes[cite: 5, 154].
    - `/components/ui` -> Shared buttons, cards, inputs.
- [ ] [cite_start]Implement Navbar with "Courses" menu[cite: 155].

## Phase 2: Instructor Backoffice (Hours 3-8)
- [ ] [cite_start]**Courses Dashboard:** Toggle between Kanban and List views[cite: 29, 32].
- [ ] [cite_start]**Course Form:** Implement the 4-tab layout (Content, Description, Options, Quiz) [cite: 66-70].
- [ ] [cite_start]**Lesson Editor:** Popup for Video/Doc/Image types with upload/URL fields [cite: 79-87].
- [ ] [cite_start]**Quiz Builder:** Question list + Points reduction settings [cite: 115-131].

## Phase 3: Learner Experience & Player (Hours 8-14)
- [ ] [cite_start]**My Courses Page:** Cards showing progress, tags, and dynamic buttons (Join/Start/Continue) [cite: 159-170].
- [ ] [cite_start]**Profile Panel:** Badge levels based on total points (Newbie to Master) [cite: 173-182].
- [ ] [cite_start]**Full-Screen Player:** - Sidebar with % completion and collapsible state [cite: 206-212].
    - [cite_start]Main viewer for Video/Doc/Quiz [cite: 213-218].
- [ ] [cite_start]**Quiz Interface:** One-question-per-page logic with "Proceed" flow [cite: 226-229].

## Phase 4: Business Logic & Gamification (Hours 14-18)
- [ ] [cite_start]**Points Engine:** Implement reduction logic (Attempt 1: X, Attempt 2: Y, etc.)[cite: 256].
- [ ] [cite_start]**Access Guard:** Redirect users based on Visibility (Everyone/Signed In) and Access (Open/Invitation) [cite: 243-248].
- [ ] [cite_start]**Reporting:** Instructor table showing time spent and completion % [cite: 132-151].

## Phase 5: Polish & Deployment (Hours 18-24)
- [ ] Final UI Audit against SVG mockups.
- [ ] [cite_start]Add Framer Motion for "Points Earned" popups[cite: 235].
- [ ] Deploy to Vercel/Netlify.
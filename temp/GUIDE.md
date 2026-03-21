# 📘 Learnova Project Guide & Technical Blueprint

## 1. Project Overview & Objectives
Build a responsive eLearning platform with two distinct sides:
* [cite_start]**Instructor/Admin (Backoffice):** Create and manage courses, lessons, quizzes, and track progress[cite: 4].
* [cite_start]**Learner (Website/App):** Browse/join courses, learn in a full-screen player, and earn points/badges[cite: 5].
* We'll use SUpaBase for Auth and DB. Currently proceeding with local mock db and migrating to hosted service later.
* Refer to the SVG temp\E-learning Hackathon Mockup - 24 hours.svg for UI idea (raw mockups)

---

## 2. Visual Identity & UI Standards
**Strict adherence to these styles is required for all generated components:**

* **Primary Color:** `#714b67` (Headers, Sidebars, Primary Buttons, Active States).
* **Accent Color:** `#f3f4f6` (Card backgrounds, Page-level backgrounds, Hover effects).
* **Base Color:** `#ffffff` (Main content containers, Input fields, Modals).
* **Layout Style:** Clean, professional borders, and consistent padding. Follow the "Excalidraw" layout logic while modernizing the components (e.g., use Lucide icons instead of hand-drawn sketches).

---

## 3. Module A: Instructor/Admin Backoffice
### A1. Courses Dashboard
* [cite_start]**Views:** Implement a toggle between **Kanban** and **List** views[cite: 32].
* [cite_start]**Search:** Functional search bar by course name[cite: 33].
* [cite_start]**Course Cards:** Show Title, Tags, Views, Lesson Count, Duration, and a "Published" badge if active [cite: 35-45].

### A2. Course Configuration (4-Tab Layout)
Every "Edit Course" page must contain these four tabs:
1.  [cite_start]**Content:** List of lessons with a 3-dot menu (Edit/Delete) and "Add Content" button [cite: 67, 73-78].
2.  [cite_start]**Description:** Rich text editor for course-level info[cite: 68].
3.  [cite_start]**Options:** Visibility settings (Everyone/Signed In) and Access Rules (Open/Invitation/Payment) [cite: 69, 98-104].
4.  [cite_start]**Quiz:** List of linked quizzes with a "Add Quiz" builder button [cite: 70, 111-114].

### A3. Quiz Builder Logic
* [cite_start]**Attempts:** Support multiple attempts[cite: 9].
* [cite_start]**Scoring:** Points must reduce based on the attempt number[cite: 256]:
    * **1st Try:** X points | **2nd Try:** Y points | **3rd Try:** Z points | [cite_start]**4th+ Try:** W points [cite: 128-131].

### A4. Reporting Dashboard (Ref: SVG)
* [cite_start]**Overview Cards:** Total Participants, Yet to Start, In Progress, Completed [cite: 134-138].
* [cite_start]**Customizable Table:** A sidebar with checkboxes to show/hide columns: S.No, Course Name, Participant, Dates, Time Spent, Completion %, and Status [cite: 141-153].

---

## 4. Module B: Learner Website & App
### B1. Navigation & Discovery
* [cite_start]**Navbar:** Contains a "Courses" menu leading to all published courses [cite: 155-157].
* [cite_start]**Course Cards:** Dynamic buttons that change based on user state: **Join** (Guest), **Start** (Not started), **Continue** (In Progress), or **Buy** (Paid) [cite: 165-170].

### B2. My Profile & Gamification
* [cite_start]**Points:** Total points earned are displayed on the "My Courses" page[cite: 174].
* **Badge Levels:**
    * [cite_start]Newbie (20) → Explorer (40) → Achiever (60) → Specialist (80) → Expert (100) → Master (120) [cite: 176-182].

### B3. Full-Screen Lesson Player
* [cite_start]**Sidebar:** Left-aligned, collapsible sidebar showing course title, % completion, and lesson list with status icons (e.g., blue tick for completed) [cite: 206-212].
* [cite_start]**Main Area:** Top lesson description followed by the media viewer (Video/Document/Image/Quiz) [cite: 213-218].
* [cite_start]**Navigation:** "Back" to dashboard and "Next Content" buttons[cite: 219].

---

## 5. Core Business Rules
* [cite_start]**Publishing:** Only courses with the `Published` toggle ON appear to learners[cite: 242].
* [cite_start]**Access Control:** "On Invitation" courses are only accessible to specific enrolled users[cite: 248].
* [cite_start]**Lesson Tracking:** A lesson is marked "Completed" after viewing or passing the quiz, which updates the overall course % [cite: 250-253].

---

## 6. AI Agent Implementation Instructions
When generating code, always:
1.  [cite_start]Check the **Visibility/Access** logic before rendering the Player [cite: 243-248].
2.  Use the defined **Primary/Accent** colors for all interactive elements.
3.  [cite_start]Ensure all "Add/Edit" actions open in a popup/modal as per the requirement[cite: 51, 78, 114].
4.  [cite_start]Implement a "Confirmation" dialog for all delete actions[cite: 77, 113].

---
# Learnova (eLearning Platform) Main Given Architecture

## 1) Objective

Build a responsive eLearning platform with two sides:

### 1. Instructor/Admin (Backoffice)

* Create and manage courses, lessons, quizzes, attendees
* Publish courses to the website
* Track learner progress

### 2. Learner (Website/App)

* Browse/join courses
* Learn in a full-screen player
* Attempt quizzes (one question per page)
* Earn points/badges
* Post ratings/reviews

### Complete Learning Experience

* Instructors can build courses with:

  * Video / Document / Image / Quiz lessons
* Learners can:

  * Start/continue learning
  * Track progress
  * Complete courses
* Quizzes:

  * Multiple attempts
  * Points based on attempt number
* Learners earn badges based on total points
* Instructors can view course-wise learner progress

---

## 2) Roles

### A) Admin

* Full access to back-office features
* Manage courses, reporting, and settings

### B) Instructor / Course Manager

* Create and edit courses
* Add lessons and quizzes
* Publish/unpublish courses
* Add attendees (invite users)
* View reporting

### C) Learner (User)

* View published courses (based on rules)
* Purchase / start / continue lessons
* Attempt quizzes
* Earn points and badges
* Add ratings and reviews

### Guests

* Can view courses (if allowed)
* Must log in to start learning

---

## 3) What You Need to Build

---

# Module A — Instructor/Admin Backoffice

## A1) Courses Dashboard (Kanban/List)

### Features

* Two views: Kanban & List
* Search courses by name

### Course Card Info

* Course title
* Tags
* Views count
* Total lessons count
* Total duration
* Published badge

### Actions

* Edit
* Share (generate/copy link)

### Create Course

* `+` button → popup → enter course name

---

## A2) Course Form (Edit Course)

### Header Actions

* Publish toggle (ON/OFF)
* Preview (learner view)
* Add Attendees (email invite)
* Contact Attendees
* Upload course image

### Fields

* Title (required)
* Tags
* Website (required when published)
* Responsible / Course Admin

### Tabs

1. Content
2. Description
3. Options
4. Quiz

---

## A3) Lessons / Content Management

### Features

* List of lessons:

  * Title
  * Type (Video / Document / Image / Quiz)
* 3-dot menu:

  * Edit
  * Delete (with confirmation)

### Add Content

* Button → opens lesson editor popup

---

## A4) Lesson Editor (Add/Edit)

### 1) Content Tab

* Lesson title (required)
* Type selector:

  * Video / Document / Image
* Responsible (optional)

#### Type Fields

* Video:

  * URL (YouTube/Drive)
  * Duration
* Document:

  * File upload
  * Allow Download toggle
* Image:

  * Upload
  * Allow Download toggle

### 2) Description Tab

* Text or rich editor

### 3) Additional Attachments

* File upload OR external link

---

## A5) Course Options (Access Rules)

### Visibility

* Everyone
* Signed In

### Access Rules

* Open
* On Invitation
* On Payment → show **Price field**

### Course Admin

* Select responsible person

---

## A6) Quizzes (Instructor Side)

* List quizzes
* Edit/Delete (with confirmation)
* Add Quiz → opens builder

---

## A7) Quiz Builder

### Left Panel

* Question list
* Add Question
* Rewards

### Question Editor

* Question text
* Multiple options
* Mark correct answers

### Rewards System

* 1st attempt → X points
* 2nd → Y
* 3rd → Z
* 4th+ → W

---

## A8) Reporting Dashboard

### Overview Cards

* Total Participants
* Yet to Start
* In Progress
* Completed

### Table Data

* Sr No.
* Course name
* Participant
* Enrolled date
* Start date
* Time spent
* Completion %
* Completed date
* Status

### Customization

* Show/hide columns

---

# Module B — Learner Website/App

## B1) Courses Page

* Navbar → Courses
* Show published courses based on visibility

---

## B2) My Courses (Dashboard)

### Course Cards

* Image
* Title
* Description
* Tags

### Buttons (State-based)

* Join Course
* Start
* Continue
* Buy Course

### Search

* By course name

### Profile Panel

* Total points
* Badge levels:

  * Newbie (20)
  * Explorer (40)
  * Achiever (60)
  * Specialist (80)
  * Expert (100)
  * Master (120)

---

## B3) Course Detail Page

### Overview Tab

* Title, image, description
* Progress bar
* Total lessons
* Completed / Incomplete count

### Lessons List

* Status icons:

  * In Progress
  * Completed

### Search Lessons

* Click → open player

---

## B4) Ratings & Reviews

* Average rating
* Reviews list
* Add review (logged-in users)

---

## B5) Full-Screen Lesson Player

### Sidebar

* Course title
* Progress %
* Lesson list
* Attachments
* Toggle sidebar

### Main Area

* Title
* Description
* Viewer:

  * Video / Document / Image / Quiz

### Buttons

* Back
* Next Content

---

## B6) Quiz (Learner Side)

### Intro Screen

* Total questions
* Multiple attempts
* Start Quiz

### Question Flow

* One question per page
* Proceed button

### Completion

* Quiz marked completed
* Points awarded

---

## B7) Points & Completion

### Points Popup

* “You earned X points”
* Progress to next rank

### Course Completion

* Button → Complete course

---

# 4) Rules (Simple and Clear)

### Publishing

* Only published courses are visible

### Visibility

* Everyone → all users
* Signed In → only logged-in users

### Access

* Open → anyone can learn
* Invitation → only invited users

### Progress Tracking

* Lesson completion
* Course %

### Quiz System

* Multiple attempts
* Points decrease with attempts
* Badges based on total points

---

# Why This Hackathon Problem is Important

* **Real-world workflow**
  Course → Publish → Enrollment → Learning → Quiz → Completion → Reviews → Reporting

* **Business logic focus**
  Visibility rules, scoring, progress, badges

* **Industry-ready system**
  Role-based access, gamification, analytics


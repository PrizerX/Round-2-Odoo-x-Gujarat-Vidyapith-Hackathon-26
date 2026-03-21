import type { Course, CourseProgress, Enrollment } from "@/lib/domain/types";

export const MOCK_COURSES: Course[] = [
  {
    id: "course_1",
    title: "UI Foundations",
    tags: ["Basics", "Design"],
    views: 1240,
    lessonCount: 4,
    durationMinutes: 80,
    published: true,
    visibility: "everyone",
    accessRule: "open",
  },
  {
    id: "course_2",
    title: "Advanced Reporting",
    tags: ["Analytics", "SQL"],
    views: 540,
    lessonCount: 6,
    durationMinutes: 120,
    published: true,
    visibility: "signed_in",
    accessRule: "invitation",
  },
  {
    id: "course_3",
    title: "Pro Quizzes",
    tags: ["Quizzes"],
    views: 310,
    lessonCount: 5,
    durationMinutes: 95,
    published: true,
    visibility: "everyone",
    accessRule: "payment",
    priceInr: 199,
  },
  {
    id: "course_draft_1",
    title: "Draft: Hidden Course",
    tags: ["Draft"],
    views: 0,
    lessonCount: 0,
    durationMinutes: 0,
    published: false,
    visibility: "everyone",
    accessRule: "open",
  },
];

export const MOCK_ENROLLMENTS: Enrollment[] = [
  { userId: "u_learner_1", courseId: "course_1" },
  { userId: "u_learner_1", courseId: "course_2" },
];

export const MOCK_PROGRESS: CourseProgress[] = [
  {
    userId: "u_learner_1",
    courseId: "course_1",
    completionPercent: 35,
    lastLessonId: "lesson_2",
  },
  {
    userId: "u_learner_1",
    courseId: "course_2",
    completionPercent: 0,
    lastLessonId: "lesson_1",
  },
];

// Payment is a later integration; for now this mock controls the Buy/Start CTA.
export const MOCK_PURCHASES: Array<{ userId: string; courseId: string }> = [
  // { userId: "u_learner_1", courseId: "course_3" },
];

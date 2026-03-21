import type { Course, CourseProgress, Enrollment } from "@/lib/domain/types";

export const MOCK_COURSES: Course[] = [
  {
    id: "course_1",
    title: "UI Foundations",
    coverImageUrl: "/images/covers/course-cover.svg",
    bannerImageUrl: "/images/covers/course-banner.svg",
    thumbnailImageUrl: "/images/courses/course-square.svg",
    description:
      "Learn the essentials of layout, spacing, and clean UI systems with practical examples.",
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
    coverImageUrl: "/images/covers/course-cover.svg",
    bannerImageUrl: "/images/covers/course-banner.svg",
    thumbnailImageUrl: "/images/courses/course-square.svg",
    description:
      "Build powerful reporting dashboards and learn how to interpret data for decisions.",
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
    coverImageUrl: "/images/covers/course-cover.svg",
    bannerImageUrl: "/images/covers/course-banner.svg",
    thumbnailImageUrl: "/images/courses/course-square.svg",
    description:
      "Practice with quizzes and attempt-based scoring to earn more points.",
    tags: ["Quizzes"],
    views: 310,
    lessonCount: 5,
    durationMinutes: 95,
    published: true,
    visibility: "everyone",
    accessRule: "payment",
    priceInr: 500,
  },
  {
    id: "course_4",
    title: "Odoo CRM Essentials",
    coverImageUrl: "/images/covers/course-cover.svg",
    bannerImageUrl: "/images/covers/course-banner.svg",
    thumbnailImageUrl: "/images/courses/course-square.svg",
    description:
      "Set up your sales pipeline, manage leads, and track deals end-to-end in Odoo CRM.",
    tags: ["CRM", "Sales"],
    views: 980,
    lessonCount: 7,
    durationMinutes: 110,
    published: true,
    visibility: "everyone",
    accessRule: "open",
  },
  {
    id: "course_5",
    title: "Inventory Basics",
    coverImageUrl: "/images/covers/course-cover.svg",
    bannerImageUrl: "/images/covers/course-banner.svg",
    thumbnailImageUrl: "/images/courses/course-square.svg",
    description:
      "Understand products, stock moves, and warehouse operations with clean, practical workflows.",
    tags: ["Inventory", "Operations"],
    views: 760,
    lessonCount: 8,
    durationMinutes: 130,
    published: true,
    visibility: "everyone",
    accessRule: "open",
  },
  {
    id: "course_6",
    title: "Accounting Starter",
    coverImageUrl: "/images/covers/course-cover.svg",
    bannerImageUrl: "/images/covers/course-banner.svg",
    thumbnailImageUrl: "/images/courses/course-square.svg",
    description:
      "Get comfortable with journals, invoices, and basic accounting flows in Odoo.",
    tags: ["Accounting", "Finance"],
    views: 420,
    lessonCount: 6,
    durationMinutes: 105,
    published: true,
    visibility: "signed_in",
    accessRule: "open",
  },
  {
    id: "course_7",
    title: "Website Builder Quickstart",
    coverImageUrl: "/images/covers/course-cover.svg",
    bannerImageUrl: "/images/covers/course-banner.svg",
    thumbnailImageUrl: "/images/courses/course-square.svg",
    description:
      "Launch a simple website fast: pages, sections, themes, and publishing best practices.",
    tags: ["Website", "Marketing"],
    views: 620,
    lessonCount: 5,
    durationMinutes: 75,
    published: true,
    visibility: "everyone",
    accessRule: "payment",
    priceInr: 299,
  },
  {
    id: "course_8",
    title: "HR Attendance & Leaves",
    coverImageUrl: "/images/covers/course-cover.svg",
    bannerImageUrl: "/images/covers/course-banner.svg",
    thumbnailImageUrl: "/images/courses/course-square.svg",
    description:
      "Configure attendance, leave types, approvals, and policies for a small team.",
    tags: ["HR", "Admin"],
    views: 260,
    lessonCount: 6,
    durationMinutes: 90,
    published: true,
    visibility: "everyone",
    accessRule: "open",
  },
  {
    id: "course_9",
    title: "Automation with Studio",
    coverImageUrl: "/images/covers/course-cover.svg",
    bannerImageUrl: "/images/covers/course-banner.svg",
    thumbnailImageUrl: "/images/courses/course-square.svg",
    description:
      "Build smart automations with rules and simple customizations to reduce repetitive work.",
    tags: ["Automation", "Studio"],
    views: 510,
    lessonCount: 7,
    durationMinutes: 115,
    published: true,
    visibility: "signed_in",
    accessRule: "invitation",
  },
  {
    id: "course_10",
    title: "Email & Activities Mastery",
    coverImageUrl: "/images/covers/course-cover.svg",
    bannerImageUrl: "/images/covers/course-banner.svg",
    thumbnailImageUrl: "/images/courses/course-square.svg",
    description:
      "Stay on top of follow-ups using activities, chatter, and clean communication flows.",
    tags: ["Productivity", "Sales"],
    views: 340,
    lessonCount: 4,
    durationMinutes: 60,
    published: true,
    visibility: "everyone",
    accessRule: "open",
  },
  {
    id: "course_draft_1",
    title: "Draft: Hidden Course",
    coverImageUrl: "/images/covers/course-cover.svg",
    bannerImageUrl: "/images/covers/course-banner.svg",
    thumbnailImageUrl: "/images/courses/course-square.svg",
    description: "Not published (should not appear to learners).",
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
  // Keep My Courses focused (4 items) while the Courses page stays rich.
  { userId: "u_learner_1", courseId: "course_1" },
  { userId: "u_learner_1", courseId: "course_4" },
  { userId: "u_learner_1", courseId: "course_5" },
  { userId: "u_learner_1", courseId: "course_7" },
];

export const MOCK_PROGRESS: CourseProgress[] = [
  {
    userId: "u_learner_1",
    courseId: "course_1",
    completionPercent: 28,
    lastLessonId: "lesson_2",
  },
  {
    userId: "u_learner_1",
    courseId: "course_4",
    completionPercent: 16,
    lastLessonId: "lesson_1",
  },
  {
    userId: "u_learner_1",
    courseId: "course_5",
    completionPercent: 34,
    lastLessonId: "lesson_6",
  },
  {
    userId: "u_learner_1",
    courseId: "course_7",
    completionPercent: 14,
    lastLessonId: "lesson_1",
  },
];

// Demo-only: baseline points shown in Profile/My Courses (separate from course progress).
// Everyone starts from 0; earned points come from quiz attempts.
export const MOCK_BASE_POINTS_BY_USER: Record<string, number> = {
  // Intentionally empty
};

export function getMockBasePoints(userId: string): number {
  const value = MOCK_BASE_POINTS_BY_USER[userId];
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

// Payment is a later integration; for now this mock controls the Buy/Start CTA.
export const MOCK_PURCHASES: Array<{ userId: string; courseId: string }> = [
  { userId: "u_learner_1", courseId: "course_7" },
  // { userId: "u_learner_1", courseId: "course_3" },
];

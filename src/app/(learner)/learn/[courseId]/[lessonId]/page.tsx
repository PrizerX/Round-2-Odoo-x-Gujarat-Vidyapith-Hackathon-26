import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import {
  canSeeCourse,
  getProgress,
  hasPurchased,
  isEnrolled,
} from "@/lib/domain/course-logic";
import {
  MOCK_COURSES,
  MOCK_ENROLLMENTS,
  MOCK_PROGRESS,
  MOCK_PURCHASES,
} from "@/lib/data/mock-learning";
import { getCompletedCourseIds } from "@/lib/learning/completed-courses";

import { LearnerPlayerClient, type PlayerLesson } from "./player-client";

// Demo placeholder used for every video lesson for now.
// Replace with real YouTube links later (per-lesson) when you curate the demo content.
const PLACEHOLDER_YOUTUBE_VIDEO_URL = "https://www.youtube.com/watch?v=ysz5S6PUM-U";

function buildDemoQuiz(args: { courseId: string; courseTitle: string }) {
  const isCrm = /crm/i.test(args.courseTitle) || args.courseId === "course_4";

  return {
    id: `quiz_${args.courseId}`,
    title: `${args.courseTitle} Quiz`,
    allowMultipleAttempts: true,
    pointsPerCorrect: 5,
    // Attempt-based scoring (MVP): 1st attempt highest, then reduced.
    pointsPerCorrectByAttempt: [5, 4, 3, 2],
    questions: isCrm
      ? [
          {
            id: "q1",
            prompt: "In Odoo CRM, what does a pipeline stage represent?",
            options: [
              "A step in your sales process",
              "A product category",
              "A warehouse location",
            ],
            correctIndex: 0,
          },
          {
            id: "q2",
            prompt: "Which item is typically managed as a CRM record in Odoo?",
            options: ["Lead / Opportunity", "Journal Entry", "Stock Move"],
            correctIndex: 0,
          },
          {
            id: "q3",
            prompt: "What is an Activity used for in CRM?",
            options: [
              "A reminder / next action like call or email",
              "A payroll rule",
              "A tax configuration",
            ],
            correctIndex: 0,
          },
          {
            id: "q4",
            prompt: "A good reason to use stages is to…",
            options: [
              "Track deal progress and prioritize follow-ups",
              "Increase image resolution",
              "Disable user access",
            ],
            correctIndex: 0,
          },
        ]
      : [
          {
            id: "q1",
            prompt: "What does course completion percentage represent?",
            options: [
              "How much of the course content you’ve finished",
              "Your device battery level",
              "The price discount",
            ],
            correctIndex: 0,
          },
          {
            id: "q2",
            prompt: "A quiz is usually placed at the end of a module to…",
            options: [
              "Evaluate understanding",
              "Change the UI theme",
              "Update your email address",
            ],
            correctIndex: 0,
          },
          {
            id: "q3",
            prompt: "Which UI element is best for single-choice answers?",
            options: ["Radio buttons", "Checkboxes", "File picker"],
            correctIndex: 0,
          },
          {
            id: "q4",
            prompt: "Multiple attempts are useful because they…",
            options: [
              "Encourage retry and learning",
              "Remove all questions",
              "Block course access",
            ],
            correctIndex: 0,
          },
        ],
  };
}

function parseLessonNumber(lessonId: string): number {
  const m = /^lesson_(\d+)$/.exec(lessonId);
  if (!m) return 1;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function buildLessons(args: {
  courseId: string;
  courseTitle: string;
  lessonCount: number;
  completionPercent: number;
}): PlayerLesson[] {
  const { lessonCount, completionPercent } = args;
  const safeLessonCount = Math.max(4, lessonCount || 1);
  const completedCount = Math.floor(
    (Math.max(0, Math.min(100, completionPercent)) / 100) * safeLessonCount,
  );

  const titleOverrides: Record<number, string> = {
    1: "Advanced Sales & CRM Automation in Odoo",
    2: "Document",
    3: "Video",
    [safeLessonCount]: "Quiz",
  };

  const lessons: PlayerLesson[] = [];
  for (let i = 1; i <= safeLessonCount; i += 1) {
    const type: PlayerLesson["type"] =
      i === safeLessonCount ? "quiz" : i % 2 === 0 ? "doc" : "video";
    const title = titleOverrides[i] ?? `Content ${i}`;

    const description =
      type === "video"
        ? "This is a demo video lesson. Replace the YouTube link later."
        : type === "doc"
          ? "This is a demo document lesson (viewer placeholder)."
          : type === "quiz"
            ? "This is a demo quiz lesson (viewer placeholder)."
            : "This is demo content (viewer placeholder).";

    lessons.push({
      id: `lesson_${i}`,
      title,
      type,
      completed: i <= completedCount,
      description,
      videoUrl: type === "video" ? PLACEHOLDER_YOUTUBE_VIDEO_URL : undefined,
      quiz:
        type === "quiz"
          ? buildDemoQuiz({ courseId: args.courseId, courseTitle: args.courseTitle })
          : undefined,
    });
  }
  return lessons;
}

export default async function LearnerPlayerPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const session = await getSession();

  if (!session) {
    redirect(
      `/auth/sign-in?next=${encodeURIComponent(`/learn/${courseId}/${lessonId}`)}`,
    );
  }

  const course = MOCK_COURSES.find((c) => c.id === courseId);
  if (!course) redirect("/courses");

  // Visibility & access guard (prototype).
  if (!canSeeCourse(course, session)) redirect("/courses");

  const enrolled = isEnrolled(courseId, session, MOCK_ENROLLMENTS);
  const purchased = hasPurchased(courseId, session, MOCK_PURCHASES);

  if (course.accessRule === "invitation" && !enrolled) {
    redirect(`/courses/${courseId}`);
  }
  if (course.accessRule === "payment" && !purchased) {
    redirect(`/courses/${courseId}`);
  }

  const progress = getProgress(courseId, session, MOCK_PROGRESS);
  const completedCourses = await getCompletedCourseIds();
  const completionPercent = completedCourses.has(courseId)
    ? 100
    : (progress?.completionPercent ?? 0);

  const lessons = buildLessons({
    courseId,
    courseTitle: course.title,
    lessonCount: Math.max(1, course.lessonCount || 1),
    completionPercent,
  });

  const lessonNumber = parseLessonNumber(lessonId);
  const boundedLessonId = `lesson_${Math.min(Math.max(1, lessonNumber), lessons.length)}`;

  if (boundedLessonId !== lessonId) {
    redirect(`/learn/${courseId}/${boundedLessonId}`);
  }

  return (
    <LearnerPlayerClient
      courseId={courseId}
      courseTitle={course.title}
      completionPercent={completionPercent}
      lessons={lessons}
      currentLessonId={boundedLessonId}
    />
  );
}

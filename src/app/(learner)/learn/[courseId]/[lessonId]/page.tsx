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

import { LearnerPlayerClient, type PlayerLesson } from "./player-client";

function parseLessonNumber(lessonId: string): number {
  const m = /^lesson_(\d+)$/.exec(lessonId);
  if (!m) return 1;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function buildLessons(args: {
  lessonCount: number;
  completionPercent: number;
}): PlayerLesson[] {
  const { lessonCount, completionPercent } = args;
  const completedCount = Math.floor((Math.max(0, Math.min(100, completionPercent)) / 100) * lessonCount);

  const lessons: PlayerLesson[] = [];
  for (let i = 1; i <= lessonCount; i += 1) {
    const type: PlayerLesson["type"] =
      i === lessonCount ? "quiz" : i % 2 === 0 ? "doc" : "video";
    lessons.push({
      id: `lesson_${i}`,
      title: `Lesson ${i}`,
      type,
      completed: i <= completedCount,
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
  const completionPercent = progress?.completionPercent ?? 0;

  const lessons = buildLessons({
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

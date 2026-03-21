import Link from "next/link";

import { getSession } from "@/lib/auth/session";
import {
  getCourseCta,
} from "@/lib/domain/course-logic";
import {
  getCourseForLearnerById,
  getCourseLessonsForLearner,
} from "@/lib/data/db-catalog";
import { getCompletedCourseIds } from "@/lib/learning/completed-courses";
import { getEnrolledCourseIdsForUser } from "@/lib/learning/enrollments";
import { getPurchasedCourseIdsForUser } from "@/lib/learning/purchases";
import { getDbProgressForCourse } from "@/lib/learning/progress";

import { CourseDetailsClient, type CourseDetailsContentItem } from "./course-details-client";

function buildContentList(args: {
  courseId: string;
  lessonsInOrder: Array<{
    routeLessonId: string;
    title: string;
    unitId?: string | null;
    unitTitle?: string | null;
    unitSortOrder?: number | null;
  }>;
  completionPercent: number;
}): CourseDetailsContentItem[] {
  const { courseId, lessonsInOrder, completionPercent } = args;
  const safeLessonCount = Math.max(1, lessonsInOrder.length || 1);
  const completedCount = Math.floor(
    (Math.max(0, Math.min(100, completionPercent)) / 100) * safeLessonCount,
  );

  const items: CourseDetailsContentItem[] = [];
  for (let i = 0; i < lessonsInOrder.length; i += 1) {
    const lesson = lessonsInOrder[i];
    const id = lesson?.routeLessonId ?? `lesson_${i + 1}`;
    const title = lesson?.title ?? `Content ${i + 1}`;
    items.push({
      id,
      title,
      href: `/learn/${courseId}/${id}`,
      completed: i + 1 <= completedCount,
      unitId: lesson?.unitId ?? null,
      unitTitle: lesson?.unitTitle ?? null,
      unitSortOrder: typeof lesson?.unitSortOrder === "number" ? lesson.unitSortOrder : null,
    });
  }

  // Defensive fallback when a course has no lessons yet.
  if (items.length === 0) {
    items.push({
      id: "lesson_1",
      title: "Content 1",
      href: `/learn/${courseId}/lesson_1`,
      completed: false,
    });
  }

  return items;
}

function computeCounts(args: { lessonCount: number; completionPercent: number }) {
  const lessonCount = Math.max(1, args.lessonCount || 1);
  const completionPercent = Math.max(0, Math.min(100, args.completionPercent));
  const completedCount = Math.floor((completionPercent / 100) * lessonCount);
  const incompleteCount = Math.max(0, lessonCount - completedCount);
  return { lessonCount, completedCount, incompleteCount, completionPercent };
}

export default async function LearnerCourseDetailsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const session = await getSession();
  const course = await getCourseForLearnerById({ courseId, session });

  if (!course) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-semibold">Course not found</div>
        <Link className="text-sm font-medium text-primary" href="/courses">
          Back to courses
        </Link>
      </div>
    );
  }

  const [enrolledIds, purchasedIds, dbProgress] = session
    ? await Promise.all([
        getEnrolledCourseIdsForUser(session.user.id),
        getPurchasedCourseIdsForUser(session.user.id),
        getDbProgressForCourse(session.user.id, course.id),
      ])
    : [new Set<string>(), new Set<string>(), null];

  const enrolledDb = session ? enrolledIds.has(course.id) : false;
  const purchasedDb = session ? purchasedIds.has(course.id) : false;

  const enrolledEffective = enrolledDb;
  const purchasedEffective = purchasedDb;
  const progress = (dbProgress as any) ?? null;

  const cta = getCourseCta({
    course,
    session,
    enrolled: enrolledEffective,
    progress,
    purchased: purchasedEffective,
  });

  const completedCourses = await getCompletedCourseIds(session?.user.id);
  const completionPercent = completedCourses.has(course.id)
    ? 100
    : (progress?.completionPercent ?? 0);

  const lessons = await getCourseLessonsForLearner({ courseId, session });
  const lessonsInOrder = lessons ?? [];
  const lessonCount = Math.max(1, lessonsInOrder.length || course.lessonCount || 1);
  const counts = computeCounts({ lessonCount, completionPercent });
  const content = buildContentList({
    courseId,
    lessonsInOrder,
    completionPercent: counts.completionPercent,
  });

  const accessBadges: Array<"Paid" | "Invitation" | "Signed-in only"> = [];
  if (course.accessRule === "payment") accessBadges.push("Paid");
  if (course.accessRule === "invitation") accessBadges.push("Invitation");
  if (course.visibility === "signed_in") accessBadges.push("Signed-in only");

  return (
    <CourseDetailsClient
      courseId={courseId}
      title={course.title}
      description={course.description}
      tags={course.tags}
      coverImageUrl={course.coverImageUrl}
      bannerImageUrl={course.bannerImageUrl}
      thumbnailImageUrl={course.thumbnailImageUrl}
      lessonCount={counts.lessonCount}
      completionPercent={counts.completionPercent}
      completedCount={counts.completedCount}
      incompleteCount={counts.incompleteCount}
      cta={{ label: cta.label, href: cta.href, disabled: cta.disabled }}
      accessBadges={accessBadges}
      priceInr={course.accessRule === "payment" ? course.priceInr : undefined}
      content={content}
      viewer={session ? { id: session.user.id, name: session.user.name } : null}
    />
  );
}

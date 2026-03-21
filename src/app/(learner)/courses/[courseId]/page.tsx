import Link from "next/link";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
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
    dbLessonId: string;
    routeLessonId: string;
    title: string;
    unitId?: string | null;
    unitTitle?: string | null;
    unitSortOrder?: number | null;
  }>;
  visitedLessonIds: Set<string>; // db ids
  completedLessonIds: Set<string>; // db ids
  lockedAfterIndex: number;
}): CourseDetailsContentItem[] {
  const { courseId, lessonsInOrder } = args;

  const items: CourseDetailsContentItem[] = [];
  for (let i = 0; i < lessonsInOrder.length; i += 1) {
    const lesson = lessonsInOrder[i];
    const id = lesson?.routeLessonId ?? `lesson_${i + 1}`;
    const title = lesson?.title ?? `Content ${i + 1}`;
    items.push({
      id,
      title,
      href: `/learn/${courseId}/${id}`,
      visited: !!lesson?.dbLessonId && args.visitedLessonIds.has(lesson.dbLessonId),
      completed: !!lesson?.dbLessonId && args.completedLessonIds.has(lesson.dbLessonId),
      locked: i > args.lockedAfterIndex,
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
      visited: false,
      completed: false,
      locked: false,
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
  const courseCompletedOverride = completedCourses.has(course.id);

  const lessons = await getCourseLessonsForLearner({ courseId, session });
  const lessonsInOrder = lessons ?? [];

  const visitedLessonIds = new Set<string>();
  const completedLessonIds = new Set<string>();
  if (session && lessonsInOrder.length > 0) {
    const progressRows = (await prisma.lessonProgress.findMany({
      where: { userId: session.user.id, lessonId: { in: lessonsInOrder.map((l) => l.dbLessonId) } },
      select: { lessonId: true, completed: true },
    })) as Array<{ lessonId: string; completed: boolean }>;

    for (const r of progressRows) {
      visitedLessonIds.add(r.lessonId);
      if (r.completed) completedLessonIds.add(r.lessonId);
    }
  }

  if (courseCompletedOverride) {
    for (const l of lessonsInOrder) {
      visitedLessonIds.add(l.dbLessonId);
      completedLessonIds.add(l.dbLessonId);
    }
  }

  const lessonCount = Math.max(1, lessonsInOrder.length || course.lessonCount || 1);
  const completedCount = courseCompletedOverride ? lessonCount : completedLessonIds.size;
  const completionPercent = courseCompletedOverride
    ? 100
    : Math.max(0, Math.min(100, Math.floor((completedCount / Math.max(1, lessonCount)) * 100)));

  const counts = {
    lessonCount,
    completedCount: Math.max(0, Math.min(lessonCount, completedCount)),
    incompleteCount: Math.max(0, lessonCount - Math.max(0, Math.min(lessonCount, completedCount))),
    completionPercent,
  };

  let lockedAfterIndex = lessonsInOrder.length - 1;
  if (!courseCompletedOverride && lessonsInOrder.length > 0) {
    const firstIncomplete = lessonsInOrder.findIndex((l) => !completedLessonIds.has(l.dbLessonId));
    lockedAfterIndex = firstIncomplete >= 0 ? firstIncomplete : lessonsInOrder.length - 1;
  }

  const content = buildContentList({
    courseId,
    lessonsInOrder,
    visitedLessonIds,
    completedLessonIds,
    lockedAfterIndex,
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

import { getSession } from "@/lib/auth/session";
import { getCoursesForLearnerCatalog } from "@/lib/data/db-catalog";
import { canSeeCourse, getCourseCta } from "@/lib/domain/course-logic";
import { getCompletedCourseIds } from "@/lib/learning/completed-courses";
import { getEnrolledCourseIdsForUser } from "@/lib/learning/enrollments";
import { getPurchasedCourseIdsForUser } from "@/lib/learning/purchases";
import { getDbProgressMapForUser } from "@/lib/learning/progress";

import { LearnerCoursesClient, type LearnerCatalogCourseCard } from "./courses-client";

export default async function LearnerCoursesPage(props: { searchParams?: Promise<{ q?: string }> }) {
  const session = await getSession();
  const completedCourses = await getCompletedCourseIds(session?.user.id);
  const searchParams = await props.searchParams;
  const initialQuery = searchParams?.q ?? "";

  const userId = session?.user.id ?? null;
  const [enrolledIds, purchasedIds, dbProgress] = userId
    ? await Promise.all([
        getEnrolledCourseIdsForUser(userId),
        getPurchasedCourseIdsForUser(userId),
        getDbProgressMapForUser(userId),
      ])
    : [new Set<string>(), new Set<string>(), {} as Record<string, any>];

  const coursesAll = await getCoursesForLearnerCatalog(session);
  const courses = coursesAll.filter((c) => canSeeCourse(c, session));

  const courseCards: LearnerCatalogCourseCard[] = courses.map((course) => {
    const enrolled = session ? enrolledIds.has(course.id) : false;
    const purchased = session ? purchasedIds.has(course.id) : false;

    const progress = session ? (dbProgress[course.id] ?? null) : null;
    const cta = getCourseCta({
      course,
      session,
      enrolled,
      progress,
      purchased,
    });

    const completionPercent = completedCourses.has(course.id)
      ? 100
      : (progress?.completionPercent ?? null);

    return {
      id: course.id,
      title: course.title,
      tags: course.tags,
      views: course.views ?? 0,
      lessonCount: course.lessonCount,
      durationMinutes: course.durationMinutes,
      accessRule: course.accessRule,
      visibility: course.visibility,
      priceInr: course.priceInr,
      enrolled,
      completionPercent,
      cta,
    };
  });

  return <LearnerCoursesClient courses={courseCards} initialQuery={initialQuery} />;
}

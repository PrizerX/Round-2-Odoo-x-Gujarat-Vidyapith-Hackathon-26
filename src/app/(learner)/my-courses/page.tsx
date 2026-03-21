import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import {
  canSeeCourse,
  getCourseCta,
  hasPurchased,
  isEnrolled,
} from "@/lib/domain/course-logic";
import { getBadgeForPoints } from "@/lib/domain/gamification";
import {
  MOCK_COURSES,
  MOCK_ENROLLMENTS,
  MOCK_PURCHASES,
  getMockBasePoints,
} from "@/lib/data/mock-learning";
import { getCompletedCourseIds } from "@/lib/learning/completed-courses";
import { getEnrolledCourseIdsForUser } from "@/lib/learning/enrollments";
import { getPurchasedCourseIdsForUser } from "@/lib/learning/purchases";
import { getDbProgressMapForUser } from "@/lib/learning/progress";
import { getTotalEarnedPointsForUser } from "@/lib/learning/points";

import { MyCoursesClient, type MyCourseCard } from "./my-courses-client";

function getTotalPoints(userId: string): number {
  return getMockBasePoints(userId);
}

export default async function MyCoursesPage() {
  const session = await getSession();
  if (!session) redirect("/auth/sign-in?next=/my-courses");

  const userId = session.user.id;
  const earned = await getTotalEarnedPointsForUser(userId);
  const points = getTotalPoints(userId) + earned;
  const badge = getBadgeForPoints(points);
  const completedCourses = await getCompletedCourseIds(userId);

  const [enrolledIds, purchasedIds, dbProgress] = await Promise.all([
    getEnrolledCourseIdsForUser(userId),
    getPurchasedCourseIdsForUser(userId),
    getDbProgressMapForUser(userId),
  ]);

  const myCourses = MOCK_COURSES.filter((course) => {
    if (!canSeeCourse(course, session)) return false;
    const enrolled = enrolledIds.has(course.id) || isEnrolled(course.id, session, MOCK_ENROLLMENTS);
    const purchased = purchasedIds.has(course.id) || hasPurchased(course.id, session, MOCK_PURCHASES);
    return enrolled || purchased;
  });

  const courses: MyCourseCard[] = myCourses.map((course) => {
    const enrolled = enrolledIds.has(course.id) || isEnrolled(course.id, session, MOCK_ENROLLMENTS);
    const purchased = purchasedIds.has(course.id) || hasPurchased(course.id, session, MOCK_PURCHASES);
    const progress = (dbProgress[course.id] as any) ?? null;
    const cta = getCourseCta({ course, session, enrolled, progress, purchased });

    const completionPercent = completedCourses.has(course.id)
      ? 100
      : (progress?.completionPercent ?? 0);

    const accessPill =
      course.accessRule === "payment"
        ? "Paid"
        : course.accessRule === "invitation"
          ? "Invitation"
          : undefined;

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      coverImageUrl: course.coverImageUrl,
      tags: course.tags,
      completionPercent,
      cta: { label: cta.label, href: cta.href, disabled: cta.disabled },
      accessPill,
      priceInr: course.priceInr,
    };
  });

  return (
    <MyCoursesClient
      courses={courses}
      points={points}
      badge={badge}
      userName={session.user.name}
    />
  );
}

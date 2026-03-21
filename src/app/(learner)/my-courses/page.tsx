import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import {
  canSeeCourse,
  getCourseCta,
  getProgress,
  hasPurchased,
  isEnrolled,
} from "@/lib/domain/course-logic";
import { getBadgeForPoints } from "@/lib/domain/gamification";
import {
  MOCK_COURSES,
  MOCK_ENROLLMENTS,
  MOCK_PROGRESS,
  MOCK_PURCHASES,
} from "@/lib/data/mock-learning";
import { getCompletedCourseIds } from "@/lib/learning/completed-courses";

import { MyCoursesClient, type MyCourseCard } from "./my-courses-client";

function getTotalPoints(userId: string): number {
  const total = MOCK_PROGRESS.filter((p) => p.userId === userId).reduce(
    (sum, p) => sum + (p.completionPercent ?? 0),
    0,
  );
  return Math.max(0, Math.round(total));
}

export default async function MyCoursesPage() {
  const session = await getSession();
  if (!session) redirect("/auth/sign-in?next=/my-courses");

  const userId = session.user.id;
  const points = getTotalPoints(userId);
  const badge = getBadgeForPoints(points);
  const completedCourses = await getCompletedCourseIds();

  const myCourses = MOCK_COURSES.filter((course) => {
    if (!canSeeCourse(course, session)) return false;
    const enrolled = isEnrolled(course.id, session, MOCK_ENROLLMENTS);
    const purchased = hasPurchased(course.id, session, MOCK_PURCHASES);
    return enrolled || purchased;
  });

  const courses: MyCourseCard[] = myCourses.map((course) => {
    const enrolled = isEnrolled(course.id, session, MOCK_ENROLLMENTS);
    const progress = getProgress(course.id, session, MOCK_PROGRESS);
    const purchased = hasPurchased(course.id, session, MOCK_PURCHASES);
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

import Link from "next/link";

import { getSession } from "@/lib/auth/session";
import {
  getCourseCta,
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

import { CourseDetailsClient, type CourseDetailsContentItem } from "./course-details-client";

function buildContentList(args: {
  courseId: string;
  lessonCount: number;
  completionPercent: number;
}): CourseDetailsContentItem[] {
  const { courseId, lessonCount, completionPercent } = args;
  const safeLessonCount = Math.max(1, lessonCount || 1);
  const completedCount = Math.floor((Math.max(0, Math.min(100, completionPercent)) / 100) * safeLessonCount);

  const titles = [
    "Advanced Sales & CRM Automation in Odoo",
    "Odoo CRM: Advanced Features & Best Practices",
  ];

  const items: CourseDetailsContentItem[] = [];
  for (let i = 1; i <= safeLessonCount; i += 1) {
    items.push({
      id: `lesson_${i}`,
      title: titles[i - 1] ?? `Content ${i}`,
      href: `/learn/${courseId}/lesson_${i}`,
      completed: i <= completedCount,
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
  const course = MOCK_COURSES.find((c) => c.id === courseId);

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

  const enrolled = isEnrolled(course.id, session, MOCK_ENROLLMENTS);
  const progress = getProgress(course.id, session, MOCK_PROGRESS);
  const purchased = hasPurchased(course.id, session, MOCK_PURCHASES);
  const cta = getCourseCta({ course, session, enrolled, progress, purchased });

  const completedCourses = await getCompletedCourseIds();
  const completionPercent = completedCourses.has(course.id)
    ? 100
    : (progress?.completionPercent ?? 0);
  const counts = computeCounts({ lessonCount: course.lessonCount, completionPercent });
  const content = buildContentList({
    courseId,
    lessonCount: counts.lessonCount,
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

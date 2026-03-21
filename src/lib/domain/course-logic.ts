import type { Session } from "@/lib/auth/types";
import type { Course, CourseProgress, Enrollment } from "@/lib/domain/types";

export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}m`;
  if (m <= 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function canSeeCourse(course: Course, session: Session | null): boolean {
  if (!course.published) return false;
  if (course.visibility === "everyone") return true;
  return !!session;
}

export function isEnrolled(
  courseId: string,
  session: Session | null,
  enrollments: Enrollment[],
): boolean {
  if (!session) return false;
  return enrollments.some(
    (e) => e.courseId === courseId && e.userId === session.user.id,
  );
}

export function getProgress(
  courseId: string,
  session: Session | null,
  progress: CourseProgress[],
): CourseProgress | null {
  if (!session) return null;
  return (
    progress.find(
      (p) => p.courseId === courseId && p.userId === session.user.id,
    ) ?? null
  );
}

export function hasPurchased(
  courseId: string,
  session: Session | null,
  purchases: Array<{ userId: string; courseId: string }>,
): boolean {
  if (!session) return false;
  return purchases.some(
    (p) => p.courseId === courseId && p.userId === session.user.id,
  );
}

export type CourseCta = {
  label: "Join" | "Start" | "Continue" | "Buy" | "Invitation Only";
  href: string;
  disabled?: boolean;
};

export function getCourseCta(args: {
  course: Course;
  session: Session | null;
  enrolled: boolean;
  progress: CourseProgress | null;
  purchased: boolean;
}): CourseCta {
  const { course, session, enrolled, progress, purchased } = args;

  if (!session) {
    // Spec says guest sees Join. We route them to auth first.
    return { label: "Join", href: `/auth/sign-in?next=/courses/${course.id}` };
  }

  if (course.accessRule === "payment" && !purchased) {
    return { label: "Buy", href: `/courses/${course.id}` };
  }

  if (course.accessRule === "invitation" && !enrolled) {
    return { label: "Invitation Only", href: `/courses/${course.id}`, disabled: true };
  }

  // UX tweak: for open courses, require an explicit Join step before learning.
  if (course.accessRule === "open" && !enrolled && !purchased) {
    const next = encodeURIComponent(`/courses/${course.id}`);
    return { label: "Join", href: `/api/courses/join?courseId=${course.id}&next=${next}` };
  }

  const completion = progress?.completionPercent ?? 0;
  const lastLessonId = progress?.lastLessonId ?? "lesson_1";

  if (completion > 0 && completion < 100) {
    return { label: "Continue", href: `/learn/${course.id}/${lastLessonId}` };
  }

  // Signed-in, open or invited, not started (or completed)
  return { label: "Start", href: `/learn/${course.id}/lesson_1` };
}

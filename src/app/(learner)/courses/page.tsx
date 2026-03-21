import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";
import {
  formatDuration,
  getCourseCta,
  getProgress,
  hasPurchased,
  isEnrolled,
  canSeeCourse,
} from "@/lib/domain/course-logic";
import {
  MOCK_COURSES,
  MOCK_ENROLLMENTS,
  MOCK_PROGRESS,
  MOCK_PURCHASES,
} from "@/lib/data/mock-learning";
import { getCompletedCourseIds } from "@/lib/learning/completed-courses";

export default async function LearnerCoursesPage() {
  const session = await getSession();
  const completedCourses = await getCompletedCourseIds();

  const courses = MOCK_COURSES.filter((c) => canSeeCourse(c, session));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Courses</h1>
        <p className="text-sm text-muted">
          Browse published courses. Buttons change based on your state.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => {
          const enrolled = isEnrolled(course.id, session, MOCK_ENROLLMENTS);
          const progress = getProgress(course.id, session, MOCK_PROGRESS);
          const purchased = hasPurchased(course.id, session, MOCK_PURCHASES);
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

          return (
            <Card key={course.id} className="relative flex flex-col overflow-hidden">
              {enrolled && (
                <div
                  className="pointer-events-none absolute right-0 top-0 z-10 translate-x-8 translate-y-5 rotate-45 bg-emerald-600 px-10 py-1 text-xs font-extrabold text-white shadow"
                  aria-label="Enrolled"
                >
                  Enrolled
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription>
                      {course.lessonCount} lessons • {formatDuration(course.durationMinutes)}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {course.accessRule === "payment" && (
                      <>
                        <Badge>Paid</Badge>
                        {typeof course.priceInr === "number" && (
                          <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-900">
                            ₹{course.priceInr}
                          </div>
                        )}
                      </>
                    )}
                    {course.accessRule === "invitation" && <Badge>Invitation</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                <div className="flex flex-wrap gap-2">
                  {course.tags.map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-muted">
                    {course.views.toLocaleString()} views
                    {completionPercent !== null && (
                      <span className="ml-2 font-medium text-emerald-700">• {completionPercent}%</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={cta.href} aria-disabled={cta.disabled}>
                      <Button size="sm" disabled={cta.disabled}>
                        {cta.label}
                      </Button>
                    </Link>
                    <Link
                      href={`/courses/${course.id}`}
                      className="text-sm font-medium text-primary"
                    >
                      Details
                    </Link>
                  </div>
                </div>
                {course.visibility === "signed_in" && (
                  <div className="text-xs text-muted">Signed-in only</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

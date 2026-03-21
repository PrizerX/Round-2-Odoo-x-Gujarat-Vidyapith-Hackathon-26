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

export default async function LearnerCoursesPage() {
  const session = await getSession();

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

          return (
            <Card key={course.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription>
                      {course.lessonCount} lessons • {formatDuration(course.durationMinutes)}
                    </CardDescription>
                  </div>
                  {course.accessRule === "payment" && (
                    <Badge>Paid</Badge>
                  )}
                  {course.accessRule === "invitation" && (
                    <Badge>Invitation</Badge>
                  )}
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
                    {progress && (
                      <span className="ml-2">• {progress.completionPercent}%</span>
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
                {course.accessRule === "payment" && course.priceInr && (
                  <div className="text-xs text-muted">Price: ₹{course.priceInr}</div>
                )}
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

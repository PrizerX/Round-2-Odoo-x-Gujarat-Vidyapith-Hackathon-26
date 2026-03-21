import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";
import {
  canSeeCourse,
  formatDuration,
  getCourseCta,
  getProgress,
  hasPurchased,
  isEnrolled,
} from "@/lib/domain/course-logic";
import { getBadgeForPoints, formatPointsToNext } from "@/lib/domain/gamification";
import {
  MOCK_COURSES,
  MOCK_ENROLLMENTS,
  MOCK_PROGRESS,
  MOCK_PURCHASES,
} from "@/lib/data/mock-learning";

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

  const courses = MOCK_COURSES.filter((c) => canSeeCourse(c, session)).filter((c) => {
    const enrolled = isEnrolled(c.id, session, MOCK_ENROLLMENTS);
    const purchased = hasPurchased(c.id, session, MOCK_PURCHASES);
    return enrolled || purchased;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">My Courses</h1>
          <p className="text-sm text-muted">
            Your enrolled and purchased courses, with progress and dynamic actions.
          </p>
        </div>
        <Link href="/courses" className="text-sm font-medium text-primary hover:underline">
          Browse all courses
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle>Profile snapshot</CardTitle>
              <div className="text-sm text-muted">Points & badge level</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{badge.name}</Badge>
              <div className="text-sm">
                <span className="font-semibold">{points}</span> pts
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted">{formatPointsToNext(points)}</div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
            <div
              className="h-full bg-primary"
              style={{ width: `${Math.min(100, Math.max(0, (points / 120) * 100))}%` }}
            />
          </div>
          <div>
            <Link href="/profile" className="text-sm font-medium text-primary hover:underline">
              View full profile
            </Link>
          </div>
        </CardContent>
      </Card>

      {courses.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No courses yet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted">
            Join a course from the courses page to see it here.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const enrolled = isEnrolled(course.id, session, MOCK_ENROLLMENTS);
            const progress = getProgress(course.id, session, MOCK_PROGRESS);
            const purchased = hasPurchased(course.id, session, MOCK_PURCHASES);
            const cta = getCourseCta({ course, session, enrolled, progress, purchased });

            return (
              <Card key={course.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{course.title}</CardTitle>
                      <div className="text-sm text-muted">
                        {course.lessonCount} lessons • {formatDuration(course.durationMinutes)}
                      </div>
                    </div>
                    <Badge>{progress?.completionPercent ?? 0}%</Badge>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map((t) => (
                      <Badge key={t}>{t}</Badge>
                    ))}
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${progress?.completionPercent ?? 0}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-muted">{course.views.toLocaleString()} views</div>
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

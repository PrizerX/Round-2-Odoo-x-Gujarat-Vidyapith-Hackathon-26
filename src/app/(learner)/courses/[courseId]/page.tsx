import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";
import {
  formatDuration,
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

  return (
    <div className="space-y-5">
      <div className="text-xs text-muted">
        <Link href="/courses" className="hover:underline">
          Courses
        </Link>
        <span className="px-2">/</span>
        <span className="text-foreground">{courseId}</span>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle>{course.title}</CardTitle>
            <div className="flex items-center gap-2">
              {!course.published && <Badge>Draft</Badge>}
              {course.accessRule === "payment" && <Badge>Paid</Badge>}
              {course.accessRule === "invitation" && <Badge>Invitation</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted">
            {course.lessonCount} lessons • {formatDuration(course.durationMinutes)} • {course.views.toLocaleString()} views
          </div>
          <div className="flex flex-wrap gap-2">
            {course.tags.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
          {progress && (
            <div className="text-sm text-muted">Progress: {progress.completionPercent}%</div>
          )}
          <div className="text-sm text-muted">
            Visibility: <span className="text-foreground">{course.visibility}</span> • Access: <span className="text-foreground">{course.accessRule}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href={cta.href} aria-disabled={cta.disabled}>
              <Button disabled={cta.disabled}>{cta.label}</Button>
            </Link>
            <Link href={`/learn/${courseId}/lesson_1`} className="text-sm font-medium text-primary">
              Open Player
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

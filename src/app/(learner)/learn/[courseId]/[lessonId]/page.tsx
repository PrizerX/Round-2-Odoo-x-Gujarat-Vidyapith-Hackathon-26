import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LearnerPlayerPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-[12px] border border-border bg-surface p-4">
        <div className="text-sm font-semibold">{courseId}</div>
        <div className="mt-1 text-xs text-muted">Completion: 0%</div>
        <div className="mt-4 text-sm text-muted">Lessons (collapsible next)</div>
        <div className="mt-2 space-y-1 text-sm">
          <div className="rounded-[10px] bg-accent px-3 py-2">{lessonId}</div>
          <div className="rounded-[10px] px-3 py-2 hover:bg-accent">lesson_2</div>
        </div>
      </aside>

      <section className="space-y-4">
        <div className="text-xs text-muted">
          <Link href="/courses" className="hover:underline">
            Back to Courses
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lesson Player</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted">
              Top lesson description, then media viewer (Video/Doc/Image/Quiz).
            </div>
            <div className="flex aspect-video items-center justify-center rounded-[12px] border border-border bg-accent text-sm text-muted">
              Media Viewer Placeholder
            </div>
            <div className="flex items-center justify-between">
              <Link href="/courses" className="text-sm font-medium text-primary">
                Back
              </Link>
              <Link
                href={`/learn/${courseId}/lesson_2`}
                className="text-sm font-medium text-primary"
              >
                Next Content
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

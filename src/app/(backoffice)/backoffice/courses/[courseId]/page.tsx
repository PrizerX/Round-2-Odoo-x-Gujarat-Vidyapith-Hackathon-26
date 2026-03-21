import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BackofficeEditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-muted">
            <Link href="/backoffice/courses" className="hover:underline">
              Courses
            </Link>
            <span className="px-2">/</span>
            <span className="text-foreground">{courseId}</span>
          </div>
          <h1 className="text-xl font-semibold">Edit Course</h1>
        </div>
        <Button variant="primary">Save</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>4-Tab Layout (coming next)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted">
          <div>1) Content — lesson list + 3-dot actions + Add Content (modal)</div>
          <div>2) Description — rich text editor</div>
          <div>3) Options — visibility + access rules</div>
          <div>4) Quiz — linked quizzes + Add Quiz (modal)</div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="secondary">Add Content (modal)</Button>
        <Button variant="secondary">Add Quiz (modal)</Button>
        <Button variant="danger">Delete Course (confirm)</Button>
      </div>
    </div>
  );
}

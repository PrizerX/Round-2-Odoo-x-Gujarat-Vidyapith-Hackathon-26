import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BackofficeCoursesPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Courses</h1>
          <p className="text-sm text-muted">
            Dashboard placeholder — Kanban/List toggle + search comes next.
          </p>
        </div>
        <Button variant="primary">Add Course</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Sample Course</CardTitle>
            <CardDescription>Published • 4 lessons • 1h 20m</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-sm text-muted">Tags: Basics, UI</div>
            <Link
              href="/backoffice/courses/course_1"
              className="text-sm font-medium text-primary"
            >
              Edit
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Draft Course</CardTitle>
            <CardDescription>Not published</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-sm text-muted">Tags: Advanced</div>
            <Link
              href="/backoffice/courses/course_2"
              className="text-sm font-medium text-primary"
            >
              Edit
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

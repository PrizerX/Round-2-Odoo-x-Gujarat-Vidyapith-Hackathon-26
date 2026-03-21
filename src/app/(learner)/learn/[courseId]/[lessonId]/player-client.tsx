"use client";

import Link from "next/link";
import * as React from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export type PlayerLesson = {
  id: string;
  title: string;
  type: "video" | "doc" | "image" | "quiz";
  completed: boolean;
};

export function LearnerPlayerClient(props: {
  courseId: string;
  courseTitle: string;
  completionPercent: number;
  lessons: PlayerLesson[];
  currentLessonId: string;
}) {
  const { courseId, courseTitle, completionPercent, lessons, currentLessonId } = props;

  const [collapsed, setCollapsed] = React.useState(false);

  const currentIndex = Math.max(
    0,
    lessons.findIndex((l) => l.id === currentLessonId),
  );
  const current = lessons[currentIndex] ?? lessons[0];
  const prev = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const next = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  return (
    <div className={cn("grid gap-4", collapsed ? "lg:grid-cols-[84px_1fr]" : "lg:grid-cols-[320px_1fr]")}> 
      <aside className="rounded-[12px] border border-border bg-surface p-3">
        <div className={cn("flex items-start justify-between gap-2", collapsed && "flex-col")}> 
          <div className={cn("min-w-0", collapsed && "hidden lg:block")}> 
            <div className="truncate text-sm font-semibold">{courseTitle}</div>
            <div className="mt-1 text-xs text-muted">Completion: {completionPercent}%</div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            className={cn("shrink-0", collapsed && "w-full justify-center")}
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <>
                <PanelLeftOpen className="h-4 w-4" />
                <span className="hidden lg:inline">Expand</span>
              </>
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" />
                <span className="hidden lg:inline">Collapse</span>
              </>
            )}
          </Button>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-accent">
          <div className="h-full bg-primary" style={{ width: `${completionPercent}%` }} />
        </div>

        <div className={cn("mt-4 space-y-1", collapsed && "mt-3")}> 
          {lessons.map((lesson) => {
            const active = lesson.id === currentLessonId;
            return (
              <Link
                key={lesson.id}
                href={`/learn/${courseId}/${lesson.id}`}
                className={cn(
                  "flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm transition-colors",
                  active ? "bg-accent" : "hover:bg-accent",
                  collapsed && "justify-center px-2",
                )}
                title={lesson.title}
              >
                {lesson.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-muted" />
                )}
                <span className={cn("truncate", collapsed && "hidden")}>{lesson.title}</span>
              </Link>
            );
          })}
        </div>
      </aside>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/my-courses" className="text-sm font-medium text-primary hover:underline">
            Back to My Courses
          </Link>
          <Link href={`/courses/${courseId}`} className="text-sm font-medium text-primary hover:underline">
            Course details
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{current?.title ?? "Lesson"}</CardTitle>
            <div className="text-sm text-muted">
              Description and viewer for: <span className="text-foreground">{current?.type ?? "content"}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex aspect-video items-center justify-center rounded-[12px] border border-border bg-accent text-sm text-muted">
              {current?.type === "quiz" ? "Quiz Viewer Placeholder" : "Media Viewer Placeholder"}
            </div>

            <div className="flex items-center justify-between gap-3">
              {prev ? (
                <Link href={`/learn/${courseId}/${prev.id}`}>
                  <Button variant="secondary" size="sm">
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                </Link>
              ) : (
                <Button variant="secondary" size="sm" disabled>
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              )}

              {next ? (
                <Link href={`/learn/${courseId}/${next.id}`}>
                  <Button size="sm">
                    Next Content
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Button size="sm" disabled>
                  Next Content
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

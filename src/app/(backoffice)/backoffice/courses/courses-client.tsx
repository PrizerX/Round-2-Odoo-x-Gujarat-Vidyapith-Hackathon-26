"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGrid, List, Share2, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";

export type BackofficeCourseListItem = {
  id: string;
  title: string;
  published: boolean;
  views: number;
  lessonCount: number;
  durationMinutes: number;
  tags: string[];
  thumbnailUrl: string | null;
  coverUrl: string | null;
  bannerUrl: string | null;
  updatedAt: string | null;
};

type DashboardView = "list" | "kanban";

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}m`;
  if (m <= 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function buildBackofficeCoursesHref(args: { q: string; view: DashboardView }): string {
  const q = args.q.trim();
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (args.view && args.view !== "list") params.set("view", args.view);
  const qs = params.toString();
  return qs ? `/backoffice/courses?${qs}` : "/backoffice/courses";
}

function CourseStatsRow(props: { views: number; lessonCount: number; durationMinutes: number }) {
  return (
    <div className="grid grid-cols-3 gap-4 text-xs">
      <div>
        <div className="text-muted">Views</div>
        <div className="font-semibold text-foreground">{(props.views ?? 0).toLocaleString()}</div>
      </div>
      <div>
        <div className="text-muted">Contents</div>
        <div className="font-semibold text-foreground">{props.lessonCount ?? 0}</div>
      </div>
      <div>
        <div className="text-muted">Duration</div>
        <div className="font-semibold text-foreground">{formatDuration(props.durationMinutes ?? 0)}</div>
      </div>
    </div>
  );
}

function KanbanColumn(props: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[16px] border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="text-sm font-semibold">{props.title}</div>
        <Badge>{props.count}</Badge>
      </div>
      <div className="space-y-3 p-4">{props.children}</div>
    </div>
  );
}

export function BackofficeCoursesClient(props: {
  courses: BackofficeCourseListItem[];
  initialQuery: string;
  initialView: DashboardView;
  initialCreateOpen?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState(props.initialQuery);
  const [view, setView] = React.useState<DashboardView>(props.initialView ?? "list");
  const [createOpen, setCreateOpen] = React.useState(!!props.initialCreateOpen);
  const [createBusy, setCreateBusy] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [shareId, setShareId] = React.useState<string | null>(null);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildBackofficeCoursesHref({ q: query, view }));
  };

  const setViewAndUrl = (nextView: DashboardView) => {
    setView(nextView);
    router.push(buildBackofficeCoursesHref({ q: query, view: nextView }));
  };

  const onShare = async (courseId: string) => {
    const url = `${window.location.origin}/courses/${courseId}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareId(courseId);
      window.setTimeout(() => setShareId((v) => (v === courseId ? null : v)), 1200);
    } catch {
      // Fallback: open preview link in new tab if clipboard is blocked.
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const onCreate = async () => {
    const safeTitle = title.trim().slice(0, 120);
    if (!safeTitle) {
      setError("Course name is required.");
      return;
    }

    setCreateBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/backoffice/courses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: safeTitle }),
      });

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok || typeof data.courseId !== "string") {
        setError(typeof data?.error === "string" ? data.error : "Failed to create course.");
        return;
      }

      setCreateOpen(false);
      setTitle("");
      router.push(`/backoffice/courses/${data.courseId}`);
      router.refresh();
    } finally {
      setCreateBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Courses</h1>
          <p className="text-sm text-muted">Manage courses, publish to the learner site, and add content.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-[12px] border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => setViewAndUrl("kanban")}
              className={
                view === "kanban"
                  ? "rounded-[10px] bg-accent px-3 py-2 text-sm font-semibold"
                  : "rounded-[10px] px-3 py-2 text-sm text-muted hover:bg-accent"
              }
              aria-label="Kanban view"
              title="Kanban view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewAndUrl("list")}
              className={
                view === "list"
                  ? "rounded-[10px] bg-accent px-3 py-2 text-sm font-semibold"
                  : "rounded-[10px] px-3 py-2 text-sm text-muted hover:bg-accent"
              }
              aria-label="List view"
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            + Add Course
          </Button>
        </div>
      </div>

      <form onSubmit={onSearch} className="flex flex-wrap items-end gap-3">
        <div className="w-full max-w-md">
          <Label htmlFor="q">Search</Label>
          <Input id="q" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search courses by name" />
        </div>
        <Button type="submit" variant="secondary">Search</Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setQuery("");
            router.push(buildBackofficeCoursesHref({ q: "", view }));
          }}
        >
          Clear
        </Button>
      </form>

      {view === "kanban" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <KanbanColumn
            title="Draft"
            count={props.courses.filter((c) => !c.published).length}
          >
            {props.courses
              .filter((c) => !c.published)
              .map((c) => (
                <Card key={c.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="line-clamp-1">{c.title}</CardTitle>
                        <CardDescription className="mt-1">Draft</CardDescription>
                      </div>
                      <Badge>Draft</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <CourseStatsRow views={c.views} lessonCount={c.lessonCount} durationMinutes={c.durationMinutes} />
                    <div className="flex flex-wrap gap-2">
                      {(c.tags ?? []).slice(0, 4).map((t) => (
                        <Badge key={t}>{t}</Badge>
                      ))}
                      {(!c.tags || c.tags.length === 0) && <span className="text-xs text-muted">No tags</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <Link href={`/backoffice/courses/${c.id}`} className="text-sm font-medium text-primary">
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary"
                        onClick={() => onShare(c.id)}
                      >
                        <Share2 className="h-4 w-4" />
                        {shareId === c.id ? "Copied" : "Share"}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </KanbanColumn>

          <KanbanColumn
            title="Published"
            count={props.courses.filter((c) => c.published).length}
          >
            {props.courses
              .filter((c) => c.published)
              .map((c) => (
                <Card key={c.id} className="relative overflow-hidden">
                  <div
                    className="pointer-events-none absolute right-0 top-0 z-10 translate-x-8 translate-y-5 rotate-45 bg-emerald-600 px-10 py-1 text-xs font-extrabold text-white shadow"
                    aria-label="Published"
                  >
                    Published
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="line-clamp-1">{c.title}</CardTitle>
                        <CardDescription className="mt-1">Published</CardDescription>
                      </div>
                      <Badge>Published</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <CourseStatsRow views={c.views} lessonCount={c.lessonCount} durationMinutes={c.durationMinutes} />
                    <div className="flex flex-wrap gap-2">
                      {(c.tags ?? []).slice(0, 4).map((t) => (
                        <Badge key={t}>{t}</Badge>
                      ))}
                      {(!c.tags || c.tags.length === 0) && <span className="text-xs text-muted">No tags</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <Link href={`/backoffice/courses/${c.id}`} className="text-sm font-medium text-primary">
                        Edit
                      </Link>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 text-sm font-medium text-primary"
                          onClick={() => onShare(c.id)}
                        >
                          <Share2 className="h-4 w-4" />
                          {shareId === c.id ? "Copied" : "Share"}
                        </button>
                        <Link href={`/courses/${c.id}`} className="text-sm font-medium text-primary">
                          Preview
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </KanbanColumn>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {props.courses.map((c) => {
            const thumb = c.thumbnailUrl || c.coverUrl || c.bannerUrl;
            return (
              <Card key={c.id} className="relative overflow-hidden">
                {c.published && (
                  <div
                    className="pointer-events-none absolute right-0 top-0 z-10 translate-x-8 translate-y-5 rotate-45 bg-emerald-600 px-10 py-1 text-xs font-extrabold text-white shadow"
                    aria-label="Published"
                  >
                    Published
                  </div>
                )}
                <div className="relative h-28 w-full bg-accent">
                  {thumb ? (
                    <Image src={thumb} alt="Course image" fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted">No image</div>
                  )}
                </div>

                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="line-clamp-1">{c.title}</CardTitle>
                      <CardDescription>
                        {c.published ? "Published" : "Draft"} • {c.lessonCount} contents • {formatDuration(c.durationMinutes)}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {c.published ? <Badge>Published</Badge> : <Badge>Draft</Badge>}
                      <div className="text-xs text-muted">{(c.views ?? 0).toLocaleString()} views</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {(c.tags ?? []).slice(0, 4).map((t) => (
                      <Badge key={t}>{t}</Badge>
                    ))}
                    {(!c.tags || c.tags.length === 0) && <span className="text-xs text-muted">No tags</span>}
                  </div>

                  <div className="flex items-center justify-between">
                    <Link href={`/backoffice/courses/${c.id}`} className="text-sm font-medium text-primary">
                      Edit
                    </Link>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary"
                        onClick={() => onShare(c.id)}
                      >
                        <Share2 className="h-4 w-4" />
                        {shareId === c.id ? "Copied" : "Share"}
                      </button>
                      <Link href={`/courses/${c.id}`} className="text-sm font-medium text-primary">
                        Preview
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={createOpen}
        onOpenChange={(v) => {
          if (createBusy) return;
          setCreateOpen(v);
          if (!v) {
            setTitle("");
            setError(null);
          }
        }}
        title="Create course"
        description="Enter a course name. Other details can be added later."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" disabled={createBusy} onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={createBusy} onClick={onCreate}>
              {createBusy ? "Creating..." : "Create"}
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          <Label htmlFor="courseTitle">Course name</Label>
          <Input
            id="courseTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Sales CRM Fundamentals"
          />
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
      </Modal>

      <button
        type="button"
        className="fixed bottom-6 left-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:opacity-95"
        onClick={() => setCreateOpen(true)}
        aria-label="Create course"
        title="Create course"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}

"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}m`;
  if (m <= 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function BackofficeCoursesClient(props: { courses: BackofficeCourseListItem[]; initialQuery: string }) {
  const router = useRouter();
  const [query, setQuery] = React.useState(props.initialQuery);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createBusy, setCreateBusy] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    const href = q ? `/backoffice/courses?q=${encodeURIComponent(q)}` : "/backoffice/courses";
    router.push(href);
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
          <p className="text-sm text-muted">List view backed by SQLite (Prisma). Kanban comes next.</p>
        </div>

        <div className="flex items-center gap-2">
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
            router.push("/backoffice/courses");
          }}
        >
          Clear
        </Button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {props.courses.map((c) => {
          const thumb = c.thumbnailUrl || c.coverUrl || c.bannerUrl;
          return (
            <Card key={c.id} className="overflow-hidden">
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
                      {c.published ? "Published" : "Draft"} • {c.lessonCount} lessons • {formatDuration(c.durationMinutes)}
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
                  <Link href={`/courses/${c.id}`} className="text-sm font-medium text-primary">
                    Preview
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
    </div>
  );
}

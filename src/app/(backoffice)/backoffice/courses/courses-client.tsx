"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { LayoutGrid, List, Share2, Plus, MoreVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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

function CourseActionsMenu(props: {
  open: boolean;
  anchorEl: HTMLButtonElement | null;
  courseId: string;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [mounted, setMounted] = React.useState(false);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const computePos = React.useCallback(() => {
    if (!props.anchorEl) return;
    const rect = props.anchorEl.getBoundingClientRect();
    const menuWidth = 170;
    const viewportW = typeof window !== "undefined" ? window.innerWidth : 1024;

    const left = Math.max(8, Math.min(viewportW - menuWidth - 8, rect.left));
    const top = rect.bottom + 6;
    setPos({ top, left });
  }, [props.anchorEl]);

  React.useEffect(() => {
    if (!props.open) return;
    computePos();
    const onScroll = () => computePos();
    const onResize = () => computePos();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [props.open, computePos]);

  React.useEffect(() => {
    if (!props.open) return;
    const onDocClick = () => props.onClose();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [props.open, props.onClose]);

  if (!mounted || !props.open || !pos) return null;

  return createPortal(
    <div
      className="fixed z-[9999] w-[170px] rounded-[12px] border border-border bg-background p-1 shadow-sm"
      style={{ top: pos.top, left: pos.left }}
      onClick={(e) => e.stopPropagation()}
      role="menu"
      aria-label="Course actions"
    >
      <Link
        href={`/backoffice/courses/${props.courseId}`}
        className="block rounded-[10px] px-3 py-2 text-sm hover:bg-accent"
        onClick={props.onClose}
        role="menuitem"
      >
        Edit
      </Link>
      <button
        type="button"
        className="block w-full rounded-[10px] px-3 py-2 text-left text-sm text-red-700 hover:bg-accent"
        onClick={() => {
          props.onClose();
          props.onDelete();
        }}
        role="menuitem"
      >
        Delete
      </button>
    </div>,
    document.body,
  );
}

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

function isStockCourseImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  // Seeded/demo covers live here; we want gradients instead of the stock image.
  return url.includes("/images/courses/") || url.includes("\\images\\courses\\");
}

const COURSE_GRADIENTS: Array<[string, string]> = [
  ["#fb7185", "#f97316"],
  ["#f97316", "#facc15"],
  ["#22c55e", "#06b6d4"],
  ["#06b6d4", "#3b82f6"],
  ["#3b82f6", "#8b5cf6"],
  ["#8b5cf6", "#ec4899"],
  ["#10b981", "#84cc16"],
  ["#ef4444", "#f59e0b"],
];

function hashToIndex(value: string, mod: number): number {
  // Small deterministic hash (FNV-1a-ish) for stable gradients per course.
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % mod;
}

function courseGradientStyle(courseId: string): React.CSSProperties {
  const idx = hashToIndex(courseId, COURSE_GRADIENTS.length);
  const [a, b] = COURSE_GRADIENTS[idx];
  return {
    backgroundImage: `linear-gradient(135deg, ${a}, ${b})`,
  };
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
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [shareId, setShareId] = React.useState<string | null>(null);
  const [openMenuCourseId, setOpenMenuCourseId] = React.useState<string | null>(null);
  const [deleteCourseId, setDeleteCourseId] = React.useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);
  const menuButtonRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredCourses = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return props.courses;
    return props.courses.filter((c) => c.title.toLowerCase().includes(q));
  }, [props.courses, query]);

  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.replace(buildBackofficeCoursesHref({ q: query, view }));
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, view, router]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.replace(buildBackofficeCoursesHref({ q: query, view }));
  };

  const setViewAndUrl = (nextView: DashboardView) => {
    setView(nextView);
    router.replace(buildBackofficeCoursesHref({ q: query, view: nextView }));
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
      setCreateError("Course name is required.");
      return;
    }

    setCreateBusy(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/backoffice/courses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: safeTitle }),
      });

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok || typeof data.courseId !== "string") {
        setCreateError(typeof data?.error === "string" ? data.error : "Failed to create course.");
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

  const onDeleteCourse = async (courseId: string) => {
    setDeleteBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/backoffice/courses/${encodeURIComponent(courseId)}`, {
        method: "DELETE",
      });

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok) {
        setActionError(typeof data?.error === "string" ? data.error : "Failed to delete course.");
        return;
      }

      router.refresh();
    } finally {
      setDeleteBusy(false);
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
            router.replace(buildBackofficeCoursesHref({ q: "", view }));
          }}
        >
          Clear
        </Button>
      </form>

      {actionError && (
        <div className="rounded-[12px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {view === "kanban" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <KanbanColumn
            title="Draft"
            count={filteredCourses.filter((c) => !c.published).length}
          >
            {filteredCourses
              .filter((c) => !c.published)
              .map((c) => (
                <Card key={c.id} className="relative overflow-hidden">
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
                      <div className="relative">
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-border bg-background hover:bg-accent"
                          aria-label="Course actions"
                          ref={(el) => {
                            menuButtonRefs.current[c.id] = el;
                          }}
                          onClick={() => setOpenMenuCourseId((v) => (v === c.id ? null : c.id))}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
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
            count={filteredCourses.filter((c) => c.published).length}
          >
            {filteredCourses
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
                      <div className="relative">
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-border bg-background hover:bg-accent"
                          aria-label="Course actions"
                          ref={(el) => {
                            menuButtonRefs.current[c.id] = el;
                          }}
                          onClick={() => setOpenMenuCourseId((v) => (v === c.id ? null : c.id))}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
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
          {filteredCourses.map((c) => {
            const thumb = c.thumbnailUrl || c.coverUrl || c.bannerUrl;
            const cover = thumb && !isStockCourseImageUrl(thumb) ? thumb : null;
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
                <div className="relative h-28 w-full overflow-hidden bg-accent">
                  {cover ? (
                    <Image src={cover} alt="Course image" fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full" style={courseGradientStyle(c.id)}>
                      <div className="h-full w-full bg-black/10" />
                    </div>
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
                    <div className="relative">
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-border bg-background hover:bg-accent"
                        aria-label="Course actions"
                        ref={(el) => {
                          menuButtonRefs.current[c.id] = el;
                        }}
                        onClick={() => setOpenMenuCourseId((v) => (v === c.id ? null : c.id))}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>

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
            setCreateError(null);
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
          {createError && <div className="text-sm text-red-600">{createError}</div>}
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteCourseId !== null}
        onOpenChange={(v) => {
          if (!v) setDeleteCourseId(null);
        }}
        title="Delete course?"
        description="This will permanently delete the course and all its contents."
        confirmText={deleteBusy ? "Deleting..." : "Delete"}
        danger
        onConfirm={async () => {
          if (!deleteCourseId || deleteBusy) return;
          const id = deleteCourseId;
          setDeleteCourseId(null);
          await onDeleteCourse(id);
        }}
      />

      <CourseActionsMenu
        open={openMenuCourseId !== null}
        anchorEl={openMenuCourseId ? menuButtonRefs.current[openMenuCourseId] ?? null : null}
        courseId={openMenuCourseId ?? ""}
        onClose={() => setOpenMenuCourseId(null)}
        onDelete={() => {
          if (!openMenuCourseId) return;
          setDeleteCourseId(openMenuCourseId);
        }}
      />

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

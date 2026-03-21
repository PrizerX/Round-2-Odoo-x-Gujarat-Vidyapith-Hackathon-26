"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/domain/course-logic";

export type LearnerCatalogCourseCard = {
  id: string;
  title: string;
  tags: string[];
  views: number;
  lessonCount: number;
  durationMinutes: number;
  accessRule: "open" | "invitation" | "payment";
  visibility: "everyone" | "signed_in";
  priceInr?: number;
  enrolled: boolean;
  completionPercent: number | null;
  cta: { label: string; href: string; disabled?: boolean };
};

function buildLearnerCoursesHref(q: string): string {
  const query = q.trim();
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  const qs = params.toString();
  return qs ? `/courses?${qs}` : "/courses";
}

export function LearnerCoursesClient(props: { courses: LearnerCatalogCourseCard[]; initialQuery: string }) {
  const router = useRouter();
  const [query, setQuery] = React.useState(props.initialQuery);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [joinPopupOpen, setJoinPopupOpen] = React.useState(false);
  const [joinedCourseId, setJoinedCourseId] = React.useState<string | null>(null);
  const [joinBusyCourseId, setJoinBusyCourseId] = React.useState<string | null>(null);
  const [joinError, setJoinError] = React.useState<string | null>(null);
  const [tickDrawn, setTickDrawn] = React.useState(false);
  const [confettiOn, setConfettiOn] = React.useState(false);

  const confettiPieces = React.useMemo(() => {
    const colors = ["#22c55e", "#f97316", "#3b82f6", "#eab308", "#a855f7", "#ef4444"]; // green/orange/blue/yellow/purple/red
    return Array.from({ length: 18 }).map((_, i) => {
      const leftPct = Math.floor(Math.random() * 90) + 5;
      const size = Math.floor(Math.random() * 6) + 6;
      const rotate = Math.floor(Math.random() * 360);
      const delayMs = Math.floor(Math.random() * 150);
      const durationMs = 700 + Math.floor(Math.random() * 450);
      return {
        key: `c_${i}_${leftPct}_${size}_${rotate}`,
        leftPct,
        size,
        rotate,
        delayMs,
        durationMs,
        color: colors[i % colors.length]!,
      };
    });
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return props.courses;
    return props.courses.filter((c) => {
      if (c.title.toLowerCase().includes(q)) return true;
      if ((c.tags ?? []).some((t) => t.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [props.courses, query]);

  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.replace(buildLearnerCoursesHref(query));
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, router]);

  React.useEffect(() => {
    if (!joinPopupOpen) {
      setTickDrawn(false);
      setConfettiOn(false);
      return;
    }

    const raf = requestAnimationFrame(() => {
      setTickDrawn(true);
      setConfettiOn(true);
    });

    return () => cancelAnimationFrame(raf);
  }, [joinPopupOpen]);

  async function handleJoin(courseId: string) {
    if (joinBusyCourseId) return;
    setJoinError(null);
    setJoinBusyCourseId(courseId);
    try {
      const res = await fetch("/api/courses/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      if (res.status === 401) {
        const data = (await res.json().catch(() => null)) as { redirect?: string } | null;
        router.push(data?.redirect || "/auth/sign-in?next=/courses");
        return;
      }

      if (!res.ok) {
        throw new Error(`Join failed (${res.status})`);
      }

      setJoinedCourseId(courseId);
      setJoinPopupOpen(true);
      router.refresh();
    } catch {
      setJoinError("Could not join this course right now. Please try again.");
    } finally {
      setJoinBusyCourseId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Courses</h1>
          <p className="text-sm text-muted">Browse published courses. Buttons change based on your state.</p>
          {joinError && <p className="mt-2 text-sm text-red-600">{joinError}</p>}
        </div>

        <div className="w-full sm:max-w-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses"
              className="pr-9"
            />
          </div>
          {query.trim() && (
            <div className="mt-2 flex items-center justify-between text-xs text-muted">
              <span>Showing {filtered.length} result(s)</span>
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => {
                  setQuery("");
                  router.replace("/courses");
                }}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((course) => (
          <Card key={course.id} className="relative flex flex-col overflow-hidden">
            {course.enrolled && (
              <div
                className="pointer-events-none absolute right-0 top-0 z-10 translate-x-8 translate-y-5 rotate-45 bg-emerald-600 px-10 py-1 text-xs font-extrabold text-white shadow"
                aria-label="Enrolled"
              >
                Enrolled
              </div>
            )}

            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>
                    {course.lessonCount} lessons • {formatDuration(course.durationMinutes)}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {course.accessRule === "payment" && (
                    <>
                      <Badge>Paid</Badge>
                      {typeof course.priceInr === "number" && (
                        <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-900">
                          ₹{course.priceInr}
                        </div>
                      )}
                    </>
                  )}
                  {course.accessRule === "invitation" && <Badge>Invitation</Badge>}
                </div>
              </div>
            </CardHeader>

            <CardContent className="mt-auto space-y-4">
              <div className="flex flex-wrap gap-2">
                {(course.tags ?? []).map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-muted">
                  {(course.views ?? 0).toLocaleString()} views
                  {course.completionPercent !== null && (
                    <span className={cn("ml-2 font-medium", course.completionPercent >= 100 ? "text-emerald-700" : "text-emerald-700")}>
                      • {course.completionPercent}%
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {course.cta.label === "Join" && course.cta.href.startsWith("/api/courses/join") ? (
                    <Button
                      size="sm"
                      disabled={course.cta.disabled || joinBusyCourseId === course.id}
                      onClick={() => handleJoin(course.id)}
                    >
                      {joinBusyCourseId === course.id ? "Joining…" : course.cta.label}
                    </Button>
                  ) : (
                    <Link href={course.cta.href} aria-disabled={course.cta.disabled}>
                      <Button size="sm" disabled={course.cta.disabled}>
                        {course.cta.label}
                      </Button>
                    </Link>
                  )}
                  <Link href={`/courses/${course.id}`} className="text-sm font-medium text-primary">
                    Details
                  </Link>
                </div>
              </div>

              {course.visibility === "signed_in" && (
                <div className="text-xs text-muted">Signed-in only</div>
              )}
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-[12px] border border-border bg-accent p-4 text-sm text-muted sm:col-span-2 lg:col-span-3">
            No courses match your search.
          </div>
        )}
      </div>

      <Modal open={joinPopupOpen} onOpenChange={setJoinPopupOpen} className="max-w-lg">
        <div className="relative">
          <button
            type="button"
            aria-label="Close"
            className="absolute right-1 top-1 rounded-[10px] p-2 text-muted hover:bg-accent"
            onClick={() => setJoinPopupOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>

          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-[12px] border border-border bg-accent px-5 py-8">
              <div className="pointer-events-none absolute inset-0">
                {confettiPieces.map((p) => (
                  <span
                    key={p.key}
                    className="absolute top-2 block rounded-sm"
                    style={{
                      left: `${p.leftPct}%`,
                      width: `${p.size}px`,
                      height: `${Math.max(4, Math.floor(p.size * 0.6))}px`,
                      backgroundColor: p.color,
                      opacity: confettiOn ? 0 : 1,
                      transform: confettiOn
                        ? `translateY(160px) rotate(${p.rotate + 240}deg)`
                        : `translateY(0px) rotate(${p.rotate}deg)`,
                      transitionProperty: "transform, opacity",
                      transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
                      transitionDelay: `${p.delayMs}ms`,
                      transitionDuration: `${p.durationMs}ms`,
                    }}
                  />
                ))}
              </div>

              <div className="relative mx-auto flex w-full max-w-sm flex-col items-center text-center">
                <div
                  className={cn(
                    "flex h-24 w-24 items-center justify-center rounded-full border border-emerald-200 bg-white shadow-sm transition-transform duration-500",
                    tickDrawn ? "scale-100" : "scale-90",
                  )}
                >
                  <svg viewBox="0 0 52 52" className="h-14 w-14" aria-hidden="true">
                    <path
                      d="M14 27 L22 35 L38 18"
                      fill="none"
                      stroke="#16a34a"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        strokeDasharray: 80,
                        strokeDashoffset: tickDrawn ? 0 : 80,
                        transition: "stroke-dashoffset 700ms ease",
                      }}
                    />
                  </svg>
                </div>

                <h2 className="mt-4 text-lg font-semibold">Joined successfully</h2>
                <p className="mt-1 text-sm text-muted">
                  You can view the course now, or jump to My Courses.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setJoinPopupOpen(false);
                  router.push("/my-courses");
                }}
              >
                My Courses
              </Button>
              <Button
                onClick={() => {
                  if (!joinedCourseId) return;
                  setJoinPopupOpen(false);
                  router.push(`/courses/${joinedCourseId}`);
                }}
              >
                View Course
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { Search, Star, X, RotateCcw, CreditCard, Wallet, Smartphone, ShieldCheck, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";

export type CourseDetailsContentItem = {
  id: string;
  title: string;
  href: string;
  visited: boolean;
  completed: boolean;
  locked: boolean;
  unitId?: string | null;
  unitTitle?: string | null;
  unitSortOrder?: number | null;
};

type Viewer = {
  id: string;
  name: string;
};

type CourseReview = {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  rating: number; // 1..5
  text: string;
  createdAt: number; // epoch ms
};

const REVIEWS_STORAGE_PREFIX = "learnova_reviews_";

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
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % mod;
}

function courseGradientStyle(courseId: string): React.CSSProperties {
  const idx = hashToIndex(courseId, COURSE_GRADIENTS.length);
  const [a, b] = COURSE_GRADIENTS[idx]!;
  return { backgroundImage: `linear-gradient(135deg, ${a}, ${b})` };
}

function isStockCourseImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes("/images/courses/") || url.includes("\\images\\courses\\");
}

function clampRating(v: number): number {
  if (!Number.isFinite(v)) return 5;
  return Math.max(1, Math.min(5, Math.round(v)));
}

function seedReviews(courseId: string): CourseReview[] {
  const base: CourseReview[] = [
    {
      id: `seed_${courseId}_1`,
      courseId,
      userId: "u_demo_2",
      userName: "Name of User 2",
      rating: 5,
      text: "Clean structure and very practical examples. The pace felt just right.",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    },
    {
      id: `seed_${courseId}_2`,
      courseId,
      userId: "u_demo_3",
      userName: "Name of User 3",
      rating: 4,
      text: "Great overview. Would love a couple more real-world scenarios, but overall solid.",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    },
  ];

  // Slightly personalize CRM courses.
  if (courseId.includes("crm") || courseId === "course_4") {
    return [
      {
        id: `seed_${courseId}_1`,
        courseId,
        userId: "u_demo_2",
        userName: "Name of User 2",
        rating: 5,
        text: "The pipeline + follow-up flow made sense immediately. Super helpful for Odoo CRM.",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
      },
      {
        id: `seed_${courseId}_2`,
        courseId,
        userId: "u_demo_3",
        userName: "Name of User 3",
        rating: 4,
        text: "Good explanations. The quiz at the end was a nice recap.",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
      },
    ];
  }

  return base;
}

function readStoredReviews(courseId: string): CourseReview[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(`${REVIEWS_STORAGE_PREFIX}${courseId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((r) => typeof r === "object" && r)
      .map((r) => r as Partial<CourseReview>)
      .filter((r) => r.courseId === courseId)
      .filter((r) => typeof r.userId === "string" && typeof r.userName === "string")
      .filter((r) => typeof r.text === "string")
      .map((r) => ({
        id: typeof r.id === "string" ? r.id : `stored_${courseId}_${r.userId}`,
        courseId,
        userId: r.userId as string,
        userName: r.userName as string,
        rating: clampRating(typeof r.rating === "number" ? r.rating : 5),
        text: (r.text as string).slice(0, 1000),
        createdAt: typeof r.createdAt === "number" ? r.createdAt : Date.now(),
      }));
  } catch {
    return [];
  }
}

function writeStoredReviews(courseId: string, reviews: CourseReview[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${REVIEWS_STORAGE_PREFIX}${courseId}`,
      JSON.stringify(reviews),
    );
  } catch {
    // ignore (private mode / quota)
  }
}

function computeAverageRating(reviews: CourseReview[]): number {
  if (!reviews.length) return 0;
  const sum = reviews.reduce((acc, r) => acc + clampRating(r.rating), 0);
  return Math.max(0, Math.min(5, sum / reviews.length));
}

function formatRatingNumber(v: number): string {
  if (!Number.isFinite(v)) return "0";
  const s = v.toFixed(1);
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}

function StarsDisplay(props: { value: number; className?: string }) {
  const safe = Math.max(0, Math.min(5, props.value));
  return (
    <div
      className={cn("inline-flex items-center gap-1", props.className)}
      aria-label={`${formatRatingNumber(safe)} out of 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const start = i;
        const frac = Math.max(0, Math.min(1, safe - start));
        const width = `${Math.round(frac * 100)}%`;
        return (
          <span key={i} className="relative inline-block h-5 w-5 align-middle">
            {/* Base: hollow stroke */}
            <Star className="h-5 w-5 text-muted" fill="none" />
            {/* Fill: clipped, no stroke so outlines stay aligned */}
            <span className="absolute inset-0 overflow-hidden" style={{ width }} aria-hidden="true">
              <Star
                className="h-5 w-5 text-amber-500"
                stroke="transparent"
                fill="currentColor"
              />
            </span>
          </span>
        );
      })}
    </div>
  );
}

function StarsPicker(props: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const v = i + 1;
        const active = v <= props.value;
        return (
          <button
            key={v}
            type="button"
            onClick={() => props.onChange(v)}
            className={cn(
              "rounded p-1 transition-colors",
              active ? "text-amber-500" : "text-muted hover:text-amber-500",
            )}
            aria-label={`Rate ${v} star${v === 1 ? "" : "s"}`}
          >
            <Star className={cn("h-5 w-5", active && "fill-current")} />
          </button>
        );
      })}
    </div>
  );
}

export function CourseDetailsClient(props: {
  courseId: string;
  title: string;
  description?: string;
  tags: string[];
  coverImageUrl?: string;
  bannerImageUrl?: string;
  thumbnailImageUrl?: string;
  lessonCount: number;
  completionPercent: number;
  completedCount: number;
  incompleteCount: number;
  cta: { label: string; href: string; disabled?: boolean };
  accessBadges: Array<"Paid" | "Invitation" | "Signed-in only">;
  priceInr?: number;
  content: CourseDetailsContentItem[];
  viewer?: Viewer | null;
}) {
  const router = useRouter();
  const [tab, setTab] = React.useState<"overview" | "reviews">("overview");
  const [query, setQuery] = React.useState("");
  const [resetOpen, setResetOpen] = React.useState(false);
  const [resetBusy, setResetBusy] = React.useState(false);
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<"card" | "upi" | "wallet">("card");
  const [payBusy, setPayBusy] = React.useState(false);

  const [reviews, setReviews] = React.useState<CourseReview[]>(() => seedReviews(props.courseId));
  const [reviewModalOpen, setReviewModalOpen] = React.useState(false);
  const [draftRating, setDraftRating] = React.useState(5);
  const [draftText, setDraftText] = React.useState("");

  React.useEffect(() => {
    let active = true;

    // L3 primary: DB-backed reviews (public read).
    fetch(`/api/reviews?courseId=${encodeURIComponent(props.courseId)}`)
      .then(async (res) => {
        if (!res.ok) return null;
        const data = (await res.json()) as unknown;
        if (typeof data !== "object" || !data) return null;
        const reviews = (data as { reviews?: unknown }).reviews;
        if (!Array.isArray(reviews)) return null;
        return reviews
          .filter((r) => typeof r === "object" && r)
          .map((r) => r as Partial<CourseReview>)
          .filter((r) => r.courseId === props.courseId)
          .filter((r) => typeof r.userId === "string" && typeof r.userName === "string")
          .filter((r) => typeof r.text === "string")
          .map((r) => ({
            id: typeof r.id === "string" ? r.id : `db_${props.courseId}_${r.userId}`,
            courseId: props.courseId,
            userId: r.userId as string,
            userName: r.userName as string,
            rating: clampRating(typeof r.rating === "number" ? r.rating : 5),
            text: (r.text as string).slice(0, 1000),
            createdAt: typeof r.createdAt === "number" ? r.createdAt : Date.now(),
          }))
          .sort((a, b) => b.createdAt - a.createdAt);
      })
      .then((dbReviews) => {
        if (!active) return;

        if (dbReviews && dbReviews.length) {
          setReviews(dbReviews);
          return;
        }

        // Fallback: seed + localStorage (MVP).
        const stored = readStoredReviews(props.courseId);
        if (stored.length) {
          const byUser = new Map<string, CourseReview>();
          for (const r of seedReviews(props.courseId)) byUser.set(r.userId, r);
          for (const r of stored) byUser.set(r.userId, r);
          const merged = Array.from(byUser.values()).sort((a, b) => b.createdAt - a.createdAt);
          setReviews(merged);
        } else {
          setReviews(seedReviews(props.courseId));
        }
      })
      .catch(() => {
        if (!active) return;
        const stored = readStoredReviews(props.courseId);
        if (stored.length) {
          const byUser = new Map<string, CourseReview>();
          for (const r of seedReviews(props.courseId)) byUser.set(r.userId, r);
          for (const r of stored) byUser.set(r.userId, r);
          const merged = Array.from(byUser.values()).sort((a, b) => b.createdAt - a.createdAt);
          setReviews(merged);
        } else {
          setReviews(seedReviews(props.courseId));
        }
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.courseId]);

  const viewerReview = React.useMemo(() => {
    const viewer = props.viewer;
    if (!viewer) return null;
    return reviews.find((r) => r.userId === viewer.id) ?? null;
  }, [props.viewer, reviews]);

  const avgRating = React.useMemo(() => computeAverageRating(reviews), [reviews]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return props.content;
    return props.content.filter((c) => c.title.toLowerCase().includes(q));
  }, [query, props.content]);

  const grouped = React.useMemo(() => {
    const q = query.trim();
    if (q) return null;

    const byUnit = new Map<
      string,
      { id: string; title: string; sortOrder: number | null; items: CourseDetailsContentItem[] }
    >();
    const unassigned: CourseDetailsContentItem[] = [];

    for (const item of props.content) {
      const unitId = typeof item.unitId === "string" && item.unitId ? item.unitId : null;
      const unitTitle = typeof item.unitTitle === "string" && item.unitTitle ? item.unitTitle : null;
      if (!unitId || !unitTitle) {
        unassigned.push(item);
        continue;
      }

      const existing = byUnit.get(unitId);
      if (existing) {
        existing.items.push(item);
        continue;
      }
      byUnit.set(unitId, {
        id: unitId,
        title: unitTitle,
        sortOrder: typeof item.unitSortOrder === "number" ? item.unitSortOrder : null,
        items: [item],
      });
    }

    const units = Array.from(byUnit.values()).sort((a, b) => {
      const ao = a.sortOrder ?? 1e9;
      const bo = b.sortOrder ?? 1e9;
      if (ao !== bo) return ao - bo;
      return a.title.localeCompare(b.title);
    });

    return { units, unassigned };
  }, [props.content, query]);

  const rawBannerSrc = props.bannerImageUrl ?? props.coverImageUrl;
  const bannerSrc = rawBannerSrc && !isStockCourseImageUrl(rawBannerSrc) ? rawBannerSrc : null;
  const isPaidCta = props.cta.label === "Buy";
  const priceLabel = typeof props.priceInr === "number" ? `₹${props.priceInr}` : "₹0";

  return (
    <div className="space-y-5">
      <div className="text-xs text-muted">
        <Link href="/courses" className="hover:underline">
          Courses
        </Link>
        <span className="px-2">/</span>
        <span className="text-foreground">{props.courseId}</span>
      </div>

      <Card className="overflow-hidden">
        <div className="relative h-40 w-full border-b border-border bg-accent sm:h-44">
          {bannerSrc ? (
            <Image
              src={bannerSrc}
              alt={`${props.title} banner`}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="h-full w-full" style={courseGradientStyle(props.courseId)}>
              <div className="h-full w-full bg-black/10" />
            </div>
          )}
        </div>

        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="flex gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[12px] border border-border bg-accent sm:h-28 sm:w-28">
                {props.thumbnailImageUrl && !isStockCourseImageUrl(props.thumbnailImageUrl) ? (
                  <Image
                    src={props.thumbnailImageUrl}
                    alt={`${props.title} thumbnail`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full" style={courseGradientStyle(props.courseId)}>
                    <div className="h-full w-full bg-black/10" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold text-foreground">
                  Course
                </div>
                <h1 className="mt-2 line-clamp-2 text-lg font-semibold text-primary sm:text-xl">
                  {props.title}
                </h1>
                <div className="mt-1 line-clamp-2 text-sm text-muted">
                  {props.description ?? "Description..."}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {props.tags.map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {isPaidCta ? (
                    <Button
                      disabled={props.cta.disabled}
                      onClick={() => setPaymentOpen(true)}
                    >
                      Buy Course
                    </Button>
                  ) : (
                    <Link href={props.cta.href} aria-disabled={props.cta.disabled}>
                      <Button disabled={props.cta.disabled}>
                        {props.cta.label}
                      </Button>
                    </Link>
                  )}
                  {props.cta.label !== "Join" && props.cta.label !== "Buy" && props.cta.label !== "Invitation Only" && (
                    <Link
                      href={`/learn/${props.courseId}/lesson_1`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Open Player
                    </Link>
                  )}

                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    {props.accessBadges.map((b) => (
                      <Badge key={b}>{b}</Badge>
                    ))}
                    {typeof props.priceInr === "number" && (
                      <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-900">
                        ₹{props.priceInr}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[12px] border border-border bg-surface p-4">
              <div className="text-sm font-semibold">
                <span className="font-semibold text-emerald-700">{props.completionPercent}%</span> Completed
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-accent">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${Math.max(0, Math.min(100, props.completionPercent))}%` }}
                />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-[12px] border border-border bg-accent p-3 text-center">
                  <div className="text-xl font-semibold text-foreground">{props.lessonCount}</div>
                  <div className="mt-1 text-xs text-muted">Content</div>
                </div>
                <div className="rounded-[12px] border border-border bg-accent p-3 text-center">
                  <div className="text-xl font-semibold text-foreground">{props.completedCount}</div>
                  <div className="mt-1 text-xs text-muted">Completed</div>
                </div>
                <div className="rounded-[12px] border border-border bg-accent p-3 text-center">
                  <div className="text-xl font-semibold text-foreground">{props.incompleteCount}</div>
                  <div className="mt-1 text-xs text-muted">Incomplete</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <button
                type="button"
                onClick={() => setTab("overview")}
                className={cn(
                  "rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors",
                  tab === "overview" ? "bg-primary text-white" : "bg-surface hover:bg-accent",
                )}
              >
                Course Overview
              </button>
              <button
                type="button"
                onClick={() => setTab("reviews")}
                className={cn(
                  "rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors",
                  tab === "reviews" ? "bg-primary text-white" : "bg-surface hover:bg-accent",
                )}
              >
                Ratings and Reviews
              </button>
            </div>

            {tab === "overview" && (
              <div className="w-full sm:max-w-xs">
                <div className="relative">
                  <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search content"
                    className="pr-9"
                  />
                </div>
              </div>
            )}
          </div>

          {tab === "overview" ? (
            <div className="space-y-3">
              <div className="text-sm text-muted">{props.lessonCount} Contents</div>
              <div className="border-t border-border" />

              <div className="space-y-2">
                {(grouped
                  ? [
                      ...grouped.units.flatMap((u) => [
                        { kind: "unit" as const, id: u.id, title: u.title },
                        ...u.items.map((it) => ({ kind: "lesson" as const, item: it })),
                      ]),
                      ...(grouped.unassigned.length
                        ? [
                            { kind: "unit" as const, id: "__unassigned", title: "Unassigned" },
                            ...grouped.unassigned.map((it) => ({ kind: "lesson" as const, item: it })),
                          ]
                        : []),
                    ]
                  : filtered.map((it) => ({ kind: "lesson" as const, item: it }))
                ).map((row, idx) => {
                  if (row.kind === "unit") {
                    return (
                      <div
                        key={`unit_${row.id}_${idx}`}
                        className="px-1 pt-3 text-xs font-semibold text-muted"
                      >
                        {row.title}
                      </div>
                    );
                  }

                  const item = row.item;
                  const state: "completed" | "visited" | "unvisited" = item.completed
                    ? "completed"
                    : item.visited
                      ? "visited"
                      : "unvisited";

                  const statusClass =
                    state === "completed"
                      ? "border-emerald-600 bg-emerald-50"
                      : state === "visited"
                        ? "border-orange-500 bg-orange-50"
                        : "border-muted bg-white";
                  const dotClass =
                    state === "completed"
                      ? "bg-emerald-600"
                      : state === "visited"
                        ? "bg-orange-500"
                        : "";

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-[12px] border border-border bg-surface px-3 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="text-lg font-semibold text-muted">#</div>
                        {item.locked ? (
                          <div className="min-w-0">
                            <div className="flex min-w-0 items-center gap-2">
                              <Lock className="h-4 w-4 shrink-0 text-muted" />
                              <span
                                className="min-w-0 truncate text-sm font-medium text-muted"
                                title="Locked — complete previous content"
                                aria-disabled="true"
                              >
                                {item.title}
                              </span>
                            </div>
                            <div className="mt-0.5 text-xs text-muted">Locked — complete previous content</div>
                          </div>
                        ) : (
                          <Link
                            href={item.href}
                            className="min-w-0 truncate text-sm font-medium text-primary hover:underline"
                            title={item.title}
                          >
                            {item.title}
                          </Link>
                        )}
                      </div>

                      <div
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border",
                          statusClass,
                        )}
                        aria-label={
                          item.completed
                            ? "Completed"
                            : item.visited
                              ? "Visited"
                              : "Unvisited"
                        }
                        title={
                          item.completed
                            ? "Completed"
                            : item.visited
                              ? "Visited (not complete)"
                              : "Unvisited"
                        }
                      >
                        {dotClass ? <div className={cn("h-2.5 w-2.5 rounded-full", dotClass)} /> : null}
                      </div>
                    </div>
                  );
                })}

                {filtered.length === 0 && (
                  <div className="rounded-[12px] border border-border bg-accent p-4 text-sm text-muted">
                    No content matches your search.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-end gap-4">
                  <div className="text-4xl font-semibold text-foreground">
                    {avgRating ? formatRatingNumber(avgRating) : "0"}
                  </div>
                  <div className="space-y-1">
                    <StarsDisplay value={avgRating || 0} />
                    <div className="text-xs text-muted">
                      {reviews.length} review{reviews.length === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>

                {props.viewer ? (
                  <Button size="sm" onClick={() => {
                    setDraftRating(viewerReview?.rating ?? 5);
                    setDraftText(viewerReview?.text ?? "");
                    setReviewModalOpen(true);
                  }}>
                    {viewerReview ? "Edit Review" : "Add Review"}
                  </Button>
                ) : (
                  <Link href={`/auth/sign-in?next=${encodeURIComponent(`/courses/${props.courseId}`)}`}>
                    <Button size="sm">Sign in to review</Button>
                  </Link>
                )}
              </div>

              <div className="border-t border-border" />

              <div className="space-y-4">
                {props.viewer && (
                  <div className="grid gap-2 border-b border-border pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full border border-border bg-accent" aria-hidden="true" />
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-foreground">{props.viewer.name}</div>
                        {viewerReview && (
                          <div className="inline-flex items-center gap-1 text-xs font-semibold text-muted">
                            <Star className="h-3.5 w-3.5" />
                            <span>{formatRatingNumber(viewerReview.rating)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="w-full rounded-[14px] border-2 border-amber-400/70 bg-surface px-4 py-3 text-left text-sm text-muted hover:bg-accent"
                      onClick={() => {
                        setDraftRating(viewerReview?.rating ?? 5);
                        setDraftText(viewerReview?.text ?? "");
                        setReviewModalOpen(true);
                      }}
                      aria-label={viewerReview ? "Edit your review" : "Write your review"}
                    >
                      {viewerReview?.text?.trim()
                        ? viewerReview.text
                        : "Write your review...."}
                    </button>
                  </div>
                )}

                {reviews
                  .filter((r) => r.userId !== (props.viewer?.id ?? ""))
                  .map((r) => (
                    <div key={r.id} className="grid gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full border border-border bg-accent" aria-hidden="true" />
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-foreground">{r.userName}</div>
                          <div className="inline-flex items-center gap-1 text-xs font-semibold text-muted">
                            <Star className="h-3.5 w-3.5" />
                            <span>{formatRatingNumber(r.rating)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-full rounded-[14px] border-2 border-amber-400/70 bg-surface px-4 py-3 text-sm text-foreground">
                        {r.text}
                      </div>
                    </div>
                  ))}

                {reviews.length === 0 && (
                  <div className="rounded-[12px] border border-border bg-accent p-4 text-sm text-muted">
                    No reviews yet.
                  </div>
                )}
              </div>

              <Modal
                open={reviewModalOpen}
                onOpenChange={(open) => setReviewModalOpen(open)}
                className="max-w-2xl"
              >
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(false)}
                    className="absolute right-0 top-0 rounded-full p-2 text-muted hover:bg-accent"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <div className="text-lg font-semibold text-foreground">
                    {viewerReview ? "Edit your review" : "Add a review"}
                  </div>
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">Rating</div>
                      <StarsPicker value={draftRating} onChange={setDraftRating} />
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">Review</div>
                      <textarea
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                        rows={5}
                        placeholder="Write your review..."
                        className="w-full rounded-[14px] border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted focus:ring-2 focus:ring-primary/20"
                      />
                      <div className="text-xs text-muted">Max 1000 characters.</div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <Button variant="secondary" onClick={() => setReviewModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={async () => {
                          const viewer = props.viewer;
                          if (!viewer) return;
                          const text = draftText.trim();
                          if (!text) return;

                          const fallbackNext: CourseReview = {
                            id: viewerReview?.id ?? `r_${props.courseId}_${viewer.id}`,
                            courseId: props.courseId,
                            userId: viewer.id,
                            userName: viewer.name,
                            rating: clampRating(draftRating),
                            text: text.slice(0, 1000),
                            createdAt: Date.now(),
                          };

                          try {
                            const res = await fetch("/api/reviews", {
                              method: "POST",
                              headers: { "content-type": "application/json" },
                              body: JSON.stringify({
                                courseId: props.courseId,
                                rating: clampRating(draftRating),
                                text: text.slice(0, 1000),
                              }),
                            });

                            if (res.ok) {
                              const data = (await res.json()) as unknown;
                              const review =
                                typeof data === "object" && data
                                  ? (data as { review?: unknown }).review
                                  : null;

                              if (review && typeof review === "object") {
                                const r = review as Partial<CourseReview>;
                                const next: CourseReview = {
                                  id: typeof r.id === "string" ? r.id : fallbackNext.id,
                                  courseId: props.courseId,
                                  userId: viewer.id,
                                  userName: viewer.name,
                                  rating: clampRating(typeof r.rating === "number" ? r.rating : fallbackNext.rating),
                                  text: typeof r.text === "string" ? r.text : fallbackNext.text,
                                  createdAt: typeof r.createdAt === "number" ? r.createdAt : Date.now(),
                                };

                                setReviews((prev) => {
                                  const withoutViewer = prev.filter((x) => x.userId !== viewer.id);
                                  const merged = [next, ...withoutViewer].sort(
                                    (a, b) => b.createdAt - a.createdAt,
                                  );
                                  // Keep local copy as offline fallback.
                                  writeStoredReviews(props.courseId, merged);
                                  return merged;
                                });
                                setReviewModalOpen(false);
                                return;
                              }
                            }

                            throw new Error("db_save_failed");
                          } catch {
                            setReviews((prev) => {
                              const withoutViewer = prev.filter((r) => r.userId !== viewer.id);
                              const merged = [fallbackNext, ...withoutViewer];
                              writeStoredReviews(props.courseId, merged);
                              return merged;
                            });
                            setReviewModalOpen(false);
                          }
                        }}
                        disabled={!draftText.trim()}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              </Modal>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={paymentOpen}
        onOpenChange={(open) => {
          if (payBusy) return;
          setPaymentOpen(open);
        }}
        className="max-w-4xl"
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => setPaymentOpen(false)}
            className="absolute right-0 top-0 rounded-full p-2 text-muted hover:bg-accent"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <div className="text-lg font-semibold text-foreground">Secure Checkout</div>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              256-bit encrypted
            </span>
          </div>
          <div className="mt-2 text-sm text-muted">
            Complete your payment to unlock this course instantly.
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-[12px] border px-3 py-3 text-sm font-semibold transition-colors",
                    paymentMethod === "card"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface text-foreground hover:bg-accent",
                  )}
                >
                  <CreditCard className="h-4 w-4" />
                  Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("upi")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-[12px] border px-3 py-3 text-sm font-semibold transition-colors",
                    paymentMethod === "upi"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface text-foreground hover:bg-accent",
                  )}
                >
                  <Smartphone className="h-4 w-4" />
                  UPI
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("wallet")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-[12px] border px-3 py-3 text-sm font-semibold transition-colors",
                    paymentMethod === "wallet"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface text-foreground hover:bg-accent",
                  )}
                >
                  <Wallet className="h-4 w-4" />
                  Wallets
                </button>
              </div>

              <div className="rounded-[12px] border border-border bg-surface p-4">
                {paymentMethod === "card" && (
                  <div className="space-y-4">
                    <div className="text-sm font-semibold text-foreground">Card details</div>
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-muted">Card number</div>
                      <Input placeholder="1234 5678 9012 3456" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-muted">Expiry</div>
                        <Input placeholder="MM / YY" />
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-muted">CVV</div>
                        <Input placeholder="123" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-muted">Name on card</div>
                      <Input placeholder="Full name" />
                    </div>
                  </div>
                )}

                {paymentMethod === "upi" && (
                  <div className="space-y-4">
                    <div className="text-sm font-semibold text-foreground">UPI ID</div>
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-muted">Enter your UPI</div>
                      <Input placeholder="name@bank" />
                      <div className="text-xs text-muted">
                        Approve the request in your UPI app to complete payment.
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "wallet" && (
                  <div className="space-y-4">
                    <div className="text-sm font-semibold text-foreground">Choose a wallet</div>
                    <div className="grid gap-2">
                      {[
                        "Paytm Wallet",
                        "PhonePe Wallet",
                        "Amazon Pay",
                      ].map((label) => (
                        <button
                          key={label}
                          type="button"
                          className="flex items-center justify-between rounded-[12px] border border-border bg-accent px-3 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent/70"
                        >
                          <span>{label}</span>
                          <span className="text-xs text-muted">Instant</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-[12px] border border-dashed border-border bg-accent px-4 py-3 text-xs text-muted">
                By continuing, you agree to Learnova Terms of Use and the cancellation policy.
              </div>
            </div>

            <div className="rounded-[12px] border border-border bg-accent p-4">
              <div className="text-sm font-semibold text-foreground">Order summary</div>
              <div className="mt-3 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Course</span>
                  <span className="font-semibold text-foreground">{priceLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Platform fee</span>
                  <span className="font-semibold text-foreground">₹0</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>{priceLabel}</span>
                  </div>
                </div>
              </div>

              <Button
                className="mt-4 w-full"
                disabled={payBusy}
                onClick={() => {
                  if (payBusy) return;
                  setPayBusy(true);
                  window.setTimeout(() => {
                    setPayBusy(false);
                    setPaymentOpen(false);
                  }, 900);
                }}
              >
                {payBusy ? "Processing..." : `Pay ${priceLabel}`}
              </Button>

              <div className="mt-3 text-xs text-muted">
                You will be redirected to a secure payment provider.
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <div className="text-xs text-muted">
        Image drop locations (later):
        <span className="ml-1">/public/images/covers</span>
        <span className="px-2">•</span>
        <span>/public/images/courses</span>
      </div>

      {/* Demo utility: reset completion + quiz attempt state for this course */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="secondary"
          size="sm"
          className="shadow-sm"
          onClick={() => setResetOpen(true)}
          aria-label="Reset course progress (demo)"
        >
          <RotateCcw className="h-4 w-4" />
          Reset progress
        </Button>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={(v) => {
          if (resetBusy) return;
          setResetOpen(v);
        }}
        title="Reset progress?"
        description="This will clear the demo completion and quiz score for this course so you can re-test scoring and sync."
        confirmText="Reset"
        cancelText="Cancel"
        danger
        busy={resetBusy}
        onConfirm={async () => {
          setResetBusy(true);
          try {
            await fetch("/api/learning/reset", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ courseId: props.courseId }),
            });

            if (typeof window !== "undefined") {
              try {
                const prefix = `learnova_quiz_attempt_${props.courseId}:`;
                for (let i = window.localStorage.length - 1; i >= 0; i -= 1) {
                  const k = window.localStorage.key(i);
                  if (k && k.startsWith(prefix)) window.localStorage.removeItem(k);
                }
              } catch {
                // ignore
              }
            }

            setResetOpen(false);
            router.replace(`/courses/${props.courseId}`);
            router.refresh();
          } finally {
            setResetBusy(false);
          }
        }}
      />
    </div>
  );
}

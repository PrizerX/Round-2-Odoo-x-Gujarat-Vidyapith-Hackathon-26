"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

export type CourseDetailsContentItem = {
  id: string;
  title: string;
  href: string;
  completed: boolean;
};

export function CourseDetailsClient(props: {
  courseId: string;
  title: string;
  description?: string;
  tags: string[];
  coverImageUrl?: string;
  thumbnailImageUrl?: string;
  lessonCount: number;
  completionPercent: number;
  completedCount: number;
  incompleteCount: number;
  cta: { label: string; href: string; disabled?: boolean };
  accessBadges: Array<"Paid" | "Invitation" | "Signed-in only">;
  priceInr?: number;
  content: CourseDetailsContentItem[];
}) {
  const [tab, setTab] = React.useState<"overview" | "reviews">("overview");
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return props.content;
    return props.content.filter((c) => c.title.toLowerCase().includes(q));
  }, [query, props.content]);

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
          {props.coverImageUrl ? (
            <Image
              src={props.coverImageUrl}
              alt={`${props.title} cover`}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted">
              Cover Image
            </div>
          )}
        </div>

        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="flex gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[12px] border border-border bg-accent sm:h-28 sm:w-28">
                {props.thumbnailImageUrl ? (
                  <Image
                    src={props.thumbnailImageUrl}
                    alt={`${props.title} thumbnail`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted">
                    Course Image
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
                  <Link href={props.cta.href} aria-disabled={props.cta.disabled}>
                    <Button disabled={props.cta.disabled}>
                      {props.cta.label === "Buy" ? "Buy Course" : props.cta.label}
                    </Button>
                  </Link>
                  <Link
                    href={`/learn/${props.courseId}/lesson_1`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Open Player
                  </Link>

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
          </div>

          {tab === "overview" ? (
            <div className="space-y-3">
              <div className="text-sm text-muted">{props.lessonCount} Contents</div>
              <div className="border-t border-border" />

              <div className="space-y-2">
                {filtered.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-[12px] border border-border bg-surface px-3 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="text-lg font-semibold text-muted">#</div>
                      <Link
                        href={item.href}
                        className="min-w-0 truncate text-sm font-medium text-primary hover:underline"
                        title={item.title}
                      >
                        {item.title}
                      </Link>
                    </div>

                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border",
                        item.completed
                          ? "border-emerald-600 bg-emerald-50"
                          : "border-muted bg-white",
                      )}
                      aria-label={item.completed ? "Completed" : "Incomplete"}
                      title={item.completed ? "Completed" : "Incomplete"}
                    >
                      {item.completed && <div className="h-2.5 w-2.5 rounded-full bg-emerald-600" />}
                    </div>
                  </div>
                ))}

                {filtered.length === 0 && (
                  <div className="rounded-[12px] border border-border bg-accent p-4 text-sm text-muted">
                    No content matches your search.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-[12px] border border-border bg-accent p-4 text-sm text-muted">
              Ratings and Reviews coming soon.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted">
        Image drop locations (later):
        <span className="ml-1">/public/images/covers</span>
        <span className="px-2">•</span>
        <span>/public/images/courses</span>
      </div>
    </div>
  );
}

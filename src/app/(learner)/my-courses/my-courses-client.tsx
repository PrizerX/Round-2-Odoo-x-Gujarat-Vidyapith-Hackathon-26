"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BADGE_LEVELS, type BadgeLevel } from "@/lib/domain/gamification";
import { cn } from "@/lib/cn";

export type MyCourseCard = {
  id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  tags: string[];
  completionPercent: number;
  cta: { label: string; href: string; disabled?: boolean };
  accessPill?: "Paid" | "Invitation";
  priceInr?: number;
};

function CircularProgress(props: {
  value: number;
  labelTop: string;
  labelBottom: string;
  size?: number;
}) {
  const size = props.size ?? 220;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const c = 2 * Math.PI * radius;
  const value = Math.max(0, Math.min(100, props.value));
  const dashOffset = c - (value / 100) * c;

  return (
    <div
      className="relative rounded-full border border-border bg-white"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="block">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="stroke-accent"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="stroke-emerald-500"
          fill="transparent"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      <div className="absolute inset-5 rounded-full bg-accent" />

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-sm font-medium text-foreground">{props.labelTop}</div>
        <div className="mt-2 text-2xl font-semibold text-emerald-600">{props.labelBottom}</div>
      </div>
    </div>
  );
}

export function MyCoursesClient(props: {
  courses: MyCourseCard[];
  points: number;
  badge: BadgeLevel;
  userName: string;
}) {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return props.courses;
    return props.courses.filter((c) => c.title.toLowerCase().includes(q));
  }, [query, props.courses]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-muted">My Courses</div>
          <h1 className="text-xl font-semibold">Welcome, {props.userName}</h1>
        </div>

        <div className="w-full sm:max-w-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search course"
              className="pr-9"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((course) => {
              const isPaid = course.accessPill === "Paid";
              const hasPrice = isPaid && typeof course.priceInr === "number";

              return (
                <Card key={course.id} className="relative overflow-hidden">
                  {isPaid && (
                    <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
                      <div className="rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-foreground shadow-sm">
                        Paid
                      </div>
                      {hasPrice && (
                        <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-900 shadow-sm">
                          ₹{course.priceInr}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="relative h-36 w-full border-b border-border bg-accent">
                    {course.coverImageUrl ? (
                      <Image
                        src={course.coverImageUrl}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-muted">
                        Course Cover image
                      </div>
                    )}
                  </div>

                  <CardContent className="space-y-3 p-4">
                    <div>
                      <div className="line-clamp-2 text-sm font-semibold text-primary">
                        {course.title}
                      </div>
                      <div className="mt-1 line-clamp-2 text-xs text-muted">
                        {course.description ?? "Description..."}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {course.tags.slice(0, 3).map((t) => (
                        <Badge key={t}>{t}</Badge>
                      ))}
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${course.completionPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <Link href={course.cta.href} aria-disabled={course.cta.disabled}>
                        <Button size="sm" disabled={course.cta.disabled}>
                          {course.cta.label === "Buy" ? "Buy Course" : course.cta.label}
                        </Button>
                      </Link>

                      <Link
                        href={`/courses/${course.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Details
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <aside className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-semibold">My profile</div>
              <div className="mt-4 flex items-center justify-center">
                <CircularProgress
                  value={Math.min(100, Math.max(0, (props.points / 120) * 100))}
                  labelTop={`Total ${props.points} Points`}
                  labelBottom={props.badge.name}
                />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted">Badge level</div>
                <Badge>{props.badge.name}</Badge>
              </div>
              <div className="mt-3">
                <Link
                  href="/profile"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View full profile
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-semibold">Badges</div>
              <div className="mt-3 space-y-2">
                {BADGE_LEVELS.map((level) => {
                  const active = props.points >= level.minPoints;
                  return (
                    <div
                      key={level.name}
                      className={cn(
                        "flex items-center justify-between rounded-[12px] border border-border px-3 py-2",
                        active ? "bg-surface" : "bg-accent",
                      )}
                    >
                      <div className={cn("text-sm", active ? "text-primary font-semibold" : "text-foreground")}> 
                        {level.name}
                      </div>
                      <div className="text-xs text-muted">{level.minPoints} Points</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

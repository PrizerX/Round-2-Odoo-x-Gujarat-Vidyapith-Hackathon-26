import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";
import { BADGE_LEVELS, getBadgeForPoints, getNextBadge } from "@/lib/domain/gamification";
import { MOCK_PROGRESS } from "@/lib/data/mock-learning";
import { getTotalEarnedPoints } from "@/lib/learning/points";

function getTotalPoints(userId: string): number {
  const total = MOCK_PROGRESS.filter((p) => p.userId === userId).reduce(
    (sum, p) => sum + (p.completionPercent ?? 0),
    0,
  );
  return Math.max(0, Math.round(total));
}

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/auth/sign-in?next=/profile");

  const earned = await getTotalEarnedPoints();
  const points = getTotalPoints(session.user.id) + earned;
  const badge = getBadgeForPoints(points);
  const next = getNextBadge(points);

  return (
    <div className="space-y-5">
      <div className="text-xs text-muted">
        <Link href="/my-courses" className="hover:underline">
          My Courses
        </Link>
        <span className="px-2">/</span>
        <span className="text-foreground">Profile</span>
      </div>

      <div>
        <h1 className="text-xl font-semibold">My Profile</h1>
        <p className="text-sm text-muted">Badges are based on total points earned.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>{session.user.name}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge>{badge.name}</Badge>
              <div className="text-sm">
                <span className="font-semibold">{points}</span> pts
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted">Email: {session.user.email}</div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${Math.min(100, Math.max(0, (points / 120) * 100))}%` }}
            />
          </div>
          <div className="text-sm text-muted">
            {next ? (
              <>
                Next: <span className="text-foreground">{next.name}</span> at {next.minPoints} pts
              </>
            ) : (
              <span className="text-foreground">You’ve reached the top badge.</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Badge levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {BADGE_LEVELS.map((level) => {
              const active = points >= level.minPoints;
              return (
                <div
                  key={level.name}
                  className={`rounded-[12px] border border-border p-3 ${
                    active ? "bg-surface" : "bg-accent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{level.name}</div>
                    <div className="text-xs text-muted">{level.minPoints} pts</div>
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    {active ? "Unlocked" : "Locked"}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

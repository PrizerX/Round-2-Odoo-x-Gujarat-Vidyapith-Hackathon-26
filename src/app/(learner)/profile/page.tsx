import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { BADGE_LEVELS, getBadgeForPoints, getNextBadge } from "@/lib/domain/gamification";
import { getMockBasePoints } from "@/lib/data/mock-learning";
import { getTotalEarnedPointsForUser } from "@/lib/learning/points";
import { getLearnerStreak } from "@/lib/learning/streak";
import { ProfileSettingsClient } from "./profile-settings-client";

function getTotalPoints(userId: string): number {
  return getMockBasePoints(userId);
}

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/auth/sign-in?next=/profile");

  const recentAttempts: Array<{
    id: string;
    attemptNumber: number;
    correctCount: number;
    totalQuestions: number;
    pointsAwarded: number;
    createdAt: Date;
    course: { title: string };
    quiz: { title: string };
  }> = await prisma.quizAttempt.findMany({
    where: {
      userId: session.user.id,
      OR: [{ totalQuestions: { gt: 0 } }, { pointsAwarded: { gt: 0 } }],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      course: { select: { title: true } },
      quiz: { select: { title: true } },
    },
  });

  const earned = await getTotalEarnedPointsForUser(session.user.id);
  const points = getTotalPoints(session.user.id) + earned;
  const badge = getBadgeForPoints(points);
  const next = getNextBadge(points);
  const streak = await getLearnerStreak(session.user.id);

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
            <CardTitle>Learner streak</CardTitle>
            <div className="text-sm text-muted">{streak.totalActiveDays} active day(s) total</div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm text-muted">Current streak</div>
              <div className="mt-1 text-2xl font-extrabold text-emerald-700">
                {streak.currentStreakDays} day{streak.currentStreakDays === 1 ? "" : "s"}
              </div>
              <div className="mt-1 text-sm text-muted">
                {streak.lastActiveAt ? `Last active: ${streak.lastActiveAt.toLocaleString()}` : "No activity yet"}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted">Last 7 days</div>
              <div className="mt-2 flex items-center gap-2">
                {streak.last7Days.map((d) => (
                  <div key={d.dayKey} className="flex flex-col items-center gap-1">
                    <div
                      className={
                        "h-8 w-8 rounded-[10px] border border-border " +
                        (d.active ? "bg-emerald-500" : "bg-accent")
                      }
                      title={d.dayKey}
                    />
                    <div className="text-[10px] text-muted">{d.dayKey.slice(8, 10)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

      <ProfileSettingsClient currentName={session.user.name} />

      <Card>
        <CardHeader>
          <CardTitle>Point History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted">
            Recent quiz points awarded (latest first).
          </div>

          <div className="mt-4 overflow-hidden rounded-[12px] border border-border">
            <div className="grid grid-cols-12 gap-2 border-b border-border bg-accent px-4 py-2 text-xs font-semibold text-muted">
              <div className="col-span-4">Course / Quiz</div>
              <div className="col-span-2">Attempt</div>
              <div className="col-span-2">Score</div>
              <div className="col-span-2 text-right">Points</div>
              <div className="col-span-2 text-right">Date</div>
            </div>

            {recentAttempts.length === 0 ? (
              <div className="px-4 py-4 text-sm text-muted">No point history yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {recentAttempts.map((a) => (
                  <div key={a.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm">
                    <div className="col-span-4">
                      <div className="font-medium">{a.course.title}</div>
                      <div className="text-xs text-muted">{a.quiz.title}</div>
                    </div>
                    <div className="col-span-2 text-muted">#{a.attemptNumber}</div>
                    <div className="col-span-2 text-muted">
                      {a.totalQuestions > 0 ? `${a.correctCount}/${a.totalQuestions}` : "—"}
                    </div>
                    <div className="col-span-2 text-right font-semibold text-emerald-700">
                      +{a.pointsAwarded}
                    </div>
                    <div className="col-span-2 text-right text-xs text-muted">
                      {a.createdAt.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

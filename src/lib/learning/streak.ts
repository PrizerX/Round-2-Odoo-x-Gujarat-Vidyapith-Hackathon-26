import { prisma } from "@/lib/db/prisma";

export type LearnerStreak = {
  currentStreakDays: number;
  totalActiveDays: number;
  lastActiveAt: Date | null;
  last7Days: Array<{ dayKey: string; active: boolean }>;
};

function dayKeyUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDaysUtc(dayKey: string, deltaDays: number): string {
  const dt = new Date(`${dayKey}T00:00:00.000Z`);
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return dayKeyUtc(dt);
}

export async function getLearnerStreak(userId: string): Promise<LearnerStreak> {
  if (!userId) {
    const todayKey = dayKeyUtc(new Date());
    const last7Days = Array.from({ length: 7 }).map((_, idx) => {
      const dayKey = addDaysUtc(todayKey, idx - 6);
      return { dayKey, active: false };
    });
    return { currentStreakDays: 0, totalActiveDays: 0, lastActiveAt: null, last7Days };
  }

  const [lessonRows, attemptRows, courseProgressRows] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { userId },
      select: { updatedAt: true, completedAt: true },
      take: 2000,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.quizAttempt.findMany({
      where: {
        userId,
        OR: [{ totalQuestions: { gt: 0 } }, { pointsAwarded: { gt: 0 } }],
      },
      select: { createdAt: true },
      take: 2000,
      orderBy: { createdAt: "desc" },
    }),
    prisma.courseProgress.findMany({
      where: { userId },
      select: { updatedAt: true, startedAt: true, completedAt: true },
      take: 2000,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const daySet = new Set<string>();
  let lastActiveAt: Date | null = null;

  const consider = (d: Date | null | undefined) => {
    if (!d) return;
    const key = dayKeyUtc(d);
    daySet.add(key);
    if (!lastActiveAt || d > lastActiveAt) lastActiveAt = d;
  };

  for (const r of lessonRows) {
    consider(r.updatedAt);
    consider(r.completedAt);
  }
  for (const r of attemptRows) {
    consider(r.createdAt);
  }
  for (const r of courseProgressRows) {
    consider(r.updatedAt);
    consider(r.startedAt);
    consider(r.completedAt);
  }

  const totalActiveDays = daySet.size;
  const todayKey = dayKeyUtc(new Date());
  const last7Days = Array.from({ length: 7 }).map((_, idx) => {
    const dayKey = addDaysUtc(todayKey, idx - 6);
    return { dayKey, active: daySet.has(dayKey) };
  });

  if (!lastActiveAt) {
    return { currentStreakDays: 0, totalActiveDays: 0, lastActiveAt: null, last7Days };
  }

  // Streak counts consecutive active days ending at the most recent active day.
  const lastActiveDay = dayKeyUtc(lastActiveAt);
  let currentStreakDays = 0;
  let cursor = lastActiveDay;
  while (daySet.has(cursor)) {
    currentStreakDays += 1;
    cursor = addDaysUtc(cursor, -1);
    if (currentStreakDays > 3660) break; // guard
  }

  return { currentStreakDays, totalActiveDays, lastActiveAt, last7Days };
}

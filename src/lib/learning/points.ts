import { cookies } from "next/headers";

import { prisma } from "@/lib/db/prisma";

const COOKIE_NAME = "learnova_course_points";

type PointsMap = Record<string, number>;

function sanitizePointsMap(value: unknown): PointsMap {
  if (!value || typeof value !== "object") return {};
  const out: PointsMap = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof k !== "string" || !k) continue;
    if (typeof v !== "number" || !Number.isFinite(v)) continue;
    const points = Math.max(0, Math.min(1000, Math.round(v)));
    out[k] = points;
  }
  return out;
}

export async function getCoursePointsMap(): Promise<PointsMap> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return {};

  try {
    return sanitizePointsMap(JSON.parse(raw));
  } catch {
    return {};
  }
}

export async function getEarnedPointsForCourse(courseId: string): Promise<number> {
  const map = await getCoursePointsMap();
  return map[courseId] ?? 0;
}

export async function getTotalEarnedPoints(): Promise<number> {
  const map = await getCoursePointsMap();
  return Object.values(map).reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0);
}

export async function getTotalEarnedPointsForUser(userId: string): Promise<number> {
  if (!userId) return getTotalEarnedPoints();

  try {
    // Match the cookie semantics: best score per course, then sum.
    const grouped = await prisma.quizAttempt.groupBy({
      by: ["courseId"],
      where: { userId },
      _max: { pointsAwarded: true },
    });

    return grouped.reduce((sum, g) => sum + (g._max.pointsAwarded ?? 0), 0);
  } catch {
    return getTotalEarnedPoints();
  }
}

export const COURSE_POINTS_COOKIE = COOKIE_NAME;

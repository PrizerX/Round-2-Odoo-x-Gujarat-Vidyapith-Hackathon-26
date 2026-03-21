import { cookies } from "next/headers";

import { prisma } from "@/lib/db/prisma";

const COOKIE_NAME = "learnova_completed_courses";

async function getCompletedCourseIdsFromCookies(): Promise<Set<string>> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return new Set();

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    const ids = parsed.filter((v) => typeof v === "string" && v.length > 0);
    return new Set(ids);
  } catch {
    return new Set();
  }
}

export async function getCompletedCourseIds(userId?: string | null): Promise<Set<string>> {
  if (!userId) return getCompletedCourseIdsFromCookies();

  try {
    const rows = await prisma.courseProgress.findMany({
      where: { userId, completionPercent: { gte: 100 } },
      select: { courseId: true },
    });
    return new Set(rows.map((r: any) => r.courseId));
  } catch {
    return getCompletedCourseIdsFromCookies();
  }
}

export async function isCourseCompleted(courseId: string, userId?: string | null): Promise<boolean> {
  const ids = await getCompletedCourseIds(userId);
  return ids.has(courseId);
}

export const COMPLETED_COURSES_COOKIE = COOKIE_NAME;

import { prisma } from "@/lib/db/prisma";

export type DbCourseProgress = {
  completionPercent: number;
  lastLessonId: string | null;
};

export async function getDbProgressForCourse(userId: string, courseId: string): Promise<DbCourseProgress | null> {
  if (!userId || !courseId) return null;
  try {
    const row = await prisma.courseProgress.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { completionPercent: true, lastLessonId: true },
    });

    if (!row) return null;
    return {
      completionPercent:
        typeof (row as any).completionPercent === "number" ? (row as any).completionPercent : 0,
      lastLessonId: typeof (row as any).lastLessonId === "string" ? (row as any).lastLessonId : null,
    };
  } catch {
    return null;
  }
}

export async function getDbProgressMapForUser(userId: string): Promise<Record<string, DbCourseProgress>> {
  if (!userId) return {};
  try {
    const rows = await prisma.courseProgress.findMany({
      where: { userId },
      select: { courseId: true, completionPercent: true, lastLessonId: true },
    });

    const out: Record<string, DbCourseProgress> = {};
    for (const r of rows as any[]) {
      const courseId = typeof r.courseId === "string" ? r.courseId : "";
      if (!courseId) continue;
      out[courseId] = {
        completionPercent: typeof r.completionPercent === "number" ? r.completionPercent : 0,
        lastLessonId: typeof r.lastLessonId === "string" ? r.lastLessonId : null,
      };
    }
    return out;
  } catch {
    return {};
  }
}

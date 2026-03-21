import { prisma } from "@/lib/db/prisma";

export async function getEnrolledCourseIdsForUser(userId: string): Promise<Set<string>> {
  if (!userId) return new Set();
  try {
    const rows = await prisma.enrollment.findMany({
      where: { userId },
      select: { courseId: true },
    });
    return new Set(rows.map((r: any) => r.courseId));
  } catch {
    return new Set();
  }
}

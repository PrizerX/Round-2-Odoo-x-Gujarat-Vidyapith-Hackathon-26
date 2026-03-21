import { prisma } from "@/lib/db/prisma";

export async function getPurchasedCourseIdsForUser(userId: string): Promise<Set<string>> {
  if (!userId) return new Set();
  try {
    const rows = await prisma.purchase.findMany({
      where: { userId, status: "paid" },
      select: { courseId: true },
    });
    return new Set(rows.map((r: any) => r.courseId));
  } catch {
    return new Set();
  }
}

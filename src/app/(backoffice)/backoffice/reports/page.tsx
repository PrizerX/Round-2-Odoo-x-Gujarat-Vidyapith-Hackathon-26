import { prisma } from "@/lib/db/prisma";

import { BackofficeReportsClient, type ReportRow, type ReportStats } from "./reports-client";

function toIso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

function computeStatus(args: {
  completionPercent: number;
  startedAt: Date | null | undefined;
  completedAt: Date | null | undefined;
  totalTimeSpentSeconds: number;
}): ReportRow["status"] {
  if (args.completedAt || args.completionPercent >= 100) return "completed";
  if (args.startedAt || args.completionPercent > 0 || args.totalTimeSpentSeconds > 0) return "in_progress";
  return "yet_to_start";
}

export default async function BackofficeReportsPage() {
  // Rows are based on enrollments (user-course). Progress is taken from CourseProgress.
  const enrollments = await prisma.enrollment.findMany({
    where: { status: "enrolled" },
    orderBy: [{ createdAt: "desc" }],
    take: 500,
    select: {
      id: true,
      createdAt: true,
      userId: true,
      courseId: true,
      user: { select: { name: true, email: true } },
      course: { select: { title: true } },
    },
  });

  const userIds = Array.from(new Set(enrollments.map((e) => e.userId)));
  const courseIds = Array.from(new Set(enrollments.map((e) => e.courseId)));

  const progresses = await prisma.courseProgress.findMany({
    where: {
      userId: { in: userIds.length ? userIds : ["__none__"] },
      courseId: { in: courseIds.length ? courseIds : ["__none__"] },
    },
    select: {
      userId: true,
      courseId: true,
      completionPercent: true,
      startedAt: true,
      completedAt: true,
      totalTimeSpentSeconds: true,
      updatedAt: true,
    },
  });

  const progressByKey = new Map<string, (typeof progresses)[number]>();
  for (const p of progresses) progressByKey.set(`${p.userId}:${p.courseId}`, p);

  const rows: ReportRow[] = enrollments.map((e) => {
    const p = progressByKey.get(`${e.userId}:${e.courseId}`);
    const completionPercent = p?.completionPercent ?? 0;
    const totalTimeSpentSeconds = p?.totalTimeSpentSeconds ?? 0;
    const startedAt = p?.startedAt ?? null;
    const completedAt = p?.completedAt ?? null;

    return {
      id: e.id,
      courseTitle: e.course.title,
      participantName: e.user.name,
      participantEmail: e.user.email,
      enrolledAt: toIso(e.createdAt)!,
      startedAt: toIso(startedAt),
      timeSpentSeconds: totalTimeSpentSeconds,
      completionPercent,
      completedAt: toIso(completedAt),
      status: computeStatus({
        completionPercent,
        startedAt,
        completedAt,
        totalTimeSpentSeconds,
      }),
      lastUpdatedAt: toIso(p?.updatedAt) ?? null,
    };
  });

  const stats: ReportStats = {
    totalParticipants: rows.length,
    yetToStart: rows.filter((r) => r.status === "yet_to_start").length,
    inProgress: rows.filter((r) => r.status === "in_progress").length,
    completed: rows.filter((r) => r.status === "completed").length,
  };

  return <BackofficeReportsClient stats={stats} rows={rows} />;
}

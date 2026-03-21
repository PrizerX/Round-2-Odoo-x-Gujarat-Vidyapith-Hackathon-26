import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function resolveDbLessonId(args: { courseId: string; routeLessonId: string }): string {
  const courseId = args.courseId.trim();
  const routeLessonId = args.routeLessonId.trim();
  if (!courseId || !routeLessonId) return "";

  // Seeded IDs are `${courseId}:lesson_1`, but the route uses `lesson_1`.
  if (routeLessonId.includes(":")) return routeLessonId;
  return `${courseId}:${routeLessonId}`;
}

async function assertLearnerHasCourseAccess(args: {
  userId: string;
  courseId: string;
}): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const { userId, courseId } = args;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, accessRule: true, published: true },
  });

  if (!course) return { ok: false, status: 404, error: "Course not found" };

  // For learner flows we still keep the join-first logic.
  const [enrolled, purchased] = await Promise.all([
    prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true },
    }),
    prisma.purchase.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true },
    }),
  ]);

  const enrolledDb = !!enrolled;
  const purchasedDb = !!purchased;
  const hasAccessViaDb = enrolledDb || purchasedDb;

  if (course.accessRule === "invitation" && !enrolledDb) {
    return { ok: false, status: 403, error: "Invitation required" };
  }

  if (course.accessRule === "payment" && !purchasedDb) {
    return { ok: false, status: 403, error: "Purchase required" };
  }

  if (course.accessRule === "open" && !hasAccessViaDb) {
    return { ok: false, status: 403, error: "Join required" };
  }

  return { ok: true };
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return jsonError("Unauthenticated", 401);

  let courseId = "";
  let lessonId = "";
  let action: "visit" | "complete" = "complete";

  try {
    const body = (await req.json()) as unknown;
    if (typeof body === "object" && body) {
      courseId = asString((body as any).courseId).trim();
      lessonId = asString((body as any).lessonId).trim();
      const a = asString((body as any).action).trim();
      if (a === "visit" || a === "complete") action = a;
    }
  } catch {
    // ignore
  }

  if (!courseId) return jsonError("courseId is required", 400);
  if (!lessonId) return jsonError("lessonId is required", 400);

  const access = await assertLearnerHasCourseAccess({ userId: session.user.id, courseId });
  if (!access.ok) return jsonError(access.error, access.status);

  const candidateIds = Array.from(
    new Set([
      resolveDbLessonId({ courseId, routeLessonId: lessonId }),
      lessonId, // allow passing db id directly
    ].filter(Boolean)),
  );

  const lesson = await prisma.lesson.findFirst({
    where: { courseId, id: { in: candidateIds } },
    select: { id: true },
  });

  if (!lesson) return jsonError("Lesson not found", 404);

  const now = new Date();
  const completed = action === "complete";

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId: lesson.id } },
    update: {
      completed: completed ? true : undefined,
      completedAt: completed ? now : undefined,
    },
    create: {
      userId: session.user.id,
      lessonId: lesson.id,
      completed: completed ? true : false,
      completedAt: completed ? now : null,
    },
  });

  // Keep course-level progress in sync (used by cards + reporting).
  try {
    const [totalLessons, completedLessons] = await Promise.all([
      prisma.lesson.count({ where: { courseId } }),
      prisma.lessonProgress.count({ where: { userId: session.user.id, completed: true, lesson: { courseId } } }),
    ]);

    const denom = Math.max(1, totalLessons);
    const percent = Math.max(0, Math.min(100, Math.floor((completedLessons / denom) * 100)));

    const existing = await prisma.courseProgress.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId } },
      select: { startedAt: true, completionPercent: true },
    });

    const nextPercent = Math.max(
      typeof (existing as any)?.completionPercent === "number" ? (existing as any).completionPercent : 0,
      percent,
    );

    await prisma.courseProgress.upsert({
      where: { userId_courseId: { userId: session.user.id, courseId } },
      update: {
        lastLessonId: lessonId,
        completionPercent: nextPercent,
        startedAt: (existing as any)?.startedAt ?? now,
        completedAt: nextPercent >= 100 ? now : null,
      },
      create: {
        userId: session.user.id,
        courseId,
        lastLessonId: lessonId,
        completionPercent: nextPercent,
        startedAt: now,
        completedAt: nextPercent >= 100 ? now : null,
      },
    });
  } catch {
    // best-effort
  }

  return NextResponse.json({ ok: true });
}

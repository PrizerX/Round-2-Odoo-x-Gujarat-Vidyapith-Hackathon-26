import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { COMPLETED_COURSES_COOKIE } from "@/lib/learning/completed-courses";
import { COURSE_POINTS_COOKIE } from "@/lib/learning/points";

export async function POST(req: Request) {
  let courseId: string | undefined;
  let points: number | undefined;
  let quizId: string | undefined;
  let attemptId: string | undefined;
  let attemptNumber: number | undefined;
  let correctCount: number | undefined;
  let totalQuestions: number | undefined;
  try {
    const body = (await req.json()) as unknown;
    if (typeof body === "object" && body && "courseId" in body) {
      const v = (body as { courseId?: unknown }).courseId;
      if (typeof v === "string") courseId = v;
    }
    if (typeof body === "object" && body && "points" in body) {
      const p = (body as { points?: unknown }).points;
      if (typeof p === "number" && Number.isFinite(p)) points = p;
    }
    if (typeof body === "object" && body && "quizId" in body) {
      const v = (body as { quizId?: unknown }).quizId;
      if (typeof v === "string") quizId = v;
    }
    if (typeof body === "object" && body && "attemptId" in body) {
      const v = (body as { attemptId?: unknown }).attemptId;
      if (typeof v === "string") attemptId = v;
    }
    if (typeof body === "object" && body && "attemptNumber" in body) {
      const v = (body as { attemptNumber?: unknown }).attemptNumber;
      if (typeof v === "number" && Number.isFinite(v)) attemptNumber = v;
    }
    if (typeof body === "object" && body && "correctCount" in body) {
      const v = (body as { correctCount?: unknown }).correctCount;
      if (typeof v === "number" && Number.isFinite(v)) correctCount = v;
    }
    if (typeof body === "object" && body && "totalQuestions" in body) {
      const v = (body as { totalQuestions?: unknown }).totalQuestions;
      if (typeof v === "number" && Number.isFinite(v)) totalQuestions = v;
    }
  } catch {
    // ignore
  }

  if (!courseId) {
    return NextResponse.json({ ok: false, error: "courseId is required" }, { status: 400 });
  }

  const store = await cookies();
  const existingRaw = store.get(COMPLETED_COURSES_COOKIE)?.value;

  let ids: string[] = [];
  try {
    const parsed = existingRaw ? JSON.parse(existingRaw) : [];
    ids = Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    ids = [];
  }

  if (!ids.includes(courseId)) ids = [...ids, courseId];

  store.set(COMPLETED_COURSES_COOKIE, JSON.stringify(ids), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  if (typeof points === "number") {
    const rawPoints = store.get(COURSE_POINTS_COOKIE)?.value;
    let map: Record<string, number> = {};
    try {
      const parsed = rawPoints ? JSON.parse(rawPoints) : {};
      map = typeof parsed === "object" && parsed ? (parsed as Record<string, number>) : {};
    } catch {
      map = {};
    }

    const safe = Math.max(0, Math.min(1000, Math.round(points)));
    const prev = typeof map[courseId] === "number" && Number.isFinite(map[courseId]) ? map[courseId] : 0;
    map[courseId] = Math.max(prev, safe);

    store.set(COURSE_POINTS_COOKIE, JSON.stringify(map), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  // L3: also persist completion/attempts in DB for signed-in users.
  try {
    const session = await getSession();
    if (session) {
      const userId = session.user.id;
      const exists = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });

      if (exists) {
        await prisma.courseProgress.upsert({
          where: { userId_courseId: { userId, courseId } },
          update: {
            completionPercent: 100,
            completedAt: new Date(),
          },
          create: {
            userId,
            courseId,
            completionPercent: 100,
            startedAt: new Date(),
            completedAt: new Date(),
          },
        });
      }

      const safeQuizId = (quizId && quizId.trim()) || (courseId ? `quiz_${courseId}` : "");
      if (safeQuizId && exists) {
        const quiz = await prisma.quiz.findUnique({ where: { id: safeQuizId }, select: { id: true } });
        if (quiz) {
          const safeAttemptNumber =
            typeof attemptNumber === "number" && Number.isFinite(attemptNumber)
              ? Math.max(1, Math.min(999, Math.floor(attemptNumber)))
              : undefined;
          const safeCorrect =
            typeof correctCount === "number" && Number.isFinite(correctCount)
              ? Math.max(0, Math.min(999, Math.floor(correctCount)))
              : 0;
          const safeTotal =
            typeof totalQuestions === "number" && Number.isFinite(totalQuestions)
              ? Math.max(0, Math.min(999, Math.floor(totalQuestions)))
              : 0;
          const safePoints =
            typeof points === "number" && Number.isFinite(points)
              ? Math.max(0, Math.min(1000, Math.round(points)))
              : 0;

          if (attemptId && attemptId.trim()) {
            await prisma.quizAttempt.updateMany({
              where: { id: attemptId, userId, quizId: safeQuizId },
              data: {
                correctCount: safeCorrect,
                totalQuestions: safeTotal,
                pointsAwarded: safePoints,
              },
            });
          } else {
            let nextAttemptNumber = safeAttemptNumber;
            if (!nextAttemptNumber) {
              const latest = await prisma.quizAttempt.findFirst({
                where: { userId, quizId: safeQuizId },
                orderBy: { attemptNumber: "desc" },
                select: { attemptNumber: true },
              });
              nextAttemptNumber = (latest?.attemptNumber ?? 0) + 1;
            }

            await prisma.quizAttempt.create({
              data: {
                userId,
                courseId,
                quizId: safeQuizId,
                attemptNumber: nextAttemptNumber,
                correctCount: safeCorrect,
                totalQuestions: safeTotal,
                pointsAwarded: safePoints,
              },
            });
          }
        }
      }
    }
  } catch {
    // L3 persistence is best-effort for MVP; cookie flow remains primary fallback.
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return jsonError("Unauthenticated", 401);

  const { searchParams } = new URL(req.url);
  const quizId = searchParams.get("quizId")?.trim() || "";

  if (!quizId) return jsonError("quizId is required", 400);

  const latest = await prisma.quizAttempt.findFirst({
    where: { userId: session.user.id, quizId },
    orderBy: { attemptNumber: "desc" },
    select: { attemptNumber: true },
  });

  return NextResponse.json({ ok: true, attemptNumber: latest?.attemptNumber ?? 0 });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return jsonError("Unauthenticated", 401);

  let courseId = "";
  let quizId = "";

  try {
    const body = (await req.json()) as unknown;
    if (typeof body === "object" && body) {
      const c = (body as { courseId?: unknown }).courseId;
      const q = (body as { quizId?: unknown }).quizId;
      if (typeof c === "string") courseId = c.trim();
      if (typeof q === "string") quizId = q.trim();
    }
  } catch {
    // ignore
  }

  if (!courseId) return jsonError("courseId is required", 400);
  if (!quizId) return jsonError("quizId is required", 400);

  const [course, quiz] = await Promise.all([
    prisma.course.findUnique({ where: { id: courseId }, select: { id: true } }),
    prisma.quiz.findUnique({ where: { id: quizId }, select: { id: true } }),
  ]);

  if (!course) return jsonError("Course not found in DB", 404);
  if (!quiz) return jsonError("Quiz not found in DB", 404);

  const latest = await prisma.quizAttempt.findFirst({
    where: { userId: session.user.id, quizId },
    orderBy: { attemptNumber: "desc" },
    select: { attemptNumber: true },
  });

  const attemptNumber = (latest?.attemptNumber ?? 0) + 1;

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: session.user.id,
      courseId,
      quizId,
      attemptNumber,
      correctCount: 0,
      totalQuestions: 0,
      pointsAwarded: 0,
    },
    select: { id: true, attemptNumber: true },
  });

  return NextResponse.json({ ok: true, attemptId: attempt.id, attemptNumber: attempt.attemptNumber });
}

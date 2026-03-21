import { NextResponse } from "next/server";

import type { Prisma } from "@prisma/client";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function isInstructorOrAdmin(role: string | undefined) {
  return role === "instructor" || role === "admin";
}

type PatchQuizBody = {
  title?: string;
  allowMultipleAttempts?: boolean;
  pointsPerCorrect?: number;
  rewardRules?: Array<{ attemptNumber: number; pointsPerCorrect: number }>;
};

export async function PATCH(req: Request, ctx: { params: Promise<{ courseId: string; quizId: string }> }) {
  const session = await getSession();
  if (!session || !isInstructorOrAdmin(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { courseId, quizId } = await ctx.params;

  let body: PatchQuizBody = {};
  try {
    body = (await req.json()) as PatchQuizBody;
  } catch {
    body = {};
  }

  const title = typeof body.title === "string" ? body.title.trim().slice(0, 120) : undefined;
  const allowMultipleAttempts =
    typeof body.allowMultipleAttempts === "boolean" ? body.allowMultipleAttempts : undefined;
  const pointsPerCorrect =
    typeof body.pointsPerCorrect === "number" && Number.isFinite(body.pointsPerCorrect)
      ? Math.max(0, Math.floor(body.pointsPerCorrect))
      : undefined;

  const rewardRulesRaw = Array.isArray(body.rewardRules) ? body.rewardRules : undefined;
  const rewardRules = rewardRulesRaw
    ? rewardRulesRaw
        .map((r) => ({
          attemptNumber:
            typeof r?.attemptNumber === "number" && Number.isFinite(r.attemptNumber)
              ? Math.max(1, Math.floor(r.attemptNumber))
              : NaN,
          pointsPerCorrect:
            typeof r?.pointsPerCorrect === "number" && Number.isFinite(r.pointsPerCorrect)
              ? Math.max(1, Math.floor(r.pointsPerCorrect))
              : NaN,
        }))
        .filter((r) => Number.isFinite(r.attemptNumber) && Number.isFinite(r.pointsPerCorrect))
    : undefined;

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const quiz = await tx.quiz.findUnique({ where: { id: quizId }, select: { id: true, courseId: true } });
      if (!quiz || quiz.courseId !== courseId) throw new Error("not_found");

      if (title !== undefined || allowMultipleAttempts !== undefined || pointsPerCorrect !== undefined) {
        await tx.quiz.update({
          where: { id: quizId },
          data: {
            ...(title !== undefined ? { title } : null),
            ...(allowMultipleAttempts !== undefined ? { allowMultipleAttempts } : null),
            ...(pointsPerCorrect !== undefined ? { pointsPerCorrect } : null),
          },
          select: { id: true },
        });
      }

      if (rewardRules) {
        // Normalize: keep unique attemptNumber.
        const unique = new Map<number, number>();
        for (const r of rewardRules) unique.set(r.attemptNumber, r.pointsPerCorrect);
        const data = Array.from(unique.entries())
          .slice(0, 20)
          .map(([attemptNumber, pointsPerCorrect]) => ({ quizId, attemptNumber, pointsPerCorrect }));

        await tx.quizRewardRule.deleteMany({ where: { quizId } });
        if (data.length > 0) {
          await tx.quizRewardRule.createMany({ data });
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    if (msg === "not_found") {
      return NextResponse.json({ ok: false, error: "Quiz not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: false, error: "Failed to update quiz" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

import type { Prisma } from "@prisma/client";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function isInstructorOrAdmin(role: string | undefined) {
  return role === "instructor" || role === "admin";
}

type PatchQuestionBody = {
  prompt?: string;
  allowMultipleCorrect?: boolean;
};

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ courseId: string; quizId: string; questionId: string }> },
) {
  const session = await getSession();
  if (!session || !isInstructorOrAdmin(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { courseId, quizId, questionId } = await ctx.params;

  let body: PatchQuestionBody = {};
  try {
    body = (await req.json()) as PatchQuestionBody;
  } catch {
    body = {};
  }

  const promptRaw = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 500) : undefined;
  const allowMultipleCorrect = typeof body.allowMultipleCorrect === "boolean" ? body.allowMultipleCorrect : undefined;

  if (promptRaw !== undefined && promptRaw.length === 0) {
    return NextResponse.json({ ok: false, error: "prompt cannot be empty" }, { status: 400 });
  }
  if (promptRaw === undefined && allowMultipleCorrect === undefined) {
    return NextResponse.json({ ok: false, error: "No changes" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const quiz = await tx.quiz.findUnique({ where: { id: quizId }, select: { id: true, courseId: true } });
      if (!quiz || quiz.courseId !== courseId) throw new Error("not_found");

      const q = await tx.question.findUnique({
        where: { id: questionId },
        select: { id: true, quizId: true, allowMultipleCorrect: true },
      });
      if (!q || q.quizId !== quizId) throw new Error("not_found");

      const nextAllowMultipleCorrect = allowMultipleCorrect ?? q.allowMultipleCorrect;

      await tx.question.update({
        where: { id: questionId },
        data: {
          ...(promptRaw !== undefined ? { prompt: promptRaw } : null),
          ...(allowMultipleCorrect !== undefined ? { allowMultipleCorrect } : null),
        },
        select: { id: true },
      });

      // If switching to MCQ, enforce at most one correct option (and at least one).
      if (q.allowMultipleCorrect && !nextAllowMultipleCorrect) {
        const options = await tx.option.findMany({
          where: { questionId },
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
          select: { id: true, isCorrect: true },
        });

        const correct = options.filter((o: { id: string; isCorrect: boolean }) => o.isCorrect);
        const keepId = correct[0]?.id ?? options[0]?.id;
        if (keepId) {
          await tx.option.updateMany({ where: { questionId }, data: { isCorrect: false } });
          await tx.option.update({ where: { id: keepId }, data: { isCorrect: true }, select: { id: true } });
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    if (msg === "not_found") {
      return NextResponse.json({ ok: false, error: "Question not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: false, error: "Failed to update question" }, { status: 500 });
  }
}

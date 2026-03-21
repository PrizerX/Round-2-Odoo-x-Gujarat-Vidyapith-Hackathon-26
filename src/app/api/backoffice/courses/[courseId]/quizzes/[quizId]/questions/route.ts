import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import type { Prisma } from "@prisma/client";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function isInstructorOrAdmin(role: string | undefined) {
  return role === "instructor" || role === "admin";
}

type CreateQuestionBody = {
  prompt?: string;
};

export async function POST(
  req: Request,
  ctx: { params: Promise<{ courseId: string; quizId: string }> },
) {
  const session = await getSession();
  if (!session || !isInstructorOrAdmin(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { courseId, quizId } = await ctx.params;

  let body: CreateQuestionBody = {};
  try {
    body = (await req.json()) as CreateQuestionBody;
  } catch {
    body = {};
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 500) : "";
  if (!prompt) {
    return NextResponse.json({ ok: false, error: "prompt is required" }, { status: 400 });
  }

  try {
    const questionId = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const quiz = await tx.quiz.findUnique({ where: { id: quizId }, select: { id: true, courseId: true } });
      if (!quiz || quiz.courseId !== courseId) throw new Error("not_found");

      const last = await tx.question.findFirst({
        where: { quizId },
        orderBy: [{ sortOrder: "desc" }],
        select: { sortOrder: true },
      });

      const sortOrder = (last?.sortOrder ?? 0) + 1;
      const newId = `q_${quizId}_${randomUUID()}`;

      await tx.question.create({
        data: {
          id: newId,
          quizId,
          prompt,
          sortOrder,
          options: {
            create: [
              { text: "Option A", sortOrder: 1, isCorrect: true },
              { text: "Option B", sortOrder: 2, isCorrect: false },
              { text: "Option C", sortOrder: 3, isCorrect: false },
            ],
          },
        },
        select: { id: true },
      });

      return newId;
    });

    return NextResponse.json({ ok: true, questionId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    if (msg === "not_found") {
      return NextResponse.json({ ok: false, error: "Quiz not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: false, error: "Failed to create question" }, { status: 500 });
  }
}

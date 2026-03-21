import { NextResponse } from "next/server";

import type { Prisma } from "@prisma/client";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function isInstructorOrAdmin(role: string | undefined) {
  return role === "instructor" || role === "admin";
}

type CreateOptionBody = {
  text?: string;
};

export async function POST(
  req: Request,
  ctx: { params: Promise<{ courseId: string; quizId: string; questionId: string }> },
) {
  const session = await getSession();
  if (!session || !isInstructorOrAdmin(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { courseId, quizId, questionId } = await ctx.params;

  let body: CreateOptionBody = {};
  try {
    body = (await req.json()) as CreateOptionBody;
  } catch {
    body = {};
  }

  const text = typeof body.text === "string" ? body.text.trim().slice(0, 200) : "";
  if (!text) {
    return NextResponse.json({ ok: false, error: "text is required" }, { status: 400 });
  }

  try {
    const option = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const quiz = await tx.quiz.findUnique({ where: { id: quizId }, select: { id: true, courseId: true } });
      if (!quiz || quiz.courseId !== courseId) throw new Error("not_found");

      const q = await tx.question.findUnique({ where: { id: questionId }, select: { id: true, quizId: true } });
      if (!q || q.quizId !== quizId) throw new Error("not_found");

      const last = await tx.option.findFirst({
        where: { questionId },
        orderBy: [{ sortOrder: "desc" }],
        select: { sortOrder: true },
      });

      const sortOrder = (last?.sortOrder ?? 0) + 1;

      return tx.option.create({
        data: { questionId, text, sortOrder, isCorrect: false },
        select: { id: true, text: true, sortOrder: true, isCorrect: true },
      });
    });

    return NextResponse.json({ ok: true, option });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    if (msg === "not_found") {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: false, error: "Failed to create option" }, { status: 500 });
  }
}

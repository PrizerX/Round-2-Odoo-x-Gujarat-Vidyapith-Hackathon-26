import { NextResponse } from "next/server";

import type { Prisma } from "@prisma/client";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function isInstructorOrAdmin(role: string | undefined) {
  return role === "instructor" || role === "admin";
}

type PatchOptionBody = {
  text?: string;
  isCorrect?: boolean;
};

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ courseId: string; quizId: string; questionId: string; optionId: string }> },
) {
  const session = await getSession();
  if (!session || !isInstructorOrAdmin(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { courseId, quizId, questionId, optionId } = await ctx.params;

  let body: PatchOptionBody = {};
  try {
    body = (await req.json()) as PatchOptionBody;
  } catch {
    body = {};
  }

  const text = typeof body.text === "string" ? body.text.trim().slice(0, 200) : undefined;
  const isCorrect = typeof body.isCorrect === "boolean" ? body.isCorrect : undefined;

  if (text !== undefined && text.length === 0) {
    return NextResponse.json({ ok: false, error: "text cannot be empty" }, { status: 400 });
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

      const opt = await tx.option.findUnique({
        where: { id: optionId },
        select: { id: true, questionId: true, isCorrect: true },
      });
      if (!opt || opt.questionId !== questionId) throw new Error("not_found");

      if (isCorrect === false) {
        const otherCorrect = await tx.option.count({
          where: { questionId, isCorrect: true, id: { not: optionId } },
        });
        if (otherCorrect === 0) throw new Error("need_one_correct");
      }

      if (isCorrect === true && !q.allowMultipleCorrect) {
        await tx.option.updateMany({ where: { questionId }, data: { isCorrect: false } });
      }

      await tx.option.update({
        where: { id: optionId },
        data: {
          ...(text !== undefined ? { text } : null),
          ...(isCorrect !== undefined ? { isCorrect } : null),
        },
        select: { id: true },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    if (msg === "need_one_correct") {
      return NextResponse.json({ ok: false, error: "At least one correct option is required." }, { status: 400 });
    }
    if (msg === "not_found") {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: false, error: "Failed to update option" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ courseId: string; quizId: string; questionId: string; optionId: string }> },
) {
  const session = await getSession();
  if (!session || !isInstructorOrAdmin(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { courseId, quizId, questionId, optionId } = await ctx.params;

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const quiz = await tx.quiz.findUnique({ where: { id: quizId }, select: { id: true, courseId: true } });
      if (!quiz || quiz.courseId !== courseId) throw new Error("not_found");

      const q = await tx.question.findUnique({ where: { id: questionId }, select: { id: true, quizId: true } });
      if (!q || q.quizId !== quizId) throw new Error("not_found");

      const opt = await tx.option.findUnique({
        where: { id: optionId },
        select: { id: true, questionId: true, isCorrect: true },
      });
      if (!opt || opt.questionId !== questionId) throw new Error("not_found");

      const total = await tx.option.count({ where: { questionId } });
      if (total <= 2) throw new Error("min_options");

      await tx.option.delete({ where: { id: optionId }, select: { id: true } });

      if (opt.isCorrect) {
        const remainingCorrect = await tx.option.count({ where: { questionId, isCorrect: true } });
        if (remainingCorrect === 0) {
          const first = await tx.option.findFirst({
            where: { questionId },
            orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
            select: { id: true },
          });
          if (first?.id) {
            await tx.option.update({ where: { id: first.id }, data: { isCorrect: true }, select: { id: true } });
          }
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    if (msg === "min_options") {
      return NextResponse.json({ ok: false, error: "A question must have at least 2 options." }, { status: 400 });
    }
    if (msg === "not_found") {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: false, error: "Failed to delete option" }, { status: 500 });
  }
}

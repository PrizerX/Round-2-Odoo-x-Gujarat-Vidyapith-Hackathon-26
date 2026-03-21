import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function isInstructorOrAdmin(role: string | undefined) {
  return role === "instructor" || role === "admin";
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ courseId: string; lessonId: string; attachmentId: string }> },
) {
  const session = await getSession();
  if (!session || !isInstructorOrAdmin(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { courseId, lessonId, attachmentId } = await ctx.params;

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const lesson = await tx.lesson.findUnique({ where: { id: lessonId }, select: { id: true, courseId: true } });
      if (!lesson || lesson.courseId !== courseId) throw new Error("not_found");

      const att = await tx.attachment.findUnique({ where: { id: attachmentId }, select: { id: true, lessonId: true } });
      if (!att || att.lessonId !== lessonId) throw new Error("not_found");

      await tx.attachment.delete({ where: { id: attachmentId } });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    if (msg === "not_found") {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: false, error: "Failed to delete attachment" }, { status: 500 });
  }
}

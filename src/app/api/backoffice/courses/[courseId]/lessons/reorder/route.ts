import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function isInstructorOrAdmin(role: string | undefined) {
  return role === "instructor" || role === "admin";
}

type ReorderBody = {
  lessonId?: string;
  direction?: "up" | "down";
};

export async function POST(
  req: Request,
  ctx: { params: Promise<{ courseId: string }> },
) {
  const session = await getSession();
  if (!session || !isInstructorOrAdmin(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await ctx.params;

  let body: ReorderBody = {};
  try {
    body = (await req.json()) as ReorderBody;
  } catch {
    body = {};
  }

  const lessonId = typeof body.lessonId === "string" ? body.lessonId.trim().slice(0, 200) : "";
  const direction = body.direction;

  if (!lessonId || (direction !== "up" && direction !== "down")) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const lesson = await tx.lesson.findUnique({
        where: { id: lessonId },
        select: { id: true, courseId: true, unitId: true, sortOrder: true, createdAt: true },
      });

      if (!lesson || lesson.courseId !== courseId) throw new Error("not_found");

      const siblings = await tx.lesson.findMany({
        where: {
          courseId,
          unitId: lesson.unitId,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, sortOrder: true, createdAt: true },
      });

      const typedSiblings = siblings as Array<{ id: string; sortOrder: number; createdAt: Date }>;

      const idx = typedSiblings.findIndex((l) => l.id === lessonId);
      if (idx < 0) throw new Error("not_found");

      const targetIndex = direction === "up" ? idx - 1 : idx + 1;
      if (targetIndex < 0 || targetIndex >= typedSiblings.length) return;

      const a = typedSiblings[idx];
      const b = typedSiblings[targetIndex];
      if (!a || !b) return;

      // Swap sortOrder atomically.
      await tx.lesson.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } });
      await tx.lesson.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    if (msg === "not_found") {
      return NextResponse.json({ ok: false, error: "Lesson not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: false, error: "Failed to reorder lesson" }, { status: 500 });
  }
}

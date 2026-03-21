import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function isInstructorOrAdmin(role: string | undefined) {
  return role === "instructor" || role === "admin";
}

type CreateUnitBody = {
  title?: string;
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

  let body: CreateUnitBody = {};
  try {
    body = (await req.json()) as CreateUnitBody;
  } catch {
    body = {};
  }

  const title = typeof body.title === "string" ? body.title.trim().slice(0, 120) : "";
  if (!title) {
    return NextResponse.json({ ok: false, error: "title is required" }, { status: 400 });
  }

  try {
    const unit = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const course = await tx.course.findUnique({ where: { id: courseId }, select: { id: true } });
      if (!course) throw new Error("not_found");

      const last = await tx.courseUnit.findFirst({
        where: { courseId },
        orderBy: [{ sortOrder: "desc" }],
        select: { sortOrder: true },
      });

      const nextSortOrder = (last?.sortOrder ?? 0) + 1;

      // Deterministic-ish id format (keeps parity with lesson ids)
      const id = `${courseId}:unit_${nextSortOrder}`;

      try {
        return await tx.courseUnit.create({
          data: {
            id,
            courseId,
            title,
            sortOrder: nextSortOrder,
          },
          select: { id: true, title: true, sortOrder: true },
        });
      } catch {
        // In the unlikely event of an id collision, fall back to a cuid.
        return await tx.courseUnit.create({
          data: {
            id: `unit_${crypto.randomUUID()}`,
            courseId,
            title,
            sortOrder: nextSortOrder,
          },
          select: { id: true, title: true, sortOrder: true },
        });
      }
    });

    return NextResponse.json({ ok: true, unit });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    if (msg === "not_found") {
      return NextResponse.json({ ok: false, error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: false, error: "Failed to create unit" }, { status: 500 });
  }
}

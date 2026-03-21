import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function isInstructorOrAdmin(role: string | undefined) {
  return role === "instructor" || role === "admin";
}

type PatchUnitBody = {
  title?: string;
};

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ courseId: string; unitId: string }> },
) {
  const session = await getSession();
  if (!session || !isInstructorOrAdmin(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { courseId, unitId } = await ctx.params;

  let body: PatchUnitBody = {};
  try {
    body = (await req.json()) as PatchUnitBody;
  } catch {
    body = {};
  }

  const title = typeof body.title === "string" ? body.title.trim().slice(0, 120) : "";
  if (!title) {
    return NextResponse.json({ ok: false, error: "title is required" }, { status: 400 });
  }

  try {
    const unit = await prisma.courseUnit.findUnique({
      where: { id: unitId },
      select: { id: true, courseId: true },
    });

    if (!unit || unit.courseId !== courseId) {
      return NextResponse.json({ ok: false, error: "Unit not found" }, { status: 404 });
    }

    const updated = await prisma.courseUnit.update({
      where: { id: unitId },
      data: { title },
      select: { id: true, title: true, sortOrder: true },
    });

    return NextResponse.json({ ok: true, unit: updated });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to update unit" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ courseId: string; unitId: string }> },
) {
  const session = await getSession();
  if (!session || !isInstructorOrAdmin(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { courseId, unitId } = await ctx.params;

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const unit = await tx.courseUnit.findUnique({
        where: { id: unitId },
        select: { id: true, courseId: true },
      });

      if (!unit || unit.courseId !== courseId) throw new Error("not_found");

      // Keep lessons, but detach them from this unit.
      await tx.lesson.updateMany({ where: { unitId }, data: { unitId: null } });
      await tx.courseUnit.delete({ where: { id: unitId } });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    if (msg === "not_found") {
      return NextResponse.json({ ok: false, error: "Unit not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: false, error: "Failed to delete unit" }, { status: 500 });
  }
}

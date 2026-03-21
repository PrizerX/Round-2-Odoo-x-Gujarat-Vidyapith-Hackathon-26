import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function isInstructorOrAdmin(role: string | undefined) {
  return role === "instructor" || role === "admin";
}

type PatchLessonBody = {
  title?: string;
  unitId?: string | null;
  description?: string;
  videoUrl?: string;
  durationMinutes?: number;
  allowDownload?: boolean;
};

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ courseId: string; lessonId: string }> },
) {
  const session = await getSession();
  if (!session || !isInstructorOrAdmin(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { courseId, lessonId } = await ctx.params;

  let body: PatchLessonBody = {};
  try {
    body = (await req.json()) as PatchLessonBody;
  } catch {
    body = {};
  }

  const title = typeof body.title === "string" ? body.title.trim().slice(0, 120) : undefined;
  const unitIdRaw =
    body.unitId === null
      ? null
      : typeof body.unitId === "string"
        ? body.unitId.trim().slice(0, 200)
        : undefined;
  const unitId = unitIdRaw === "" ? null : unitIdRaw;
  const description = typeof body.description === "string" ? body.description.trim().slice(0, 2000) : undefined;
  const videoUrl = typeof body.videoUrl === "string" ? body.videoUrl.trim().slice(0, 500) : undefined;
  const durationMinutes =
    typeof body.durationMinutes === "number" && Number.isFinite(body.durationMinutes)
      ? Math.max(0, Math.floor(body.durationMinutes))
      : undefined;
  const allowDownload = typeof body.allowDownload === "boolean" ? body.allowDownload : undefined;

  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const lesson = await tx.lesson.findUnique({
        where: { id: lessonId },
        select: { id: true, courseId: true, type: true, durationMinutes: true },
      });

      if (!lesson || lesson.courseId !== courseId) {
        throw new Error("not_found");
      }

      const course = await tx.course.findUnique({
        where: { id: courseId },
        select: { id: true, durationMinutes: true },
      });
      if (!course) throw new Error("not_found");

      if (typeof unitId === "string") {
        const unit = await tx.courseUnit.findUnique({ where: { id: unitId }, select: { id: true, courseId: true } });
        if (!unit || unit.courseId !== courseId) throw new Error("unit_not_found");
      }

      const oldDuration = lesson.durationMinutes ?? 0;
      const nextDuration = typeof durationMinutes === "number" ? durationMinutes : oldDuration;
      const delta = nextDuration - oldDuration;

      const updated = await tx.lesson.update({
        where: { id: lessonId },
        data: {
          title: typeof title === "string" ? title : undefined,
          unitId: unitId === undefined ? undefined : unitId,
          description: typeof description === "string" ? description : undefined,
          videoUrl:
            lesson.type === "video" || lesson.type === "doc" || lesson.type === "image"
              ? (typeof videoUrl === "string" ? videoUrl : undefined)
              : undefined,
          durationMinutes: typeof durationMinutes === "number" ? (durationMinutes || undefined) : undefined,
          allowDownload: typeof allowDownload === "boolean" ? allowDownload : undefined,
        },
        select: { id: true, title: true, type: true, sortOrder: true },
      });

      if (delta !== 0) {
        await tx.course.update({
          where: { id: courseId },
          data: { durationMinutes: Math.max(0, (course.durationMinutes ?? 0) + delta) },
        });
      }

      return updated;
    });

    return NextResponse.json({ ok: true, lesson: result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    if (msg === "not_found") {
      return NextResponse.json({ ok: false, error: "Lesson not found" }, { status: 404 });
    }
    if (msg === "unit_not_found") {
      return NextResponse.json({ ok: false, error: "Unit not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: false, error: "Failed to update lesson" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ courseId: string; lessonId: string }> },
) {
  const session = await getSession();
  if (!session || !isInstructorOrAdmin(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { courseId, lessonId } = await ctx.params;

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const lesson = await tx.lesson.findUnique({
        where: { id: lessonId },
        select: { id: true, courseId: true, durationMinutes: true },
      });
      if (!lesson || lesson.courseId !== courseId) throw new Error("not_found");

      const course = await tx.course.findUnique({
        where: { id: courseId },
        select: { id: true, lessonCount: true, durationMinutes: true },
      });
      if (!course) throw new Error("not_found");

      const durationToSubtract = lesson.durationMinutes ?? 0;

      await tx.lesson.delete({ where: { id: lessonId } });

      await tx.course.update({
        where: { id: courseId },
        data: {
          lessonCount: Math.max(0, (course.lessonCount ?? 0) - 1),
          durationMinutes: Math.max(0, (course.durationMinutes ?? 0) - durationToSubtract),
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    if (msg === "not_found") {
      return NextResponse.json({ ok: false, error: "Lesson not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: false, error: "Failed to delete lesson" }, { status: 500 });
  }
}

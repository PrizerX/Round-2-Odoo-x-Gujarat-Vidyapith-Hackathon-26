import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function isInstructorOrAdmin(role: string | undefined) {
  return role === "instructor" || role === "admin";
}

type CreateAttachmentBody = {
  kind?: "file" | "link";
  label?: string;
  url?: string;
  allowDownload?: boolean;
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ courseId: string; lessonId: string }> },
) {
  const session = await getSession();
  if (!session || !isInstructorOrAdmin(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { courseId, lessonId } = await ctx.params;

  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        courseId: true,
        attachments: {
          orderBy: [{ createdAt: "asc" }],
          select: { id: true, kind: true, label: true, url: true, allowDownload: true, createdAt: true },
        },
      },
    });

    if (!lesson || lesson.courseId !== courseId) {
      return NextResponse.json({ ok: false, error: "Lesson not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, attachments: lesson.attachments ?? [] });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to load attachments" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ courseId: string; lessonId: string }> },
) {
  const session = await getSession();
  if (!session || !isInstructorOrAdmin(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { courseId, lessonId } = await ctx.params;

  let body: CreateAttachmentBody = {};
  try {
    body = (await req.json()) as CreateAttachmentBody;
  } catch {
    body = {};
  }

  const kind = body.kind === "file" || body.kind === "link" ? body.kind : "link";
  const label = typeof body.label === "string" ? body.label.trim().slice(0, 120) : "";
  const url = typeof body.url === "string" ? body.url.trim().slice(0, 500) : "";
  const allowDownload = typeof body.allowDownload === "boolean" ? body.allowDownload : false;

  if (!url) {
    return NextResponse.json({ ok: false, error: "url is required" }, { status: 400 });
  }

  try {
    const attachment = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const lesson = await tx.lesson.findUnique({ where: { id: lessonId }, select: { id: true, courseId: true } });
      if (!lesson || lesson.courseId !== courseId) throw new Error("not_found");

      return await tx.attachment.create({
        data: {
          lessonId,
          kind,
          label: label || null,
          url,
          allowDownload: !!allowDownload,
        },
        select: { id: true, kind: true, label: true, url: true, allowDownload: true, createdAt: true },
      });
    });

    return NextResponse.json({ ok: true, attachment });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    if (msg === "not_found") {
      return NextResponse.json({ ok: false, error: "Lesson not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: false, error: "Failed to add attachment" }, { status: 500 });
  }
}

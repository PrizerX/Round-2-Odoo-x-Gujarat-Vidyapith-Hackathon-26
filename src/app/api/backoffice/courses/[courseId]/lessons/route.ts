import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function isInstructorOrAdmin(role: string | undefined) {
  return role === "instructor" || role === "admin";
}

type CreateLessonBody = {
  title?: string;
  type?: "video" | "doc" | "image" | "quiz";
  unitId?: string | null;
  description?: string;
  videoUrl?: string;
  durationMinutes?: number;
  allowDownload?: boolean;
};

function safeLessonType(v: unknown): CreateLessonBody["type"] {
  return v === "video" || v === "doc" || v === "image" || v === "quiz" ? v : undefined;
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ courseId: string }> },
) {
  const session = await getSession();
  if (!session || !isInstructorOrAdmin(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await ctx.params;

  let body: CreateLessonBody = {};
  try {
    body = (await req.json()) as CreateLessonBody;
  } catch {
    body = {};
  }

  const title = typeof body.title === "string" ? body.title.trim().slice(0, 120) : "";
  const type = safeLessonType(body.type);
  const unitIdRaw =
    body.unitId === null
      ? null
      : typeof body.unitId === "string"
        ? body.unitId.trim().slice(0, 200)
        : undefined;
  const unitId = unitIdRaw === "" ? null : unitIdRaw;
  const description = typeof body.description === "string" ? body.description.trim().slice(0, 2000) : "";
  const videoUrl = typeof body.videoUrl === "string" ? body.videoUrl.trim().slice(0, 500) : "";
  const durationMinutesRaw = typeof body.durationMinutes === "number" && Number.isFinite(body.durationMinutes)
    ? Math.max(0, Math.floor(body.durationMinutes))
    : 0;
  const allowDownload = typeof body.allowDownload === "boolean" ? body.allowDownload : false;

  if (!title) return NextResponse.json({ ok: false, error: "title is required" }, { status: 400 });
  if (!type) return NextResponse.json({ ok: false, error: "type is required" }, { status: 400 });
  if ((type === "video" || type === "doc" || type === "image") && !videoUrl) {
    return NextResponse.json({ ok: false, error: "url is required for this lesson type" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const course = await tx.course.findUnique({ where: { id: courseId }, select: { id: true, lessonCount: true, durationMinutes: true } });
      if (!course) throw new Error("not_found");

      if (typeof unitId === "string") {
        const unit = await tx.courseUnit.findUnique({ where: { id: unitId }, select: { id: true, courseId: true } });
        if (!unit || unit.courseId !== courseId) throw new Error("unit_not_found");
      }

      const existing = await tx.lesson.findMany({
        where: { courseId },
        select: { id: true, sortOrder: true },
        orderBy: [{ sortOrder: "desc" }],
        take: 50,
      });

      const maxSortOrder = existing.length > 0 ? (existing[0]?.sortOrder ?? 0) : 0;

      // Determine next numeric suffix from ids like `${courseId}:lesson_4`.
      let nextN = 1;
      for (const l of existing) {
        const suffix = l.id.startsWith(`${courseId}:`) ? l.id.slice(`${courseId}:`.length) : l.id;
        const m = /^lesson_(\d+)$/.exec(suffix);
        if (!m) continue;
        const n = Number(m[1]);
        if (Number.isFinite(n) && n >= nextN) nextN = n + 1;
      }

      const lessonId = `${courseId}:lesson_${nextN}`;
      const sortOrder = maxSortOrder + 1;

      const lesson = await tx.lesson.create({
        data: {
          id: lessonId,
          courseId,
          unitId: typeof unitId === "string" ? unitId : null,
          title,
          type,
          sortOrder,
          description,
          videoUrl: type === "video" || type === "doc" || type === "image" ? videoUrl : undefined,
          durationMinutes: durationMinutesRaw || undefined,
          allowDownload: !!allowDownload,
        },
        select: { id: true, title: true, type: true, sortOrder: true },
      });

      let quizId: string | null = null;
      if (type === "quiz") {
        quizId = `quiz_${courseId}_${nextN}`;
        await tx.quiz.create({
          data: {
            id: quizId,
            title: `${title} Quiz`,
            courseId,
            lessonId: lessonId,
            allowMultipleAttempts: true,
            pointsPerCorrect: 5,
            rewardRules: {
              create: [
                { attemptNumber: 1, pointsPerCorrect: 5 },
                { attemptNumber: 2, pointsPerCorrect: 4 },
                { attemptNumber: 3, pointsPerCorrect: 3 },
                { attemptNumber: 4, pointsPerCorrect: 2 },
              ],
            },
            questions: {
              create: [
                {
                  id: `q_${courseId}_${nextN}_1`,
                  prompt: "Which UI element is best for single-choice answers?",
                  sortOrder: 1,
                  options: {
                    create: [
                      { text: "Radio buttons", sortOrder: 1, isCorrect: true },
                      { text: "Checkboxes", sortOrder: 2, isCorrect: false },
                      { text: "File picker", sortOrder: 3, isCorrect: false },
                    ],
                  },
                },
              ],
            },
          },
        });
      }

      const deltaLessons = 1;
      const deltaMinutes = durationMinutesRaw;

      await tx.course.update({
        where: { id: courseId },
        data: {
          lessonCount: Math.max(0, (course.lessonCount ?? 0) + deltaLessons),
          durationMinutes: Math.max(0, (course.durationMinutes ?? 0) + deltaMinutes),
        },
      });

      return { lesson, quizId };
    });

    return NextResponse.json({ ok: true, lesson: result.lesson, quizId: result.quizId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    if (msg === "not_found") {
      return NextResponse.json({ ok: false, error: "Course not found" }, { status: 404 });
    }
    if (msg === "unit_not_found") {
      return NextResponse.json({ ok: false, error: "Unit not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: false, error: "Failed to create lesson" }, { status: 500 });
  }
}

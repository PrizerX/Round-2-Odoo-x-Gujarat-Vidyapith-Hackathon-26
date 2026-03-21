import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getCompletedCourseIds } from "@/lib/learning/completed-courses";
import { toRouteLessonId } from "@/lib/data/db-catalog";

import { LearnerPlayerClient, type PlayerLesson } from "./player-client";

function isBackofficeViewer(role: string | undefined): boolean {
  return role === "instructor" || role === "admin";
}

function buildPlayerLessons(args: {
  courseId: string;
  completionPercent: number;
  units: Array<{ id: string; title: string; sortOrder: number }>;
  rows: Array<{
    id: string;
    title: string;
    type: PlayerLesson["type"];
    description: string | null;
    videoUrl: string | null;
    allowDownload: boolean | null;
    attachments: Array<{
      id: string;
      kind: "file" | "link";
      label: string | null;
      url: string;
      allowDownload: boolean;
      createdAt: Date;
    }>;
    sortOrder: number;
    unitId: string | null;
    quiz: null | {
      id: string;
      title: string;
      allowMultipleAttempts: boolean;
      pointsPerCorrect: number;
      rewardRules: Array<{ attemptNumber: number; pointsPerCorrect: number }>;
      questions: Array<{
        id: string;
        prompt: string;
        allowMultipleCorrect: boolean;
        sortOrder: number;
        options: Array<{ text: string; sortOrder: number; isCorrect: boolean }>;
      }>;
    };
  }>;
}): PlayerLesson[] {
  const safePercent = Math.max(0, Math.min(100, args.completionPercent));
  const completedCount = Math.floor((safePercent / 100) * Math.max(1, args.rows.length));

  const unitById = new Map(args.units.map((u) => [u.id, u] as const));

  return args.rows.map((l, idx) => {
    const unit = l.unitId ? unitById.get(l.unitId) : undefined;
    const quiz = l.quiz
      ? {
          id: l.quiz.id,
          title: l.quiz.title,
          allowMultipleAttempts: l.quiz.allowMultipleAttempts,
          pointsPerCorrect: l.quiz.pointsPerCorrect,
          pointsPerCorrectByAttempt: (l.quiz.rewardRules ?? [])
            .slice()
            .sort((a, b) => a.attemptNumber - b.attemptNumber)
            .map((r) => r.pointsPerCorrect),
          questions: (l.quiz.questions ?? [])
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((q) => {
              const opts = (q.options ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
              const allowMultipleCorrect = !!q.allowMultipleCorrect;
              const correctIndicesRaw = opts
                .map((o, i) => (o.isCorrect ? i : -1))
                .filter((i) => i >= 0);
              const correctIndices = correctIndicesRaw.length > 0 ? correctIndicesRaw : [0];
              return {
                id: q.id,
                prompt: q.prompt,
                options: opts.map((o) => o.text),
                allowMultipleCorrect,
                correctIndices: allowMultipleCorrect ? correctIndices : [correctIndices[0] ?? 0],
              };
            }),
        }
      : undefined;

    return {
      id: toRouteLessonId(args.courseId, l.id),
      title: l.title,
      type: l.type,
      completed: idx + 1 <= completedCount,
      description: l.description ?? undefined,
      videoUrl: l.videoUrl ?? undefined,
      allowDownload: !!l.allowDownload,
      attachments: (l.attachments ?? []).map((a) => ({
        id: a.id,
        kind: a.kind,
        label: a.label ?? null,
        url: a.url,
        allowDownload: !!a.allowDownload,
        createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt),
      })),
      quiz,
      unitId: l.unitId ?? null,
      unitTitle: unit?.title ?? null,
      unitSortOrder: unit?.sortOrder ?? null,
    };
  });
}

export default async function LearnerPlayerPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const session = await getSession();

  if (!session) {
    redirect(
      `/auth/sign-in?next=${encodeURIComponent(`/learn/${courseId}/${lessonId}`)}`,
    );
  }

  const courseRow = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      published: true,
      visibility: true,
      accessRule: true,
    },
  });

  if (!courseRow) redirect("/courses");

  const viewerIsBackoffice = isBackofficeViewer(session.user.role);
  if (!viewerIsBackoffice && !courseRow.published) redirect("/courses");
  if (courseRow.visibility === "signed_in" && !session) redirect("/courses");

  // L3: join is explicit for open courses; enforce server-side.
  let enrolledDb = false;
  let purchasedDb = false;
  try {
    enrolledDb = !!(await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId } },
      select: { id: true },
    }));

    purchasedDb = !!(await prisma.purchase.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId } },
      select: { id: true },
    }));
  } catch {
    // ignore
  }

  const hasAccessViaDb = enrolledDb || purchasedDb;

  if (courseRow.accessRule === "invitation" && !enrolledDb) {
    redirect(`/courses/${courseId}`);
  }
  if (courseRow.accessRule === "payment" && !purchasedDb) {
    redirect(`/courses/${courseId}`);
  }

  if (courseRow.accessRule === "open" && !hasAccessViaDb) {
    redirect(`/courses/${courseId}`);
  }

  let progress: { completionPercent: number; lastLessonId?: string } | null = null;
  try {
    const row = await prisma.courseProgress.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId } },
      select: { completionPercent: true, lastLessonId: true },
    });
    if (row) {
      progress = {
        completionPercent: typeof (row as any).completionPercent === "number" ? (row as any).completionPercent : 0,
        lastLessonId: typeof (row as any).lastLessonId === "string" ? (row as any).lastLessonId : undefined,
      };
    }
  } catch {
    progress = null;
  }
  const completedCourses = await getCompletedCourseIds(session.user.id);
  const completionPercent = completedCourses.has(courseId)
    ? 100
    : (progress?.completionPercent ?? 0);

  const unitRows = await prisma.courseUnit.findMany({
    where: { courseId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, title: true, sortOrder: true },
  });

  const lessonRows = (await prisma.lesson.findMany({
    where: { courseId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      type: true,
      description: true,
      videoUrl: true,
      allowDownload: true,
      attachments: {
        orderBy: [{ createdAt: "asc" }],
        select: { id: true, kind: true, label: true, url: true, allowDownload: true, createdAt: true },
      },
      sortOrder: true,
      unitId: true,
      quiz: {
        select: {
          id: true,
          title: true,
          allowMultipleAttempts: true,
          pointsPerCorrect: true,
          rewardRules: { select: { attemptNumber: true, pointsPerCorrect: true } },
          questions: {
            select: {
              id: true,
              prompt: true,
              allowMultipleCorrect: true,
              sortOrder: true,
              options: { select: { text: true, sortOrder: true, isCorrect: true } },
            },
          },
        },
      },
    },
  })) as unknown as Parameters<typeof buildPlayerLessons>[0]["rows"];

  const lessons = buildPlayerLessons({
    courseId,
    completionPercent,
    units: unitRows,
    rows: lessonRows,
  });

  if (lessons.length === 0) {
    redirect(`/courses/${courseId}`);
  }

  const lessonIds = lessons.map((l) => l.id);
  const boundedLessonId = lessonIds.includes(lessonId) ? lessonId : (lessonIds[0] as string);

  // L3: best-effort DB sync for progress once the learner has joined.
  try {
    const dbCourse = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });

    if (dbCourse) {
      const shouldSync = courseRow.accessRule === "open" ? hasAccessViaDb : true;
      if (!shouldSync) throw new Error("not_joined");

      // Compute progress from completed lessons (index-based; caps at 99; 100 is set on completion).
      const currentIndex = Math.max(0, lessons.findIndex((l) => l.id === boundedLessonId));
      const completedLessons = Math.max(0, Math.min(lessons.length, currentIndex));
      const rawPercent = lessons.length > 0 ? Math.floor((completedLessons / lessons.length) * 100) : 0;
      const computedPercent = Math.max(0, Math.min(99, rawPercent));

      const existing = await prisma.courseProgress.findUnique({
        where: { userId_courseId: { userId: session.user.id, courseId } },
        select: { completionPercent: true, startedAt: true },
      });

      const currentPercent = typeof (existing as any)?.completionPercent === "number"
        ? (existing as any).completionPercent
        : 0;

      const nextPercent = currentPercent >= 100 ? 100 : Math.max(currentPercent, computedPercent);

      await prisma.courseProgress.upsert({
        where: { userId_courseId: { userId: session.user.id, courseId } },
        update: {
          lastLessonId: boundedLessonId,
          completionPercent: nextPercent,
          startedAt: (existing as any)?.startedAt ?? new Date(),
        },
        create: {
          userId: session.user.id,
          courseId,
          completionPercent: nextPercent,
          lastLessonId: boundedLessonId,
          startedAt: new Date(),
        },
      });
    }
  } catch {
    // best-effort; mock + cookie fallback still works
  }

  if (boundedLessonId !== lessonId) {
    redirect(`/learn/${courseId}/${boundedLessonId}`);
  }

  return (
    <LearnerPlayerClient
      courseId={courseId}
      courseTitle={courseRow.title}
      completionPercent={completionPercent}
      lessons={lessons}
      currentLessonId={boundedLessonId}
    />
  );
}

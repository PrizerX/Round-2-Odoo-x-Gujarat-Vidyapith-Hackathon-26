import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { toRouteLessonId } from "@/lib/data/db-catalog";

import {
  BackofficeEditCourseClient,
  type BackofficeCourseEditModel,
  type BackofficeLessonListItem,
  type BackofficeQuizItem,
  type BackofficeUnitListItem,
} from "./edit-course-client";

function isInstructorOrAdmin(role: string | undefined) {
  return role === "instructor" || role === "admin";
}

function isInstructor(role: string | undefined) {
  return role === "instructor";
}

export default async function BackofficeEditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const session = await getSession();
  if (!session || !isInstructorOrAdmin(session.user.role)) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(`/backoffice/courses/${courseId}`)}`);
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      description: true,
      tagsText: true,
      website: true,
      thumbnailUrl: true,
      coverUrl: true,
      bannerUrl: true,
      published: true,
      visibility: true,
      accessRule: true,
      priceInr: true,
      responsibleId: true,
      responsible: { select: { id: true, name: true } },
      courseAdminId: true,
      courseAdmin: { select: { id: true, name: true } },
    },
  });

  if (!course) {
    redirect("/backoffice/courses");
  }

  if (
    isInstructor(session.user.role) &&
    course.responsibleId !== session.user.id &&
    course.courseAdminId !== session.user.id
  ) {
    redirect("/backoffice/courses");
  }

  const lessonsRows = (await prisma.lesson.findMany({
    where: { courseId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, unitId: true, title: true, type: true, sortOrder: true, durationMinutes: true, videoUrl: true, description: true, allowDownload: true },
  })) as unknown as Array<{
    id: string;
    unitId: string | null;
    title: string;
    type: BackofficeLessonListItem["type"];
    sortOrder: number;
    durationMinutes: number | null;
    videoUrl: string | null;
    description: string | null;
    allowDownload: boolean;
  }>;

  const unitsRows = await prisma.courseUnit.findMany({
    where: { courseId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, title: true, sortOrder: true },
  });

  const quizzesRows = await prisma.quiz.findMany({
    where: { courseId },
    orderBy: [{ createdAt: "asc" }],
    select: {
      id: true,
      lessonId: true,
      title: true,
      allowMultipleAttempts: true,
      pointsPerCorrect: true,
      rewardRules: {
        orderBy: [{ attemptNumber: "asc" }],
        select: { attemptNumber: true, pointsPerCorrect: true },
      },
      questions: {
        orderBy: [{ sortOrder: "asc" }],
        select: {
          id: true,
          prompt: true,
          allowMultipleCorrect: true,
          sortOrder: true,
          options: {
            orderBy: [{ sortOrder: "asc" }],
            select: { id: true, text: true, sortOrder: true, isCorrect: true },
          },
        },
      },
    },
  });

  const unitsRowsTyped = unitsRows as unknown as Array<{ id: string; title: string; sortOrder: number }>;
  const quizzesRowsTyped = quizzesRows as unknown as Array<{
    id: string;
    lessonId: string | null;
    title: string;
    allowMultipleAttempts: boolean;
    pointsPerCorrect: number;
    rewardRules: Array<{ attemptNumber: number; pointsPerCorrect: number }>;
    questions: Array<{
      id: string;
      prompt: string;
      allowMultipleCorrect: boolean;
      sortOrder: number;
      options: Array<{ id: string; text: string; sortOrder: number; isCorrect: boolean }>;
    }>;
  }>;

  const model: BackofficeCourseEditModel = {
    id: course.id,
    title: course.title,
    description: course.description ?? "",
    tagsText: course.tagsText ?? "",
    website: course.website ?? null,
    thumbnailUrl: course.thumbnailUrl ?? null,
    coverUrl: course.coverUrl ?? null,
    bannerUrl: course.bannerUrl ?? null,
    published: !!course.published,
    visibility: course.visibility,
    accessRule: course.accessRule,
    priceInr: typeof course.priceInr === "number" ? course.priceInr : null,
    responsibleId: course.responsibleId ?? null,
    responsibleName: course.responsible?.name ?? session.user.name,
    courseAdminId: course.courseAdminId ?? null,
    courseAdminName: course.courseAdmin?.name ?? null,
  };

  const responsibleUsers = await prisma.user.findMany({
    where: { role: "instructor" },
    orderBy: [{ name: "asc" }],
    select: { id: true, name: true, role: true },
  });

  const lessons: BackofficeLessonListItem[] = lessonsRows.map((l) => ({
    id: l.id,
    routeLessonId: toRouteLessonId(courseId, l.id),
    unitId: l.unitId,
    title: l.title,
    type: l.type,
    sortOrder: l.sortOrder,
    durationMinutes: l.durationMinutes,
    videoUrl: l.videoUrl,
    description: l.description,
    allowDownload: !!l.allowDownload,
  }));

  const units: BackofficeUnitListItem[] = unitsRowsTyped.map((u) => ({
    id: u.id,
    title: u.title,
    sortOrder: u.sortOrder,
  }));

  const quizzes: BackofficeQuizItem[] = quizzesRowsTyped.map((q) => ({
    id: q.id,
    lessonId: q.lessonId,
    title: q.title,
    allowMultipleAttempts: q.allowMultipleAttempts,
    pointsPerCorrect: q.pointsPerCorrect,
    rewardRules: q.rewardRules.map((r) => ({
      attemptNumber: r.attemptNumber,
      pointsPerCorrect: r.pointsPerCorrect,
    })),
    questions: q.questions.map((qu) => ({
      id: qu.id,
      prompt: qu.prompt,
      allowMultipleCorrect: !!qu.allowMultipleCorrect,
      sortOrder: qu.sortOrder,
      options: qu.options.map((o) => ({
        id: o.id,
        text: o.text,
        sortOrder: o.sortOrder,
        isCorrect: o.isCorrect,
      })),
    })),
  }));

  return (
    <BackofficeEditCourseClient
      course={model}
      lessons={lessons}
      units={units}
      quizzes={quizzes}
      responsibleUsers={responsibleUsers}
    />
  );
}

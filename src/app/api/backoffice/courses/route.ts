import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function isInstructorOrAdmin(role: string | undefined) {
  return role === "instructor" || role === "admin";
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !isInstructorOrAdmin(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let title: string | undefined;
  try {
    const body = (await req.json()) as unknown;
    if (typeof body === "object" && body && "title" in body) {
      const v = (body as { title?: unknown }).title;
      if (typeof v === "string") title = v;
    }
  } catch {
    // ignore
  }

  const safeTitle = (title ?? "").trim().slice(0, 120);
  if (!safeTitle) {
    return NextResponse.json({ ok: false, error: "title is required" }, { status: 400 });
  }

  const courseId = `course_${crypto.randomUUID().slice(0, 8)}`;

  const placeholderThumb = "/images/courses/course-square.svg";
  const placeholderCover = "/images/covers/course-cover.svg";
  const placeholderBanner = "/images/covers/course-banner.svg";

  await prisma.course.create({
    data: {
      id: courseId,
      title: safeTitle,
      description: "",
      published: false,
      visibility: "everyone",
      accessRule: "open",
      views: 0,
      durationMinutes: 60,
      lessonCount: 4,
      ...(session.user.role === "instructor"
        ? { responsibleId: session.user.id, courseAdminId: session.user.id }
        : { courseAdminId: session.user.id }),
      tagsText: "",
      thumbnailUrl: placeholderThumb,
      coverUrl: placeholderCover,
      bannerUrl: placeholderBanner,
    },
  });

  // Demo content so the learner module can render immediately after publish.
  // Stable lesson IDs are stored as `${courseId}:lesson_N`.
  const lessons = [
    {
      id: `${courseId}:lesson_1`,
      title: "Intro Video",
      type: "video" as const,
      sortOrder: 1,
      description: "Demo video lesson (replace URL later).",
      videoUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
      durationMinutes: 20,
    },
    {
      id: `${courseId}:lesson_2`,
      title: "Document",
      type: "doc" as const,
      sortOrder: 2,
      description: "Demo document lesson (viewer placeholder).",
      videoUrl: null as string | null,
      durationMinutes: 15,
    },
    {
      id: `${courseId}:lesson_3`,
      title: "Deep Dive Video",
      type: "video" as const,
      sortOrder: 3,
      description: "Demo video lesson (replace URL later).",
      videoUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
      durationMinutes: 20,
    },
    {
      id: `${courseId}:lesson_4`,
      title: "Quiz",
      type: "quiz" as const,
      sortOrder: 4,
      description: "Demo quiz lesson.",
      videoUrl: null as string | null,
      durationMinutes: 5,
    },
  ];

  for (const lesson of lessons) {
    await prisma.lesson.create({
      data: {
        id: lesson.id,
        courseId,
        title: lesson.title,
        type: lesson.type,
        sortOrder: lesson.sortOrder,
        description: lesson.description,
        videoUrl: lesson.videoUrl ?? undefined,
        durationMinutes: lesson.durationMinutes,
      },
    });
  }

  const quizLessonId = `${courseId}:lesson_4`;
  const quizId = `quiz_${courseId}`;
  await prisma.quiz.create({
    data: {
      id: quizId,
      title: `${safeTitle} Quiz`,
      courseId,
      lessonId: quizLessonId,
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
            id: `q_${courseId}_1`,
            prompt: "What does course completion percentage represent?",
            sortOrder: 1,
            options: {
              create: [
                { text: "How much of the course content you’ve finished", sortOrder: 1, isCorrect: true },
                { text: "Your device battery level", sortOrder: 2, isCorrect: false },
                { text: "A discount code", sortOrder: 3, isCorrect: false },
              ],
            },
          },
          {
            id: `q_${courseId}_2`,
            prompt: "Why do quizzes often allow multiple attempts?",
            sortOrder: 2,
            options: {
              create: [
                { text: "Encourage retry and learning", sortOrder: 1, isCorrect: true },
                { text: "Remove all questions", sortOrder: 2, isCorrect: false },
                { text: "Disable course access", sortOrder: 3, isCorrect: false },
              ],
            },
          },
        ],
      },
    },
  });

  return NextResponse.json({ ok: true, courseId });
}

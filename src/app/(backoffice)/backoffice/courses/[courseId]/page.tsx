import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { toRouteLessonId } from "@/lib/data/db-catalog";

import {
  BackofficeEditCourseClient,
  type BackofficeCourseEditModel,
  type BackofficeLessonListItem,
} from "./edit-course-client";

function isInstructorOrAdmin(role: string | undefined) {
  return role === "instructor" || role === "admin";
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
      published: true,
      visibility: true,
      accessRule: true,
      priceInr: true,
    },
  });

  if (!course) {
    redirect("/backoffice/courses");
  }

  const lessonsRows = (await prisma.lesson.findMany({
    where: { courseId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, title: true, type: true, sortOrder: true },
  })) as unknown as Array<{
    id: string;
    title: string;
    type: BackofficeLessonListItem["type"];
    sortOrder: number;
  }>;

  const model: BackofficeCourseEditModel = {
    id: course.id,
    title: course.title,
    description: course.description ?? "",
    tagsText: course.tagsText ?? "",
    website: course.website ?? null,
    published: !!course.published,
    visibility: course.visibility,
    accessRule: course.accessRule,
    priceInr: typeof course.priceInr === "number" ? course.priceInr : null,
    responsibleName: session.user.name,
  };

  const lessons: BackofficeLessonListItem[] = lessonsRows.map((l) => ({
    id: l.id,
    routeLessonId: toRouteLessonId(courseId, l.id),
    title: l.title,
    type: l.type,
    sortOrder: l.sortOrder,
  }));

  return <BackofficeEditCourseClient course={model} lessons={lessons} />;
}

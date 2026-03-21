import { prisma } from "@/lib/db/prisma";

import { BackofficeCoursesClient, type BackofficeCourseListItem } from "./courses-client";

function splitTags(tagsText: string | null): string[] {
  if (!tagsText) return [];
  return tagsText
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export default async function BackofficeCoursesPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = props.searchParams ? await props.searchParams : {};
  const qRaw = sp?.q;
  const query = typeof qRaw === "string" ? qRaw.trim().slice(0, 80) : "";

  const newRaw = sp?.new;
  const initialCreateOpen = newRaw === "1" || newRaw === "true";

  const viewRaw = sp?.view;
  const view = viewRaw === "kanban" || viewRaw === "list" ? viewRaw : "list";

  const rows = await prisma.course.findMany({
    where: query ? { title: { contains: query } } : undefined,
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      published: true,
      views: true,
      lessonCount: true,
      durationMinutes: true,
      tagsText: true,
      thumbnailUrl: true,
      coverUrl: true,
      bannerUrl: true,
      updatedAt: true,
    },
  });

  const courses: BackofficeCourseListItem[] = rows.map((c) => ({
    id: c.id,
    title: c.title,
    published: c.published,
    views: c.views,
    lessonCount: c.lessonCount,
    durationMinutes: c.durationMinutes,
    tags: splitTags(c.tagsText),
    thumbnailUrl: c.thumbnailUrl ?? null,
    coverUrl: c.coverUrl ?? null,
    bannerUrl: c.bannerUrl ?? null,
    updatedAt: typeof (c as any).updatedAt === "string" ? (c as any).updatedAt : (c.updatedAt?.toISOString?.() ?? null),
  }));

  return (
    <BackofficeCoursesClient
      courses={courses}
      initialQuery={query}
      initialView={view}
      initialCreateOpen={initialCreateOpen}
    />
  );
}

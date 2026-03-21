import "server-only";

import { prisma } from "@/lib/db/prisma";
import type { Session } from "@/lib/auth/types";
import type { Course, CourseAccessRule, CourseVisibility } from "@/lib/domain/types";

type DbCourseRow = Parameters<typeof mapDbCourseToDomain>[0];

function isBackofficeViewer(session: Session | null): boolean {
  const role = session?.user.role;
  return role === "instructor" || role === "admin";
}

function splitTags(tagsText: string | null | undefined): string[] {
  if (!tagsText) return [];
  return tagsText
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function uniqueStrings(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of values) {
    const key = v.trim();
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function mapDbCourseToDomain(row: {
  id: string;
  title: string;
  description: string;
  tagsText: string | null;
  published: boolean;
  visibility: CourseVisibility;
  accessRule: CourseAccessRule;
  priceInr: number | null;
  views: number;
  durationMinutes: number;
  thumbnailUrl: string | null;
  coverUrl: string | null;
  bannerUrl: string | null;
  lessonCount: number;
  courseTags?: Array<{ tag: { name: string } }>;
  _count?: { lessons: number };
}): Course {
  const tagsFromJoin = (row.courseTags ?? []).map((ct) => ct.tag.name);
  const tagsFromText = splitTags(row.tagsText);
  const tags = uniqueStrings([...tagsFromJoin, ...tagsFromText]);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    tags,
    views: row.views,
    durationMinutes: row.durationMinutes,
    lessonCount: row._count?.lessons ?? row.lessonCount,
    published: row.published,
    visibility: row.visibility,
    accessRule: row.accessRule,
    priceInr: typeof row.priceInr === "number" ? row.priceInr : undefined,
    thumbnailImageUrl: row.thumbnailUrl ?? undefined,
    coverImageUrl: row.coverUrl ?? undefined,
    bannerImageUrl: row.bannerUrl ?? undefined,
  };
}

export async function getCoursesForLearnerCatalog(session: Session | null): Promise<Course[]> {
  const wherePublished = isBackofficeViewer(session) ? undefined : { published: true };
  const whereVisibility = session ? undefined : { visibility: "everyone" as const };

  const rows = (await prisma.course.findMany({
    where: {
      ...(wherePublished ?? {}),
      ...(whereVisibility ?? {}),
    },
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      description: true,
      tagsText: true,
      published: true,
      visibility: true,
      accessRule: true,
      priceInr: true,
      views: true,
      durationMinutes: true,
      lessonCount: true,
      thumbnailUrl: true,
      coverUrl: true,
      bannerUrl: true,
      courseTags: { select: { tag: { select: { name: true } } } },
      _count: { select: { lessons: true } },
    },
  })) as unknown as DbCourseRow[];

  return rows.map((r) => mapDbCourseToDomain(r));
}

export async function getCourseForLearnerById(args: {
  courseId: string;
  session: Session | null;
}): Promise<Course | null> {
  const { courseId, session } = args;

  const wherePublished = isBackofficeViewer(session) ? undefined : { published: true };
  const whereVisibility = session ? undefined : { visibility: "everyone" as const };

  const row = (await prisma.course.findFirst({
    where: {
      id: courseId,
      ...(wherePublished ?? {}),
      ...(whereVisibility ?? {}),
    },
    select: {
      id: true,
      title: true,
      description: true,
      tagsText: true,
      published: true,
      visibility: true,
      accessRule: true,
      priceInr: true,
      views: true,
      durationMinutes: true,
      lessonCount: true,
      thumbnailUrl: true,
      coverUrl: true,
      bannerUrl: true,
      courseTags: { select: { tag: { select: { name: true } } } },
      _count: { select: { lessons: true } },
    },
  })) as unknown as DbCourseRow | null;

  if (!row) return null;
  return mapDbCourseToDomain(row);
}

export type DbCourseLesson = {
  routeLessonId: string;
  title: string;
  type: "video" | "doc" | "image" | "quiz";
  description?: string | null;
  videoUrl?: string | null;
  sortOrder: number;
  durationMinutes?: number | null;
};

export function toRouteLessonId(courseId: string, dbLessonId: string): string {
  const prefix = `${courseId}:`;
  if (dbLessonId.startsWith(prefix)) return dbLessonId.slice(prefix.length);
  return dbLessonId;
}

export async function getCourseLessonsForLearner(args: {
  courseId: string;
  session: Session | null;
}): Promise<DbCourseLesson[] | null> {
  const { courseId, session } = args;

  // Reuse the same visibility/published rules as the course itself.
  const course = await getCourseForLearnerById({ courseId, session });
  if (!course) return null;

  const lessons = (await prisma.lesson.findMany({
    where: { courseId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      type: true,
      sortOrder: true,
      description: true,
      videoUrl: true,
      durationMinutes: true,
    },
  })) as unknown as Array<{
    id: string;
    title: string;
    type: DbCourseLesson["type"];
    sortOrder: number;
    description: string | null;
    videoUrl: string | null;
    durationMinutes: number | null;
  }>;

  return lessons.map((l) => ({
    routeLessonId: toRouteLessonId(courseId, l.id),
    title: l.title,
    type: l.type,
    sortOrder: l.sortOrder,
    description: l.description,
    videoUrl: l.videoUrl,
    durationMinutes: l.durationMinutes,
  }));
}

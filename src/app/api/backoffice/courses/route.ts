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
      durationMinutes: 0,
      lessonCount: 0,
      responsibleId: session.user.id,
      tagsText: "",
      thumbnailUrl: placeholderThumb,
      coverUrl: placeholderCover,
      bannerUrl: placeholderBanner,
    },
  });

  return NextResponse.json({ ok: true, courseId });
}

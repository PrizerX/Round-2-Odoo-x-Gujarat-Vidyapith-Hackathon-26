import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/auth/sign-in", req.url));
  }

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId")?.trim() || "";
  const next = searchParams.get("next")?.trim() || "";

  if (!courseId) {
    return NextResponse.redirect(new URL("/courses", req.url));
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, accessRule: true, published: true },
  });

  // Keep this MVP-safe: only allow joining published + open courses.
  if (!course || !course.published || course.accessRule !== "open") {
    return NextResponse.redirect(new URL(`/courses/${encodeURIComponent(courseId)}`, req.url));
  }

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    update: { status: "enrolled" },
    create: { userId: session.user.id, courseId, status: "enrolled" },
  });

  const redirectTo = next && next.startsWith("/") ? next : `/courses/${courseId}`;
  return NextResponse.redirect(new URL(redirectTo, req.url));
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHENTICATED", redirect: "/auth/sign-in?next=/courses" },
      { status: 401 },
    );
  }

  let courseId = "";
  try {
    const body = (await req.json()) as { courseId?: string };
    courseId = body.courseId?.trim() || "";
  } catch {
    // fall through
  }

  if (!courseId) {
    return NextResponse.json(
      { ok: false, error: "MISSING_COURSE_ID" },
      { status: 400 },
    );
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, accessRule: true, published: true },
  });

  // Keep this MVP-safe: only allow joining published + open courses.
  if (!course || !course.published || course.accessRule !== "open") {
    return NextResponse.json(
      { ok: false, error: "COURSE_NOT_JOINABLE" },
      { status: 403 },
    );
  }

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    update: { status: "enrolled" },
    create: { userId: session.user.id, courseId, status: "enrolled" },
  });

  return NextResponse.json({ ok: true, courseId });
}

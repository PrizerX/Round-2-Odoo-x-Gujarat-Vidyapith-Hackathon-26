import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { COMPLETED_COURSES_COOKIE } from "@/lib/learning/completed-courses";
import { COURSE_POINTS_COOKIE } from "@/lib/learning/points";

function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHENTICATED", redirect: "/auth/sign-in?next=/my-courses" },
      { status: 401 },
    );
  }

  const userExists = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!userExists) {
    return NextResponse.json(
      { ok: false, error: "USER_NOT_FOUND", redirect: "/auth/sign-in?next=/my-courses" },
      { status: 401 },
    );
  }

  let courseId: string | undefined;
  try {
    const body = (await req.json()) as unknown;
    if (typeof body === "object" && body && "courseId" in body) {
      const v = (body as { courseId?: unknown }).courseId;
      if (typeof v === "string") courseId = v.trim();
    }
  } catch {
    // ignore
  }

  if (!courseId) {
    return jsonError("courseId is required", 400);
  }

  const store = await cookies();

  // Clear cookie-backed completion + points.
  const existingRaw = store.get(COMPLETED_COURSES_COOKIE)?.value;
  let ids: string[] = [];
  try {
    const parsed = existingRaw ? JSON.parse(existingRaw) : [];
    ids = Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    ids = [];
  }
  ids = ids.filter((id) => id !== courseId);
  store.set(COMPLETED_COURSES_COOKIE, JSON.stringify(ids), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  const rawPoints = store.get(COURSE_POINTS_COOKIE)?.value;
  let map: Record<string, number> = {};
  try {
    const parsed = rawPoints ? JSON.parse(rawPoints) : {};
    map = typeof parsed === "object" && parsed ? (parsed as Record<string, number>) : {};
  } catch {
    map = {};
  }
  if (courseId in map) {
    delete map[courseId];
    store.set(COURSE_POINTS_COOKIE, JSON.stringify(map), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  // Clear DB-backed learning state + enrollment.
  try {
    const userId = session.user.id;
    await prisma.quizAttempt.deleteMany({ where: { userId, courseId } });
    await prisma.lessonProgress.deleteMany({ where: { userId, lesson: { courseId } } });
    await prisma.courseProgress.deleteMany({ where: { userId, courseId } });
    await prisma.enrollment.deleteMany({ where: { userId, courseId } });
  } catch {
    // best-effort
  }

  return NextResponse.json({ ok: true, courseId });
}

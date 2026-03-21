import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { COMPLETED_COURSES_COOKIE } from "@/lib/learning/completed-courses";
import { COURSE_POINTS_COOKIE } from "@/lib/learning/points";

export async function POST(req: Request) {
  let courseId: string | undefined;
  try {
    const body = (await req.json()) as unknown;
    if (typeof body === "object" && body && "courseId" in body) {
      const v = (body as { courseId?: unknown }).courseId;
      if (typeof v === "string") courseId = v;
    }
  } catch {
    // ignore
  }

  if (!courseId) {
    return NextResponse.json({ ok: false, error: "courseId is required" }, { status: 400 });
  }

  const store = await cookies();

  // Remove completion override.
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

  // Remove earned points for this course.
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

  return NextResponse.json({ ok: true });
}

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { COMPLETED_COURSES_COOKIE } from "@/lib/learning/completed-courses";

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
  const existingRaw = store.get(COMPLETED_COURSES_COOKIE)?.value;

  let ids: string[] = [];
  try {
    const parsed = existingRaw ? JSON.parse(existingRaw) : [];
    ids = Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    ids = [];
  }

  if (!ids.includes(courseId)) ids = [...ids, courseId];

  store.set(COMPLETED_COURSES_COOKIE, JSON.stringify(ids), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return NextResponse.json({ ok: true });
}

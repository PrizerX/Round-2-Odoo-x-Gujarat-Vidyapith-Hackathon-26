import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId")?.trim() || "";
  if (!courseId) return jsonError("courseId is required", 400);

  const exists = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
  if (!exists) return NextResponse.json({ ok: true, reviews: [] });

  const rows = await prisma.review.findMany({
    where: { courseId },
    orderBy: { updatedAt: "desc" },
    include: { user: { select: { id: true, name: true } } },
  });

  const reviews = rows.map((r: any) => ({
    id: r.id,
    courseId: r.courseId,
    userId: r.userId,
    userName: r.user.name,
    rating: r.rating,
    text: r.text,
    createdAt: r.createdAt.getTime(),
  }));

  return NextResponse.json({ ok: true, reviews });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return jsonError("Unauthenticated", 401);

  let courseId = "";
  let rating: number | null = null;
  let text = "";

  try {
    const body = (await req.json()) as unknown;
    if (typeof body === "object" && body) {
      const c = (body as { courseId?: unknown }).courseId;
      const r = (body as { rating?: unknown }).rating;
      const t = (body as { text?: unknown }).text;
      if (typeof c === "string") courseId = c.trim();
      if (typeof r === "number" && Number.isFinite(r)) rating = r;
      if (typeof t === "string") text = t;
    }
  } catch {
    // ignore
  }

  if (!courseId) return jsonError("courseId is required", 400);
  if (rating === null) return jsonError("rating is required", 400);

  const safeRating = Math.max(1, Math.min(5, Math.round(rating)));
  const safeText = text.trim().slice(0, 1000);
  if (!safeText) return jsonError("text is required", 400);

  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
  if (!course) return jsonError("Course not found in DB", 404);

  const review = await prisma.review.upsert({
    where: { courseId_userId: { courseId, userId: session.user.id } },
    update: { rating: safeRating, text: safeText },
    create: { courseId, userId: session.user.id, rating: safeRating, text: safeText },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json({
    ok: true,
    review: {
      id: review.id,
      courseId: review.courseId,
      userId: review.userId,
      userName: review.user.name,
      rating: review.rating,
      text: review.text,
      createdAt: review.createdAt.getTime(),
    },
  });
}

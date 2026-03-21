import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function isInstructorOrAdmin(role: string | undefined) {
  return role === "instructor" || role === "admin";
}

type PatchBody = {
  title?: string;
  description?: string;
  tagsText?: string;
  website?: string | null;
  published?: boolean;
  visibility?: "everyone" | "signed_in";
  accessRule?: "open" | "invitation" | "payment";
  priceInr?: number | null;
};

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ courseId: string }> },
) {
  const session = await getSession();
  if (!session || !isInstructorOrAdmin(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await ctx.params;

  let body: PatchBody = {};
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    body = {};
  }

  const update: Record<string, unknown> = {};

  if (typeof body.title === "string") update.title = body.title.trim().slice(0, 120);
  if (typeof body.description === "string") update.description = body.description.trim().slice(0, 2000);
  if (typeof body.tagsText === "string") update.tagsText = body.tagsText.trim().slice(0, 500);

  if (body.website === null) update.website = null;
  if (typeof body.website === "string") update.website = body.website.trim().slice(0, 240);

  if (typeof body.published === "boolean") update.published = body.published;

  if (body.visibility === "everyone" || body.visibility === "signed_in") update.visibility = body.visibility;
  if (body.accessRule === "open" || body.accessRule === "invitation" || body.accessRule === "payment") {
    update.accessRule = body.accessRule;
  }

  if (typeof body.priceInr === "number" && Number.isFinite(body.priceInr)) {
    update.priceInr = Math.max(0, Math.floor(body.priceInr));
  }
  if (body.priceInr === null) update.priceInr = null;

  // If switching away from payment, clear price.
  if (update.accessRule && update.accessRule !== "payment") {
    update.priceInr = null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: false, error: "No fields to update" }, { status: 400 });
  }

  try {
    const updated = await prisma.course.update({
      where: { id: courseId },
      data: update,
      select: {
        id: true,
        title: true,
        published: true,
        visibility: true,
        accessRule: true,
        priceInr: true,
      },
    });

    return NextResponse.json({ ok: true, course: updated });
  } catch {
    return NextResponse.json({ ok: false, error: "Course not found" }, { status: 404 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ courseId: string }> },
) {
  const session = await getSession();
  if (!session || !isInstructorOrAdmin(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await ctx.params;

  try {
    await prisma.course.delete({ where: { id: courseId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Course not found" }, { status: 404 });
  }
}

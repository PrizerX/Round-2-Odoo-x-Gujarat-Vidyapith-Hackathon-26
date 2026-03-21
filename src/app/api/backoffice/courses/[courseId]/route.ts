import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function isInstructorOrAdmin(role: string | undefined) {
  return role === "instructor" || role === "admin";
}

async function assertCourseAccess(args: {
  courseId: string;
  user: { id: string; role: string };
}): Promise<"ok" | "not_found" | "forbidden"> {
  const course = await prisma.course.findUnique({
    where: { id: args.courseId },
    select: { id: true, responsibleId: true, courseAdminId: true },
  });
  if (!course) return "not_found";
  if (args.user.role === "admin") return "ok";
  const owns = course.responsibleId === args.user.id || course.courseAdminId === args.user.id;
  return owns ? "ok" : "forbidden";
}

type PatchBody = {
  title?: string;
  description?: string;
  tagsText?: string;
  website?: string | null;
  thumbnailUrl?: string | null;
  coverUrl?: string | null;
  bannerUrl?: string | null;
  responsibleId?: string | null;
  courseAdminId?: string | null;
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

  const access = await assertCourseAccess({ courseId, user: session.user });
  if (access === "not_found") {
    return NextResponse.json({ ok: false, error: "Course not found" }, { status: 404 });
  }
  if (access === "forbidden") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

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

  if (body.thumbnailUrl === null) update.thumbnailUrl = null;
  if (typeof body.thumbnailUrl === "string") update.thumbnailUrl = body.thumbnailUrl.trim().slice(0, 500);

  if (body.coverUrl === null) update.coverUrl = null;
  if (typeof body.coverUrl === "string") update.coverUrl = body.coverUrl.trim().slice(0, 500);

  if (body.bannerUrl === null) update.bannerUrl = null;
  if (typeof body.bannerUrl === "string") update.bannerUrl = body.bannerUrl.trim().slice(0, 500);

  if (body.responsibleId === null) {
    update.responsibleId = null;
  }
  if (typeof body.responsibleId === "string") {
    const responsibleId = body.responsibleId.trim().slice(0, 80);
    if (!responsibleId) {
      update.responsibleId = null;
    } else {
      const u = await prisma.user.findUnique({
        where: { id: responsibleId },
        select: { id: true, role: true },
      });
      if (!u || (u.role !== "instructor" && u.role !== "admin")) {
        return NextResponse.json(
          { ok: false, error: "Invalid responsible user" },
          { status: 400 },
        );
      }
      update.responsibleId = u.id;
    }
  }

  if (body.courseAdminId === null) {
    update.courseAdminId = null;
  }
  if (typeof body.courseAdminId === "string") {
    const courseAdminId = body.courseAdminId.trim().slice(0, 80);
    if (!courseAdminId) {
      update.courseAdminId = null;
    } else {
      const u = await prisma.user.findUnique({
        where: { id: courseAdminId },
        select: { id: true, role: true },
      });
      if (!u || (u.role !== "instructor" && u.role !== "admin")) {
        return NextResponse.json(
          { ok: false, error: "Invalid course admin user" },
          { status: 400 },
        );
      }
      update.courseAdminId = u.id;
    }
  }

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

  const access = await assertCourseAccess({ courseId, user: session.user });
  if (access === "not_found") {
    return NextResponse.json({ ok: false, error: "Course not found" }, { status: 404 });
  }
  if (access === "forbidden") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.course.delete({ where: { id: courseId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Course not found" }, { status: 404 });
  }
}

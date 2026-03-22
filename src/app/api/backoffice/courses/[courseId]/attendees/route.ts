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

type InviteBody = {
  userIds?: unknown;
  status?: unknown;
};

type RemoveBody = {
  userId?: unknown;
};

export async function GET(req: Request, ctx: { params: Promise<{ courseId: string }> }) {
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

  const url = new URL(req.url);
  const eligible = url.searchParams.get("eligible") === "1";
  const q = (url.searchParams.get("q") ?? "").trim();

  if (eligible) {
    const existing = await prisma.enrollment.findMany({
      where: { courseId },
      select: { userId: true },
    });
    const existingSet = new Set(existing.map((e) => e.userId));

    const users = await prisma.user.findMany({
      where: {
        role: "learner",
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { email: { contains: q } },
              ],
            }
          : null),
      },
      select: { id: true, name: true, email: true },
      take: 25,
      orderBy: { createdAt: "desc" },
    });

    const eligibleUsers = users.filter((u) => !existingSet.has(u.id));
    return NextResponse.json({ ok: true, users: eligibleUsers });
  }

  const status = url.searchParams.get("status");
  const statusFilter = status === "invited" || status === "enrolled" ? status : null;

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId, ...(statusFilter ? { status: statusFilter } : null) },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    attendees: enrollments.map((e) => ({
      enrollmentId: e.id,
      userId: e.userId,
      status: e.status,
      invitedById: e.invitedById,
      createdAt: e.createdAt.toISOString(),
      user: {
        id: e.user.id,
        name: e.user.name,
        email: e.user.email,
        role: e.user.role,
      },
    })),
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ courseId: string }> }) {
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

  let body: InviteBody = {};
  try {
    body = (await req.json()) as InviteBody;
  } catch {
    body = {};
  }

  const userIds = Array.isArray(body.userIds)
    ? body.userIds.filter((x) => typeof x === "string")
    : [];

  if (userIds.length === 0) {
    return NextResponse.json({ ok: false, error: "No users selected" }, { status: 400 });
  }
  if (userIds.length > 200) {
    return NextResponse.json({ ok: false, error: "Too many users selected" }, { status: 400 });
  }

  const desiredStatus = body.status === "enrolled" ? "enrolled" : "invited";

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, role: true },
  });

  const bad = users.filter((u) => u.role !== "learner").map((u) => u.id);
  const foundSet = new Set(users.map((u) => u.id));
  const missing = userIds.filter((id) => !foundSet.has(id));

  if (missing.length > 0) {
    return NextResponse.json({ ok: false, error: "Some users were not found", missing }, { status: 400 });
  }
  if (bad.length > 0) {
    return NextResponse.json({ ok: false, error: "Only learners can be invited", bad }, { status: 400 });
  }

  await prisma.$transaction(
    userIds.map((userId) =>
      prisma.enrollment.upsert({
        where: { userId_courseId: { userId, courseId } },
        update: {
          status: desiredStatus,
          invitedById: session.user.id,
        },
        create: {
          userId,
          courseId,
          status: desiredStatus,
          invitedById: session.user.id,
        },
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ courseId: string }> }) {
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

  let body: RemoveBody = {};
  try {
    body = (await req.json()) as RemoveBody;
  } catch {
    body = {};
  }

  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Missing userId" }, { status: 400 });
  }

  await prisma.enrollment.delete({
    where: { userId_courseId: { userId, courseId } },
  });

  return NextResponse.json({ ok: true });
}

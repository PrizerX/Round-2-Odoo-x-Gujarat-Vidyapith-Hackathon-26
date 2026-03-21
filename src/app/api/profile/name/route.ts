import { NextResponse } from "next/server";

import { serializeSession, SESSION_COOKIE_NAME, getSession } from "@/lib/auth/session";
import type { Session } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";

function normalizeName(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.trim().replace(/\s+/g, " ");
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { name?: unknown } | null;
  const name = normalizeName(body?.name);

  if (name.length < 2) {
    return NextResponse.json({ ok: false, error: "Name must be at least 2 characters." }, { status: 400 });
  }
  if (name.length > 60) {
    return NextResponse.json({ ok: false, error: "Name must be 60 characters or less." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name },
  });

  const nextSession: Session = {
    ...session,
    user: {
      ...session.user,
      name,
    },
  };

  const res = NextResponse.json({ ok: true, name });
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: serializeSession(nextSession),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

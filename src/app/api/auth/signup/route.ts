import { NextResponse } from "next/server";

import bcrypt from "bcryptjs";

import { validatePassword } from "@/lib/auth/password-policy";
import { serializeSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import type { Session, UserRole } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | {
        name?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
        role?: UserRole;
      }
    | null;

  const name = (body?.name ?? "").trim();
  const email = (body?.email ?? "").trim().toLowerCase();
  const password = body?.password ?? "";
  const confirmPassword = body?.confirmPassword ?? "";
  const role = body?.role ?? "learner";

  if (!name || !email || !password || !confirmPassword) {
    return NextResponse.json(
      { error: "All fields are required." },
      { status: 400 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: "Passwords do not match." },
      { status: 400 },
    );
  }

  const policy = validatePassword(password);
  if (!policy.ok) {
    return NextResponse.json(
      { error: policy.issues.join(" ") },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      role,
      passwordHash,
    },
  });

  const session: Session = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };

  const res = NextResponse.json({ ok: true, session });
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: serializeSession(session),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

import { NextResponse } from "next/server";

import { MOCK_USERS } from "@/lib/auth/mock-users";
import { serializeSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import type { Session } from "@/lib/auth/types";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;

  const email = body?.email?.trim().toLowerCase();
  const password = body?.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const user = MOCK_USERS.find((u) => u.email.toLowerCase() === email);
  if (!user || user.password !== password) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const session: Session = {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
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

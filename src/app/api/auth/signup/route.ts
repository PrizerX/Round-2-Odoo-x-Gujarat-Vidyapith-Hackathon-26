import { NextResponse } from "next/server";

import { validatePassword } from "@/lib/auth/password-policy";
import { serializeSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import type { Session, UserRole } from "@/lib/auth/types";

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

  // Prototype behavior: we don't persist users yet (Supabase will handle that).
  // We still create a session so flows can be tested end-to-end.
  const session: Session = {
    user: {
      id: `u_${role}_${Date.now()}`,
      email,
      name,
      role,
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

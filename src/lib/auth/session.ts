import { cookies } from "next/headers";

import type { Session, SessionUser } from "@/lib/auth/types";

export const SESSION_COOKIE_NAME = "learnova_session";

function encodeBase64Json(value: unknown): string {
  const json = JSON.stringify(value);
  return Buffer.from(json, "utf8").toString("base64url");
}

function decodeBase64Json<T>(value: string): T | null {
  try {
    const json = Buffer.from(value, "base64url").toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function serializeSession(session: Session): string {
  return encodeBase64Json(session);
}

export function parseSession(value: string | undefined): Session | null {
  if (!value) return null;
  const parsed = decodeBase64Json<Session>(value);
  if (!parsed?.user?.id || !parsed.user.email || !parsed.user.role) return null;
  return parsed;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return parseSession(value);
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  return session;
}

export function safeUserFromSession(session: Session): SessionUser {
  return session.user;
}

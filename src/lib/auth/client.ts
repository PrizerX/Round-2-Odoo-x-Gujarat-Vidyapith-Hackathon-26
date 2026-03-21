import type { Session } from "@/lib/auth/types";

function getErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  if ("error" in payload && typeof (payload as { error?: unknown }).error === "string") {
    return (payload as { error: string }).error;
  }
  return null;
}

export async function fetchSession(): Promise<Session | null> {
  const res = await fetch("/api/auth/me", { cache: "no-store" });
  if (!res.ok) return null;
  const data = (await res.json()) as { session: Session | null };
  return data.session;
}

export async function login(email: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getErrorMessage(data) ?? "Login failed.");
  return data as { ok: true; session: Session };
}

export async function signup(payload: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "learner" | "instructor";
}) {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getErrorMessage(data) ?? "Signup failed.");
  return data as { ok: true; session: Session };
}

export async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
}

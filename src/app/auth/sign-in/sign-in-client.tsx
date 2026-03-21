"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/auth/client";

function redirectForRole(role: string): string {
  if (role === "instructor" || role === "admin") return "/backoffice/courses";
  return "/courses";
}

export function SignInClient({ next }: { next?: string }) {
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [forgotOpen, setForgotOpen] = React.useState(false);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-slate-50 text-foreground">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-rose-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-10 h-64 w-64 rounded-full bg-sky-200/70 blur-3xl" />
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-2xl items-center px-6 py-10">
        <div className="w-full space-y-6">
          <div className="mb-5 flex justify-center">
            <Image
              src="/images/LN_Horiz.png"
              alt="Learnova"
              width={320}
              height={72}
              priority
              className="h-14 w-auto"
            />
          </div>

          <Card className="w-full">
            <CardHeader>
              <div>
                <CardTitle>Sign in</CardTitle>
                <div className="text-sm text-muted">Continue to Learnova</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <Button
                onClick={async () => {
                  try {
                    setError(null);
                    setBusy(true);
                    const result = await login(email, password);
                    const destination = next || redirectForRole(result.session.user.role);
                    router.push(destination);
                    router.refresh();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Invalid email or password");
                  } finally {
                    setBusy(false);
                  }
                }}
                disabled={busy}
              >
                {busy ? "Signing in..." : "Sign in"}
              </Button>

              <button
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => setForgotOpen(true)}
                type="button"
              >
                Forgot password?
              </button>
            </div>

            <div className="text-sm text-muted">
              Don’t have an account?{" "}
              <Link
                className="font-medium text-primary hover:underline"
                href={next ? `/auth/sign-up?next=${encodeURIComponent(next)}` : "/auth/sign-up"}
              >
                Sign up
              </Link>
            </div>
            </CardContent>
          </Card>

          <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-center shadow-sm backdrop-blur">
            <div className="text-sm font-semibold text-slate-900">Learnova for Odoo learners</div>
            <p className="mt-1 text-sm text-muted">
              Short, guided lessons with progress tracking, quizzes, and course goals built for busy teams.
            </p>
            <div className="mt-3 grid gap-2 text-left text-xs text-slate-600 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200/70 bg-white/80 px-3 py-2">Skill tracks in minutes</div>
              <div className="rounded-lg border border-slate-200/70 bg-white/80 px-3 py-2">Quizzes with points</div>
              <div className="rounded-lg border border-slate-200/70 bg-white/80 px-3 py-2">Progress you can share</div>
            </div>
            <Link href="/courses" className="mt-3 inline-flex">
              <Button size="sm" className="px-5">
                Explore courses
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={forgotOpen}
        onOpenChange={setForgotOpen}
        title="Forgot password"
        description="Password reset is not implemented in the mock auth prototype yet."
        confirmText="Okay"
        cancelText="Close"
        danger={false}
        onConfirm={() => setForgotOpen(false)}
      />
    </div>
  );
}

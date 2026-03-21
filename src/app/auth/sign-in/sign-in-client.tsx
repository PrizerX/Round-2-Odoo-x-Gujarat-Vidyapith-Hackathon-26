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
  if (role === "instructor" || role === "admin") return "/backoffice";
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
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl items-center px-6 py-10">
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[12px] border border-border bg-surface">
                <Image src="/logo-placeholder.svg" alt="Learnova logo" width={34} height={34} />
              </div>
              <div>
                <CardTitle>Sign in</CardTitle>
                <div className="text-sm text-muted">Continue to Learnova</div>
              </div>
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

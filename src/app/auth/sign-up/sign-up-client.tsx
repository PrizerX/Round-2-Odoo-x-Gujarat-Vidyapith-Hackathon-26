"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup } from "@/lib/auth/client";

function redirectForRole(role: string): string {
  if (role === "instructor" || role === "admin") return "/backoffice";
  return "/courses";
}

export function SignUpClient({ next }: { next?: string }) {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [role, setRole] = React.useState<"learner" | "instructor">("learner");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl items-center px-6 py-10">
        <div className="w-full">
          <div className="mb-5 flex justify-center">
            <Image
              src="/images/LN_Horiz.png"
              alt="Learnova"
              width={260}
              height={56}
              priority
              className="h-10 w-auto"
            />
          </div>

          <Card className="w-full">
            <CardHeader>
              <div>
                <CardTitle>Sign up</CardTitle>
                <div className="text-sm text-muted">Create your Learnova account</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Enter Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Enter Email Id</Label>
              <Input
                id="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Create Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <div className="text-xs text-muted">
                Password must include uppercase, lowercase, number, and symbol.
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">Role</div>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="role"
                    value="learner"
                    checked={role === "learner"}
                    onChange={() => setRole("learner")}
                  />
                  Learner
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="role"
                    value="instructor"
                    checked={role === "instructor"}
                    onChange={() => setRole("instructor")}
                  />
                  Instructor
                </label>
              </div>
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
                    if (password !== confirmPassword) {
                      throw new Error("Passwords do not match");
                    }
                    setBusy(true);
                    const result = await signup({
                      name,
                      email,
                      password,
                      confirmPassword,
                      role,
                    });
                    const destination = next || redirectForRole(result.session.user.role);
                    router.push(destination);
                    router.refresh();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Could not sign up");
                  } finally {
                    setBusy(false);
                  }
                }}
                disabled={busy}
              >
                {busy ? "Creating..." : "Create account"}
              </Button>

              <Link
                className="text-sm font-medium text-primary hover:underline"
                href={next ? `/auth/sign-in?next=${encodeURIComponent(next)}` : "/auth/sign-in"}
              >
                Already have an account?
              </Link>
            </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

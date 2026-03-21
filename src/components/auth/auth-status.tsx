"use client";

import Link from "next/link";
import * as React from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import { fetchSession } from "@/lib/auth/client";
import type { Session } from "@/lib/auth/types";

export function AuthStatus() {
  const [session, setSession] = React.useState<Session | null>(null);

  React.useEffect(() => {
    let mounted = true;
    fetchSession()
      .then((s) => {
        if (mounted) setSession(s);
      })
      .catch(() => {
        if (mounted) setSession(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (!session?.user) {
    return (
      <Link
        href="/auth/sign-in"
        className="rounded-[10px] px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm">
        <div className="font-medium leading-5">{session.user.name}</div>
        <div className="text-xs opacity-80">{session.user.role}</div>
      </div>
      <LogoutButton variant="ghost" />
    </div>
  );
}

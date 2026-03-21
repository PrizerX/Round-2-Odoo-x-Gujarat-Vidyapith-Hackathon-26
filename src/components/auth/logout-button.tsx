"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth/client";

export function LogoutButton({
  variant = "secondary",
  redirectTo = "/auth/sign-in",
}: {
  variant?: "secondary" | "ghost";
  redirectTo?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  return (
    <Button
      variant={variant}
      size="sm"
      disabled={busy}
      onClick={async () => {
        try {
          setBusy(true);
          await logout();
          router.push(redirectTo);
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Signing out..." : "Logout"}
    </Button>
  );
}

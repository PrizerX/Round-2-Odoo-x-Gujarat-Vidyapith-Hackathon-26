import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";

import { LogoutButton } from "@/components/auth/logout-button";
import { getSession } from "@/lib/auth/session";

export default async function BackofficeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  if (!session) redirect("/auth/sign-in?next=/backoffice");
  if (session.user.role !== "instructor" && session.user.role !== "admin") {
    redirect("/courses");
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/backoffice" className="flex items-center" aria-label="Backoffice home">
              <Image
                src="/images/LN_Horiz.png"
                alt="Learnova"
                width={180}
                height={40}
                priority
                className="h-7 w-auto"
              />
            </Link>

            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/backoffice/courses"
                className="rounded-[10px] border border-border bg-background px-3 py-2 hover:bg-accent"
              >
                Courses
              </Link>
              <Link
                href="/backoffice/reports"
                className="rounded-[10px] border border-border bg-background px-3 py-2 hover:bg-accent"
              >
                Reporting
              </Link>
              {session.user.role === "admin" ? (
                <Link
                  href="/backoffice/settings"
                  className="rounded-[10px] border border-border bg-background px-3 py-2 hover:bg-accent"
                >
                  Settings
                </Link>
              ) : (
                <span
                  className="cursor-not-allowed rounded-[10px] border border-border bg-background px-3 py-2 text-muted opacity-60"
                  aria-disabled="true"
                  title="Admins only"
                >
                  Settings
                </span>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium leading-5">{session.user.name}</div>
              <div className="text-xs text-muted">{session.user.role}</div>
            </div>
            <LogoutButton variant="secondary" redirectTo="/auth/sign-in" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-6">{children}</main>
    </div>
  );
}

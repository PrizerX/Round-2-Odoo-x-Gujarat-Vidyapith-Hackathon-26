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
    <div className="flex min-h-[100dvh] bg-background text-foreground">
      <aside className="w-64 shrink-0 bg-primary text-white">
        <div className="px-5 py-4 border-b border-white/15">
          <Link href="/backoffice" className="flex items-center" aria-label="Backoffice home">
            <Image
              src="/images/LN_Horiz_white.png"
              alt="Learnova"
              width={180}
              height={40}
              priority
              className="h-7 w-auto"
            />
          </Link>
          <div className="text-xs opacity-80">Backoffice</div>
        </div>
        <div className="px-5 py-3 border-b border-white/15">
          <div className="text-sm font-medium leading-5">{session.user.name}</div>
          <div className="text-xs opacity-80">{session.user.role}</div>
          <div className="mt-3">
            <LogoutButton variant="ghost" redirectTo="/auth/sign-in" />
          </div>
        </div>
        <nav className="px-3 py-3 text-sm">
          <Link
            href="/backoffice/courses"
            className="block rounded-[10px] px-3 py-2 hover:bg-white/10"
          >
            Courses
          </Link>
          <Link
            href="/backoffice/reports"
            className="mt-1 block rounded-[10px] px-3 py-2 hover:bg-white/10"
          >
            Reports
          </Link>
          <Link
            href="/courses"
            className="mt-1 block rounded-[10px] px-3 py-2 hover:bg-white/10"
          >
            Learner Site
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

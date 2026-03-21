import Link from "next/link";

import { AuthStatus } from "@/components/auth/auth-status";

export default function LearnerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      <header className="bg-primary text-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold">
            Learnova
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/courses" className="rounded-[10px] px-3 py-2 hover:bg-white/10">
              Courses
            </Link>
            <Link
              href="/backoffice/courses"
              className="rounded-[10px] px-3 py-2 hover:bg-white/10"
            >
              Backoffice
            </Link>
            <div className="ml-2">
              <AuthStatus />
            </div>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        {children}
      </main>
    </div>
  );
}

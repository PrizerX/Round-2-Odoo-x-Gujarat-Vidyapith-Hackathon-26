import Link from "next/link";
import Image from "next/image";

import { AuthStatus } from "@/components/auth/auth-status";

export default function LearnerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      <header className="bg-primary text-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 2xl:max-w-[1400px]">
          <Link href="/" className="flex items-center" aria-label="Home">
            <Image
              src="/images/LN_Horiz_white.png"
              alt="Learnova"
              width={180}
              height={40}
              priority
              className="h-8 w-auto"
            />
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/courses" className="rounded-[10px] px-3 py-2 hover:bg-white/10">
              Courses
            </Link>
            <Link
              href="/my-courses"
              className="rounded-[10px] px-3 py-2 hover:bg-white/10"
            >
              My Courses
            </Link>
            <Link
              href="/profile"
              className="rounded-[10px] px-3 py-2 hover:bg-white/10"
            >
              Profile
            </Link>
            <div className="ml-2">
              <AuthStatus />
            </div>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-6 2xl:max-w-[1400px]">
        {children}
      </main>
    </div>
  );
}

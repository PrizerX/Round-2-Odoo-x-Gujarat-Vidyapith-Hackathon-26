import { redirect } from "next/navigation";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const sp = await searchParams;
  const next = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  if (next) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(next)}`);
  }
  redirect("/auth/sign-in");
}

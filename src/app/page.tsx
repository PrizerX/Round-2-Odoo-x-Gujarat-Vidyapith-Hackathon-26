import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/auth/sign-in");

  if (session.user.role === "instructor" || session.user.role === "admin") {
    redirect("/backoffice");
  }

  redirect("/courses");
}

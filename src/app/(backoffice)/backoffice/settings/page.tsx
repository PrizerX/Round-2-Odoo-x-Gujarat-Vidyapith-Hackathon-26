import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

import { BackofficeSettingsClient, type SettingsUserRow } from "./settings-client";

export default async function BackofficeSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/auth/sign-in?next=/backoffice/settings");

  const isAdmin = session.user.role === "admin";
  if (!isAdmin) redirect("/backoffice/courses");

  const users = isAdmin
    ? await prisma.user.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 500,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      })
    : [];

  const userRows: SettingsUserRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <BackofficeSettingsClient
      currentUser={{ id: session.user.id, name: session.user.name, role: session.user.role }}
      users={userRows}
    />
  );
}

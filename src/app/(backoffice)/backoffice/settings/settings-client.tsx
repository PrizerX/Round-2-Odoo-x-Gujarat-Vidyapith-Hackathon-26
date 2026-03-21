"use client";

import * as React from "react";
import { Ban, ShieldAlert, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

export type SettingsUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string; // ISO
};

type LocalUserFlag = {
  suspended?: boolean;
  banned?: boolean;
  note?: string;
  updatedAt?: string;
};

const USER_FLAGS_KEY = "learnova_user_flags_v1";
const GENERAL_SETTINGS_KEY = "learnova_general_settings_v1";

type GeneralSettings = {
  platformName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  allowGuestBrowsing: boolean;
  defaultCourseVisibility: "everyone" | "signed_in";
};

function loadGeneralSettings(): GeneralSettings {
  const defaults: GeneralSettings = {
    platformName: "Learnova",
    supportEmail: "support@learnova.dev",
    maintenanceMode: false,
    allowGuestBrowsing: true,
    defaultCourseVisibility: "everyone",
  };

  try {
    const raw = window.localStorage.getItem(GENERAL_SETTINGS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || !parsed) return defaults;

    const obj = parsed as Record<string, unknown>;
    const next = { ...defaults };
    if (typeof obj.platformName === "string") next.platformName = obj.platformName.slice(0, 60);
    if (typeof obj.supportEmail === "string") next.supportEmail = obj.supportEmail.slice(0, 120);
    if (typeof obj.maintenanceMode === "boolean") next.maintenanceMode = obj.maintenanceMode;
    if (typeof obj.allowGuestBrowsing === "boolean") next.allowGuestBrowsing = obj.allowGuestBrowsing;
    if (obj.defaultCourseVisibility === "everyone" || obj.defaultCourseVisibility === "signed_in") {
      next.defaultCourseVisibility = obj.defaultCourseVisibility;
    }
    return next;
  } catch {
    return defaults;
  }
}

function saveGeneralSettings(s: GeneralSettings) {
  try {
    window.localStorage.setItem(GENERAL_SETTINGS_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

function loadUserFlags(): Record<string, LocalUserFlag> {
  try {
    const raw = window.localStorage.getItem(USER_FLAGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || !parsed) return {};
    return parsed as Record<string, LocalUserFlag>;
  } catch {
    return {};
  }
}

function saveUserFlags(flags: Record<string, LocalUserFlag>) {
  try {
    window.localStorage.setItem(USER_FLAGS_KEY, JSON.stringify(flags));
  } catch {
    // ignore
  }
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()] ?? "";
  const day = String(d.getUTCDate()).padStart(2, "0");
  return m ? `${m} ${day}` : "—";
}

export function BackofficeSettingsClient(props: {
  currentUser: { id: string; name: string; role: string };
  users: SettingsUserRow[];
}) {
  const isAdmin = props.currentUser.role === "admin";

  const [general, setGeneral] = React.useState<GeneralSettings | null>(null);
  const [userFlags, setUserFlags] = React.useState<Record<string, LocalUserFlag>>({});

  const [query, setQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<"all" | "learner" | "instructor" | "admin">("all");

  const [banTarget, setBanTarget] = React.useState<null | SettingsUserRow>(null);
  const [unbanTarget, setUnbanTarget] = React.useState<null | SettingsUserRow>(null);

  React.useEffect(() => {
    setGeneral(loadGeneralSettings());
    setUserFlags(loadUserFlags());
  }, []);

  React.useEffect(() => {
    if (!general) return;
    saveGeneralSettings(general);
  }, [general]);

  React.useEffect(() => {
    saveUserFlags(userFlags);
  }, [userFlags]);

  const setFlag = (userId: string, patch: Partial<LocalUserFlag>) => {
    setUserFlags((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] ?? {}),
        ...patch,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const filteredUsers = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return props.users
      .filter((u) => (roleFilter === "all" ? true : u.role === roleFilter))
      .filter((u) => {
        if (!q) return true;
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q)
        );
      });
  }, [props.users, query, roleFilter]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Setting</h1>
        <p className="text-sm text-muted">General settings + user controls (frontend-only demo).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <SlidersHorizontal className="h-4 w-4" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!general ? (
            <div className="text-sm text-muted">Loading…</div>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-xs text-muted">Platform name</div>
                  <Input
                    value={general.platformName}
                    onChange={(e) => setGeneral({ ...general, platformName: e.target.value })}
                    placeholder="Learnova"
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted">Support email</div>
                  <Input
                    value={general.supportEmail}
                    onChange={(e) => setGeneral({ ...general, supportEmail: e.target.value })}
                    placeholder="support@learnova.dev"
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-center justify-between rounded-[12px] border border-border bg-background px-3 py-3">
                  <div>
                    <div className="text-sm font-medium">Maintenance mode</div>
                    <div className="text-xs text-muted">UI-only toggle (does not block routes)</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={general.maintenanceMode}
                    onChange={(e) => setGeneral({ ...general, maintenanceMode: e.target.checked })}
                    className="h-4 w-4 accent-slate-900"
                  />
                </label>

                <label className="flex items-center justify-between rounded-[12px] border border-border bg-background px-3 py-3">
                  <div>
                    <div className="text-sm font-medium">Allow guest browsing</div>
                    <div className="text-xs text-muted">UI-only toggle</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={general.allowGuestBrowsing}
                    onChange={(e) => setGeneral({ ...general, allowGuestBrowsing: e.target.checked })}
                    className="h-4 w-4 accent-slate-900"
                  />
                </label>
              </div>

              <div className="rounded-[12px] border border-border bg-accent p-3">
                <div className="text-xs text-muted">Default course visibility (demo)</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["everyone", "signed_in"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setGeneral({ ...general, defaultCourseVisibility: v })}
                      className={cn(
                        "rounded-[10px] border border-border px-3 py-2 text-sm",
                        general.defaultCourseVisibility === v ? "bg-background font-semibold" : "bg-transparent text-muted hover:bg-background",
                      )}
                    >
                      {v === "everyone" ? "Everyone" : "Signed in"}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShieldAlert className="h-4 w-4" />
            Users (Admin)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!isAdmin ? (
            <div className="rounded-[12px] border border-border bg-accent p-3 text-sm text-muted">
              Admin-only: user suspend/ban controls are hidden for instructors.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-[240px] flex-1">
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name/email/role" />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="h-10 rounded-[12px] border border-border bg-background px-3 text-sm"
                >
                  <option value="all">All roles</option>
                  <option value="learner">Learner</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="overflow-x-auto rounded-[14px] border border-border">
                <table className="min-w-[900px] w-full border-collapse text-sm">
                  <thead className="bg-accent">
                    <tr>
                      <th className="border-b border-border px-3 py-3 text-left font-semibold">User</th>
                      <th className="border-b border-border px-3 py-3 text-left font-semibold">Role</th>
                      <th className="border-b border-border px-3 py-3 text-left font-semibold">Created</th>
                      <th className="border-b border-border px-3 py-3 text-left font-semibold">Suspended</th>
                      <th className="border-b border-border px-3 py-3 text-left font-semibold">Banned</th>
                      <th className="border-b border-border px-3 py-3 text-left font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-muted">
                          No users.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u, idx) => {
                        const flags = userFlags[u.id] ?? {};
                        const suspended = !!flags.suspended;
                        const banned = !!flags.banned;
                        const isSelf = u.id === props.currentUser.id;
                        return (
                          <tr key={u.id} className={cn("border-b border-border", idx % 2 ? "bg-background" : "bg-surface")}>
                            <td className="px-3 py-3">
                              <div className="font-medium">{u.name}</div>
                              <div className="text-xs text-muted">{u.email}</div>
                            </td>
                            <td className="px-3 py-3">{u.role}</td>
                            <td className="px-3 py-3">{fmtDate(u.createdAt)}</td>
                            <td className="px-3 py-3">
                              <input
                                type="checkbox"
                                checked={suspended}
                                disabled={isSelf}
                                onChange={(e) => setFlag(u.id, { suspended: e.target.checked })}
                                className="h-4 w-4 accent-slate-900 disabled:opacity-60"
                              />
                            </td>
                            <td className="px-3 py-3">
                              <span className={cn("inline-flex rounded-full border px-2 py-1 text-xs font-semibold", banned ? "border-red-200 bg-red-50 text-red-800" : "border-slate-200 bg-slate-50 text-slate-700")}>
                                {banned ? "Yes" : "No"}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                {!banned ? (
                                  <Button
                                    variant="danger"
                                    disabled={isSelf}
                                    onClick={() => setBanTarget(u)}
                                  >
                                    <Ban className="h-4 w-4" />
                                    Ban
                                  </Button>
                                ) : (
                                  <Button
                                    variant="secondary"
                                    disabled={isSelf}
                                    onClick={() => setUnbanTarget(u)}
                                  >
                                    Unban
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="text-xs text-muted">
                Suspend/Ban is frontend-only for the hackathon demo (stored in localStorage, no DB effect).
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={banTarget !== null}
        onOpenChange={(v) => {
          if (!v) setBanTarget(null);
        }}
        title="Ban user?"
        description={banTarget ? `This will mark ${banTarget.name} as banned (frontend-only demo).` : ""}
        confirmText="Ban"
        danger
        onConfirm={() => {
          if (!banTarget) return;
          setFlag(banTarget.id, { banned: true, suspended: true });
        }}
      />

      <ConfirmDialog
        open={unbanTarget !== null}
        onOpenChange={(v) => {
          if (!v) setUnbanTarget(null);
        }}
        title="Unban user?"
        description={unbanTarget ? `This will remove the banned flag for ${unbanTarget.name} (frontend-only demo).` : ""}
        confirmText="Unban"
        danger={false}
        onConfirm={() => {
          if (!unbanTarget) return;
          setFlag(unbanTarget.id, { banned: false });
        }}
      />
    </div>
  );
}

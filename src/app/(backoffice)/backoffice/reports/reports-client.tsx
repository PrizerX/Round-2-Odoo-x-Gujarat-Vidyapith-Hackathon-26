"use client";

import * as React from "react";
import { CheckCircle2, Clock, Hourglass, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export type ReportStatus = "yet_to_start" | "in_progress" | "completed";

export type ReportRow = {
  id: string;
  courseTitle: string;
  participantName: string;
  participantEmail: string;
  enrolledAt: string; // ISO
  startedAt: string | null; // ISO
  timeSpentSeconds: number;
  completionPercent: number;
  completedAt: string | null; // ISO
  lastUpdatedAt: string | null; // ISO
  status: ReportStatus;
};

export type ReportStats = {
  totalParticipants: number;
  yetToStart: number;
  inProgress: number;
  completed: number;
};

type ColumnKey =
  | "sno"
  | "course"
  | "participant"
  | "enrolledAt"
  | "startedAt"
  | "timeSpent"
  | "completion"
  | "completedAt"
  | "status";

const ALL_COLUMNS: Array<{ key: ColumnKey; label: string; locked?: boolean }> = [
  { key: "sno", label: "S.No.", locked: true },
  { key: "course", label: "Course Name" },
  { key: "participant", label: "Participant name" },
  { key: "enrolledAt", label: "Enrolled Date" },
  { key: "startedAt", label: "Start date" },
  { key: "timeSpent", label: "Time spent" },
  { key: "completion", label: "Completion percentage" },
  { key: "completedAt", label: "Completed date" },
  { key: "status", label: "Status" },
];

const STORAGE_KEY = "learnova_reports_columns_v1";

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";

  // Deterministic formatting for SSR hydration (avoids server vs browser locale differences).
  const m = MONTHS_SHORT[d.getUTCMonth()] ?? "";
  const day = String(d.getUTCDate()).padStart(2, "0");
  return m ? `${m} ${day}` : "—";
}

function formatTimeSpent(seconds: number): string {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  if (!s) return "—";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function statusLabel(status: ReportStatus): string {
  switch (status) {
    case "yet_to_start":
      return "Yet to Start";
    case "in_progress":
      return "In progress";
    case "completed":
      return "Completed";
    default:
      return "—";
  }
}

function statusPillClass(status: ReportStatus): string {
  switch (status) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "in_progress":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "yet_to_start":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function buildDefaultVisible(): Record<ColumnKey, boolean> {
  return ALL_COLUMNS.reduce((acc, c) => {
    acc[c.key] = true;
    return acc;
  }, {} as Record<ColumnKey, boolean>);
}

function StatCard(props: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="rounded-[12px] border border-border bg-background p-2 text-muted">{props.icon}</div>
          <div className="text-right">
            <div className="text-3xl font-semibold leading-8">{props.value}</div>
            <div className="mt-1 text-sm text-muted">{props.label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function BackofficeReportsClient(props: { stats: ReportStats; rows: ReportRow[] }) {
  const [visible, setVisible] = React.useState<Record<ColumnKey, boolean>>(() => buildDefaultVisible());

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed !== "object" || !parsed) return;
      const next = buildDefaultVisible();
      for (const c of ALL_COLUMNS) {
        const v = (parsed as Record<string, unknown>)[c.key];
        if (typeof v === "boolean") next[c.key] = v;
      }
      next.sno = true;
      setVisible(next);
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(visible));
    } catch {
      // ignore
    }
  }, [visible]);

  const toggleColumn = (key: ColumnKey) => {
    const meta = ALL_COLUMNS.find((c) => c.key === key);
    if (meta?.locked) return;
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const rows = props.rows;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Reporting</h1>
        <p className="text-sm text-muted">Overview + participant table (real enrollment/progress data).</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Participants" value={props.stats.totalParticipants} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Yet to Start" value={props.stats.yetToStart} icon={<Hourglass className="h-5 w-5" />} />
        <StatCard label="In Progress" value={props.stats.inProgress} icon={<Clock className="h-5 w-5" />} />
        <StatCard label="Completed" value={props.stats.completed} icon={<CheckCircle2 className="h-5 w-5" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Customizable table</CardTitle>
            <div className="text-xs text-muted">Pick which columns to show/hide</div>
          </CardHeader>
          <CardContent className="space-y-2">
            {ALL_COLUMNS.map((c) => (
              <label key={c.key} className="flex cursor-pointer items-center justify-between gap-3 rounded-[10px] px-2 py-1 hover:bg-accent">
                <span className="text-sm">{c.label}</span>
                <input
                  type="checkbox"
                  checked={!!visible[c.key]}
                  disabled={!!c.locked}
                  onChange={() => toggleColumn(c.key)}
                  className="h-4 w-4 rounded border-border accent-slate-900 disabled:opacity-60"
                />
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="inline-flex w-fit rounded-[10px] border border-border bg-background px-3 py-1 text-xs font-semibold">Users</div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-[14px] border border-border">
              <table className="min-w-[980px] w-full border-collapse text-sm">
                <thead className="bg-accent">
                  <tr className="text-left">
                    {visible.sno && <th className="whitespace-nowrap border-b border-border px-3 py-3 font-semibold">S.No.</th>}
                    {visible.course && <th className="whitespace-nowrap border-b border-border px-3 py-3 font-semibold">Course Name</th>}
                    {visible.participant && (
                      <th className="whitespace-nowrap border-b border-border px-3 py-3 font-semibold">Participant name</th>
                    )}
                    {visible.enrolledAt && <th className="whitespace-nowrap border-b border-border px-3 py-3 font-semibold">Enrolled Date</th>}
                    {visible.startedAt && <th className="whitespace-nowrap border-b border-border px-3 py-3 font-semibold">Start date</th>}
                    {visible.timeSpent && <th className="whitespace-nowrap border-b border-border px-3 py-3 font-semibold">Time spent</th>}
                    {visible.completion && (
                      <th className="whitespace-nowrap border-b border-border px-3 py-3 font-semibold">Completion percentage</th>
                    )}
                    {visible.completedAt && <th className="whitespace-nowrap border-b border-border px-3 py-3 font-semibold">Completed date</th>}
                    {visible.status && <th className="whitespace-nowrap border-b border-border px-3 py-3 font-semibold">Status</th>}
                  </tr>
                </thead>

                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={ALL_COLUMNS.length} className="px-3 py-6 text-center text-muted">
                        No participants found.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, idx) => (
                      <tr key={r.id} className={cn("border-b border-border", idx % 2 === 1 ? "bg-background" : "bg-surface")}> 
                        {visible.sno && <td className="whitespace-nowrap px-3 py-3">{idx + 1}</td>}
                        {visible.course && <td className="min-w-[220px] px-3 py-3 font-medium text-emerald-800">{r.courseTitle}</td>}
                        {visible.participant && (
                          <td className="min-w-[200px] px-3 py-3">
                            <div className="font-medium">{r.participantName}</div>
                            <div className="text-xs text-muted">{r.participantEmail}</div>
                          </td>
                        )}
                        {visible.enrolledAt && <td className="whitespace-nowrap px-3 py-3">{formatDate(r.enrolledAt)}</td>}
                        {visible.startedAt && <td className="whitespace-nowrap px-3 py-3">{formatDate(r.startedAt)}</td>}
                        {visible.timeSpent && <td className="whitespace-nowrap px-3 py-3 text-rose-600">{formatTimeSpent(r.timeSpentSeconds)}</td>}
                        {visible.completion && (
                          <td className="whitespace-nowrap px-3 py-3 text-sky-700">{Math.max(0, Math.min(100, Math.round(r.completionPercent)))}%</td>
                        )}
                        {visible.completedAt && <td className="whitespace-nowrap px-3 py-3">{formatDate(r.completedAt)}</td>}
                        {visible.status && (
                          <td className="whitespace-nowrap px-3 py-3">
                            <span className={cn("inline-flex rounded-full border px-2 py-1 text-xs font-semibold", statusPillClass(r.status))}>
                              {statusLabel(r.status)}
                            </span>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-xs text-muted">
              Showing {rows.length} enrollment row(s). “Time spent” uses CourseProgress.totalTimeSpentSeconds (may be 0 in demo data).
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

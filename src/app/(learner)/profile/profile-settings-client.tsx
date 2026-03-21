"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";

export function ProfileSettingsClient(props: { currentName: string }) {
  const router = useRouter();
  const [nameDraft, setNameDraft] = React.useState(props.currentName);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  React.useEffect(() => {
    setNameDraft(props.currentName);
  }, [props.currentName]);

  const normalizedDraft = nameDraft.trim();
  const canSave = normalizedDraft.length >= 2 && normalizedDraft.length <= 60 && normalizedDraft !== props.currentName;

  async function saveName() {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/profile/name", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: normalizedDraft }),
      });

      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) {
        setError(data?.error || "Failed to update name.");
        return;
      }

      setOk("Name updated.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm font-semibold">Display name</div>
          <div className="mt-1 text-sm text-muted">This name appears on your profile and dashboards.</div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder="Your name" />
            <Button
              disabled={!canSave || busy}
              onClick={() => setConfirmOpen(true)}
            >
              {busy ? "Saving…" : "Save"}
            </Button>
          </div>

          {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
          {ok && <div className="mt-2 text-sm text-emerald-700">{ok}</div>}
        </div>

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Confirm name change"
          description={`Change your name to “${normalizedDraft || "(empty)"}”?`}
          confirmText="Apply"
          cancelText="Cancel"
          danger={false}
          busy={busy}
          onConfirm={saveName}
        />
      </CardContent>
    </Card>
  );
}

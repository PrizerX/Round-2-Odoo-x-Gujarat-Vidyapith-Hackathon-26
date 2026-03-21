"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  danger?: boolean;
  busy?: boolean;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  danger = true,
  busy,
}: ConfirmDialogProps) {
  const [internalBusy, setInternalBusy] = React.useState(false);
  const isBusy = busy ?? internalBusy;

  return (
    <Modal
      open={open}
      onOpenChange={(v) => {
        if (isBusy) return;
        onOpenChange(v);
      }}
      title={title}
      description={description}
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isBusy}
          >
            {cancelText}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={async () => {
              try {
                setInternalBusy(true);
                await onConfirm();
                onOpenChange(false);
              } finally {
                setInternalBusy(false);
              }
            }}
            disabled={isBusy}
          >
            {isBusy ? "Working..." : confirmText}
          </Button>
        </div>
      }
    >
      <div className="text-sm text-foreground">{description}</div>
    </Modal>
  );
}

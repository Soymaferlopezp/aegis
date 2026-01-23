"use client";

import type { EvidenceSnapshot } from "@/lib/console/types";
import EvidencePanel from "@/components/console/EvidencePanel";

export default function EvidenceDrawer({
  open,
  onClose,
  evidence,
}: {
  open: boolean;
  onClose: () => void;
  evidence: EvidenceSnapshot;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(0,0,0,0.55)]"
        aria-label="Close evidence"
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-auto rounded-t-3xl border border-[var(--border)] bg-[rgba(11,15,20,0.92)] p-4 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-[var(--font-display)] text-[13px] tracking-[0.18em] text-[var(--muted)]">
            Evidence
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border)] bg-[rgba(17,24,39,0.20)] px-3 py-2 text-[12px] text-[var(--muted)]"
          >
            Close
          </button>
        </div>

        <EvidencePanel evidence={evidence} />
      </div>
    </div>
  );
}

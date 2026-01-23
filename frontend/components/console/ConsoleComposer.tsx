"use client";

import type { ConsoleMode } from "@/lib/console/types";

export default function ConsoleComposer({
  mode,
  runLabel,
  intent,
  onIntentChange,
  onRun,
}: {
  mode: ConsoleMode;
  runLabel: string;
  intent: string;
  onIntentChange: (v: string) => void;
  onRun: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[rgba(11,15,20,0.78)] backdrop-blur">
      <div className="mx-auto max-w-[1200px] px-4 py-4 md:px-6">
        <div className="grid gap-3 md:grid-cols-12 md:items-end">
          <div className="md:col-span-9">
            <label className="block text-[12px] text-[var(--muted)]">
              Intent (text)
            </label>
            <textarea
              value={intent}
              onChange={(e) => onIntentChange(e.target.value)}
              placeholder='Enter an intent (e.g., "Spend 5 USDC for coffee")'
              rows={2}
              className={[
                "mt-2 w-full resize-none rounded-2xl border border-[var(--border)]",
                "bg-[rgba(17,24,39,0.22)] px-4 py-3",
                "text-[14px] text-[var(--text)] placeholder:text-[rgba(229,231,235,0.35)]",
                "outline-none focus:border-[rgba(94,234,212,0.35)]",
              ].join(" ")}
            />
            <div className="mt-2 text-[11px] text-[var(--muted)]">
              The UI does not approve. It displays outputs from real system steps.
            </div>
          </div>

          <div className="md:col-span-3 md:flex md:justify-end">
            <button
              type="button"
              onClick={onRun}
              disabled={!intent.trim()}
              className={[
                "w-full rounded-2xl px-4 py-3 text-[13px]",
                "font-[var(--font-display)] tracking-[0.10em]",
                "border border-[rgba(94,234,212,0.22)]",
                "bg-[rgba(20,184,166,0.12)] text-[var(--text)]",
                "transition hover:bg-[rgba(20,184,166,0.18)]",
                "disabled:cursor-not-allowed disabled:opacity-40",
                "md:w-auto",
              ].join(" ")}
            >
              {runLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

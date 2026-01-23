"use client";

import type { ConsoleMode } from "@/lib/console/types";
import { MODE_LABEL } from "@/lib/console/constants";

export default function ConsoleHeader({
  title,
  notice,
  mode,
  onModeChange,
  
}: {
  title: string;
  notice: string;
  mode: ConsoleMode;
  onModeChange: (m: ConsoleMode) => void;
  
}) {
  return (
    <div className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(11,15,20,0.70)] backdrop-blur">
      <div className="mx-auto max-w-[1200px] px-4 py-4 md:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-[var(--font-display)] text-[16px] tracking-[0.16em] text-[var(--muted)]">
              {title}
            </div>
            <div className="mt-1 text-[12px] text-[var(--muted)]">
              {notice}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-2xl border border-[var(--border)] bg-[rgba(17,24,39,0.28)] p-1">
              {(["SIMULATE", "VALIDATE", "EXECUTE"] as ConsoleMode[]).map((m) => {
                const active = m === mode;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onModeChange(m)}
                    className={[
                      "px-3 py-2 text-[12px] font-[var(--font-display)] tracking-[0.10em]",
                      "rounded-xl transition",
                      active
                        ? "bg-[rgba(229,231,235,0.10)] text-[var(--text)]"
                        : "text-[var(--muted)] hover:text-[var(--text)]",
                    ].join(" ")}
                  >
                    {MODE_LABEL[m]}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              /*onClick={onClear}*/
              className={[
                "rounded-2xl border border-[var(--border)]",
                "bg-[rgba(17,24,39,0.22)] px-3 py-2",
                "text-[12px] text-[var(--muted)] transition hover:text-[var(--text)]",
              ].join(" ")}
            >
              Clear run
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import type { ConsoleMode, TimelineEvent } from "@/lib/console/types";
import TimelineEventView from "@/components/console/timeline/TimelineEvent";

export default function ConsoleTimeline({
  mode,
  events,
}: {
  mode: ConsoleMode;
  events: TimelineEvent[];
}) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[rgba(17,24,39,0.22)]">
      <div className="border-b border-[var(--border)] px-5 py-4">
        <div className="font-[var(--font-display)] text-[13px] tracking-[0.18em] text-[var(--muted)]">
          Timeline
        </div>
        <div className="mt-1 text-[12px] text-[var(--muted)]">
          Mode: <span className="text-[var(--text)]">{mode}</span>
        </div>
      </div>

      {/* Scroll area (prevents infinite page growth) */}
      <div className="max-h-[calc(100vh-280px)] overflow-y-auto px-3 py-3 md:max-h-[calc(100vh-250px)] md:px-4">
        {events.length === 0 ? (
          <div className="px-3 py-10 text-center">
            <div className="font-[var(--font-display)] text-[13px] tracking-[0.10em] text-[var(--text)]">
              No run yet.
            </div>
            <div className="mt-2 text-[12px] text-[var(--muted)]">
              Enter an intent below and run a mode to display real system outputs.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((ev) => (
              <TimelineEventView key={ev.id} event={ev} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

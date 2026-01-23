import type { TimelineEvent } from "@/lib/console/types";
import { shortHex } from "@/lib/console/normalize";

function chipClass(stage: TimelineEvent["stage"]) {
  switch (stage) {
    case "USER_INTENT":
      return "border-[rgba(229,231,235,0.14)] bg-[rgba(229,231,235,0.06)] text-[rgba(229,231,235,0.70)]";
    case "AGENT_INTERPRETATION":
      return "border-[rgba(59,130,246,0.22)] bg-[rgba(59,130,246,0.10)] text-[rgba(96,165,250,0.92)]";
    case "VAULT_VALIDATION":
      return "border-[rgba(20,184,166,0.22)] bg-[rgba(20,184,166,0.10)] text-[rgba(94,234,212,0.95)]";
    case "EXECUTION":
      return "border-[rgba(229,231,235,0.14)] bg-[rgba(229,231,235,0.06)] text-[rgba(229,231,235,0.70)]";
    case "ERROR":
      return "border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.10)] text-[rgba(252,165,165,0.95)]";
  }
}

export default function TimelineEventView({ event }: { event: TimelineEvent }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[rgba(11,15,20,0.22)] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "inline-flex rounded-full border px-2.5 py-1 text-[11px]",
                "font-[var(--font-display)] tracking-[0.12em]",
                chipClass(event.stage),
              ].join(" ")}
            >
              {event.title}
            </span>
            <span className="text-[11px] text-[var(--muted)]">
              {new Date(event.timestampISO).toLocaleString()}
            </span>
          </div>

          <div className="mt-3 text-[14px] leading-relaxed text-[color:rgba(229,231,235,0.82)]">
            {event.stage === "USER_INTENT" && (
              <div className="whitespace-pre-wrap">{event.intent}</div>
            )}

            {event.stage === "AGENT_INTERPRETATION" && (
              <div className="space-y-2 text-[13px]">
                <Row k="to" v={shortHex(event.output.to)} mono />
                <Row k="amount" v={event.output.amount} mono />
                <Row k="currency" v={event.output.currency} />
                <div className="pt-2 text-[12px] text-[var(--muted)]">
                  {event.output.reason}
                </div>
              </div>
            )}

            {event.stage === "VAULT_VALIDATION" && (
              <div className="space-y-2 text-[13px]">
                <Row k="status" v={event.output.status} />
                <div className="text-[12px] text-[var(--muted)]">{event.output.reason}</div>
                <div className="mt-3 space-y-1 rounded-xl border border-[var(--border)] bg-[rgba(17,24,39,0.18)] p-3">
                  <Row k="maxPerTx" v={event.output.vault.maxPerTx} mono />
                  <Row k="dailyLimit" v={event.output.vault.dailyLimit} mono />
                  <Row k="spentToday" v={event.output.vault.spentToday} mono />
                </div>
              </div>
            )}

            {event.stage === "EXECUTION" && (
              <div className="text-[13px] text-[var(--muted)]">
                (Execution is implemented in Checkpoint 3.)
              </div>
            )}

            {event.stage === "ERROR" && (
              <pre className="mt-2 overflow-auto rounded-xl border border-[rgba(239,68,68,0.20)] bg-[rgba(239,68,68,0.08)] p-3 text-[12px] text-[rgba(252,165,165,0.95)]">
                {event.error}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v?: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="text-[var(--muted)]">{k}</div>
      <div className={(mono ? "font-mono " : "") + "text-[12px] text-[var(--text)]"}>
        {v ?? "—"}
      </div>
    </div>
  );
}

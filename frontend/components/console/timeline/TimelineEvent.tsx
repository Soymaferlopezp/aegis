// frontend/components/console/timeline/TimelineEvent.tsx

import type {
  TimelineEvent,
  SimulateOutput,
  ValidateOutput,
  ExecuteOutput,
} from "@/lib/console/types";

function fmtLocal(tsISO: string) {
  try {
    return new Date(tsISO).toLocaleString();
  } catch {
    return tsISO;
  }
}

function truncateMiddle(s: string, head = 10, tail = 8) {
  if (!s) return "—";
  if (s.length <= head + tail + 3) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

function Row({
  label,
  value,
  mono = false,
  right = false,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
  right?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="text-[12px] text-[var(--muted)]">{label}</div>
      <div
        className={[
          mono ? "font-mono" : "",
          "text-[12px] text-[var(--text)]",
          right ? "text-right" : "",
          "break-all",
        ].join(" ")}
      >
        {value ?? "—"}
      </div>
    </div>
  );
}

function AgentBlock({ out }: { out: SimulateOutput }) {
  return (
    <div className="mt-3 space-y-2">
      <Row label="to" value={out.to} mono />
      <Row label="amount" value={out.amount} mono />
      <Row label="currency" value={out.currency} />
      <Row label="reason" value={out.reason} />
    </div>
  );
}

function VaultBlock({ out }: { out: ValidateOutput }) {
  return (
    <div className="mt-3 space-y-2">
      <Row label="status" value={out.status} />
      <Row label="reason" value={out.reason} />
      {out.reason_model ? <Row label="reason_model" value={out.reason_model} /> : null}

      <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[rgba(11,15,20,0.18)] p-3">
        <div className="text-[11px] tracking-[0.14em] text-[var(--muted)]">
          VAULT STATE (ON-CHAIN)
        </div>
        <div className="mt-2 space-y-2">
          <Row label="maxPerTx" value={out.vault?.maxPerTx} mono />
          <Row label="dailyLimit" value={out.vault?.dailyLimit} mono />
          <Row label="spentToday" value={out.vault?.spentToday} mono />
        </div>
      </div>
    </div>
  );
}

function ExecBlock({ out }: { out: ExecuteOutput }) {
  const hasTx = Boolean(out.txHash);

  return (
    <div className="mt-3 space-y-2">
      <Row label="status" value={out.status} />
      {out.reason ? <Row label="reason" value={out.reason} /> : null}

      {hasTx ? (
        <>
          <Row label="txHash" value={out.txHash} mono />
          <div className="flex items-start justify-between gap-3">
            <div className="text-[12px] text-[var(--muted)]">arcscan</div>
            {out.arcscan ? (
              <a
                href={out.arcscan}
                target="_blank"
                rel="noreferrer"
                className="text-[12px] text-[var(--text)] underline decoration-[var(--border)] underline-offset-4 hover:opacity-80 break-all"
              >
                {out.arcscan}
              </a>
            ) : (
              <div className="text-[12px] text-[var(--text)]">—</div>
            )}
          </div>

          {out.circleTxId ? <Row label="circleTxId" value={out.circleTxId} mono /> : null}
        </>
      ) : (
        <div className="pt-2 text-[12px] text-[var(--muted)]">
          {out.message ?? "No execution evidence available yet."}
        </div>
      )}
    </div>
  );
}

export default function TimelineEventCard({ event }: { event: TimelineEvent }) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[rgba(17,24,39,0.18)] px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="font-[var(--font-display)] text-[13px] tracking-[0.08em] text-[var(--text)]">
          {event.title}
        </div>
        <div className="shrink-0 text-[11px] text-[var(--muted)]">
          {fmtLocal(event.timestampISO)}
        </div>
      </div>

      {/* Body */}
      {event.stage === "USER_INTENT" ? (
        <div className="mt-3 whitespace-pre-wrap break-words text-[13px] text-[var(--text)]">
          {event.intent}
        </div>
      ) : null}

      {event.stage === "AGENT_INTERPRETATION" ? (
        <AgentBlock out={event.output} />
      ) : null}

      {event.stage === "VAULT_VALIDATION" ? <VaultBlock out={event.output} /> : null}

      {event.stage === "EXECUTION" ? <ExecBlock out={event.output} /> : null}

      {event.stage === "ERROR" ? (
        <div className="mt-3 rounded-2xl border border-[rgba(255,80,80,0.35)] bg-[rgba(255,80,80,0.08)] p-3">
          <div className="text-[11px] tracking-[0.14em] text-[rgba(255,180,180,0.9)]">
            ERROR
          </div>
          <div className="mt-2 font-mono text-[12px] text-[rgba(255,210,210,0.95)] whitespace-pre-wrap break-words">
            {event.error}
          </div>
        </div>
      ) : null}
    </div>
  );
}

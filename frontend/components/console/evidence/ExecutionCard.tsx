export default function ExecutionCard({
  execution,
}: {
  execution?: {
    status?: "APPROVED" | "BLOCKED" | "ERROR";
    txHash?: string;
    arcscan?: string;
    circleTxId?: string;
    message?: string;
    reason?: string;
  };
}) {
  const status = execution?.status;
  const txHash = execution?.txHash;
  const arcscan = execution?.arcscan;
  const circleTxId = execution?.circleTxId;

  const showEmpty = !status && !txHash && !arcscan && !circleTxId && !execution?.message;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[rgba(11,15,20,0.20)] p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="font-[var(--font-display)] text-[12px] tracking-[0.18em] text-[var(--muted)]">
          Execution
        </div>

        {status ? (
          <span
            className={[
              "rounded-full border px-2.5 py-1 text-[11px] font-medium",
              status === "APPROVED"
                ? "border-[rgba(16,185,129,0.35)] bg-[rgba(16,185,129,0.12)] text-[rgba(167,243,208,0.95)]"
                : status === "BLOCKED"
                ? "border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.10)] text-[rgba(254,202,202,0.95)]"
                : "border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.10)] text-[rgba(253,230,138,0.95)]",
            ].join(" ")}
          >
            {status}
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-3 text-[13px]">
        <Row label="circleTxId" value={circleTxId} mono />
        <Row label="txHash" value={txHash} mono />

        <div className="flex items-start justify-between gap-3">
          <div className="text-[var(--muted)]">arcscan</div>
          <div className="text-right text-[12px] text-[var(--text)]">
            {arcscan ? (
              <a
                href={arcscan}
                target="_blank"
                rel="noreferrer"
                className="font-mono underline decoration-[rgba(255,255,255,0.25)] underline-offset-4 hover:decoration-[rgba(255,255,255,0.5)]"
              >
                {arcscan}
              </a>
            ) : (
              <span className="font-mono">—</span>
            )}
          </div>
        </div>

        {!showEmpty ? (
          <div className="pt-2 text-[12px] text-[var(--muted)]">
            {execution?.reason ? (
              <>
                <span className="text-[var(--text)]">Reason:</span>{" "}
                <span>{execution.reason}</span>
              </>
            ) : (
              execution?.message ?? null
            )}
          </div>
        ) : (
          <div className="pt-2 text-[12px] text-[var(--muted)]">
            No execution evidence available yet.
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="text-[var(--muted)]">{label}</div>
      <div className={(mono ? "font-mono " : "") + "text-[12px] text-[var(--text)]"}>
        {value ?? "—"}
      </div>
    </div>
  );
}

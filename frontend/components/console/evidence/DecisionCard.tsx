export default function DecisionCard({
  decision,
}: {
  decision?: { status?: string; reason?: string };
}) {
  const status = decision?.status;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[rgba(11,15,20,0.20)] p-5">
      <div className="font-[var(--font-display)] text-[12px] tracking-[0.18em] text-[var(--muted)]">
        Decision
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-[13px] text-[var(--muted)]">status</div>
        <div className={chip(status)}>{status ?? "—"}</div>
      </div>

      <div className="mt-4">
        <div className="text-[13px] text-[var(--muted)]">reason</div>
        <div className="mt-2 text-[13px] leading-relaxed text-[color:rgba(229,231,235,0.82)]">
          {decision?.reason ?? "—"}
        </div>
      </div>
    </div>
  );
}

function chip(status?: string) {
  const base =
    "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-[var(--font-display)] tracking-[0.12em]";
  if (!status) return `${base} border-[rgba(229,231,235,0.14)] bg-[rgba(229,231,235,0.06)] text-[rgba(229,231,235,0.70)]`;

  if (status.includes("BLOCKED"))
    return `${base} border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.10)] text-[rgba(252,165,165,0.95)]`;

  if (status.includes("APPROVED"))
    return `${base} border-[rgba(20,184,166,0.22)] bg-[rgba(20,184,166,0.10)] text-[rgba(94,234,212,0.95)]`;

  return `${base} border-[rgba(229,231,235,0.14)] bg-[rgba(229,231,235,0.06)] text-[rgba(229,231,235,0.70)]`;
}

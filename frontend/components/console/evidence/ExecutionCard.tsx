export default function ExecutionCard({
  execution,
}: {
  execution?: { txHash?: string; arcscan?: string; message?: string };
}) {
  const txHash = execution?.txHash;
  const arcscan = execution?.arcscan;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[rgba(11,15,20,0.20)] p-5">
      <div className="font-[var(--font-display)] text-[12px] tracking-[0.18em] text-[var(--muted)]">
        Execution
      </div>

      <div className="mt-4 space-y-3 text-[13px]">
        <Row label="txHash" value={txHash} mono />
        <Row label="arcscan" value={arcscan} mono />

        {!txHash && (
          <div className="pt-2 text-[12px] text-[var(--muted)]">
            {execution?.message ?? "No execution evidence available yet."}
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
  value?: string;
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

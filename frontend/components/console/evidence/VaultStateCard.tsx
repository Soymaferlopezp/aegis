export default function VaultStateCard({
  vault,
}: {
  vault?: { maxPerTx?: string; dailyLimit?: string; spentToday?: string };
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[rgba(11,15,20,0.20)] p-5">
      <div className="font-[var(--font-display)] text-[12px] tracking-[0.18em] text-[var(--muted)]">
        Vault State (On-chain)
      </div>

      <div className="mt-4 space-y-3 text-[13px]">
        <Row label="maxPerTx" value={vault?.maxPerTx} />
        <Row label="dailyLimit" value={vault?.dailyLimit} />
        <Row label="spentToday" value={vault?.spentToday} />
      </div>

      <div className="mt-4 text-[11px] text-[var(--muted)]">
        Note: Vault getter is <span className="text-[var(--text)]">spentInCurrentDay()</span>,
        displayed here as <span className="text-[var(--text)]">spentToday</span>.
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-[var(--muted)]">{label}</div>
      <div className="font-mono text-[12px] text-[var(--text)]">
        {value ?? "—"}
      </div>
    </div>
  );
}

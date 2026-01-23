export default function VaultStateCard({
  vault,
  meta,
}: {
  vault?: { maxPerTx?: string; dailyLimit?: string; spentToday?: string };
  meta?: {
    vaultAddress?: string;
    arcscanAddressUrl?: string;
    timestampISO?: string;
    status?: "idle" | "loading" | "success" | "error";
  };
}) {
  const status = meta?.status ?? "idle";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[rgba(11,15,20,0.20)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-[var(--font-display)] text-[12px] tracking-[0.18em] text-[var(--muted)]">
            Vault State (On-chain)
          </div>

          <div className="mt-2 text-[12px] text-[var(--muted)]">
            These values come directly from the Vault contract. The UI cannot modify them.
          </div>
        </div>

        {meta?.arcscanAddressUrl ? (
          <a
            href={meta.arcscanAddressUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-[var(--border)] bg-[rgba(17,24,39,0.20)] px-3 py-2 text-[12px] text-[var(--muted)] transition hover:bg-[rgba(17,24,39,0.30)]"
            title={meta?.vaultAddress ?? "View on Arcscan"}
          >
            View on Arcscan
          </a>
        ) : null}
      </div>

      <div className="mt-4 space-y-3 text-[13px]">
        <Row label="maxPerTx" value={vault?.maxPerTx} loading={status === "loading"} />
        <Row label="dailyLimit" value={vault?.dailyLimit} loading={status === "loading"} />
        <Row label="spentToday" value={vault?.spentToday} loading={status === "loading"} />
      </div>

      <div className="mt-4 space-y-1 text-[11px] text-[var(--muted)]">
        <div>
          Note: Vault getter is{" "}
          <span className="text-[var(--text)]">spentInCurrentDay()</span>, displayed here as{" "}
          <span className="text-[var(--text)]">spentToday</span>.
        </div>

        {meta?.timestampISO ? (
          <div>
            Last updated:{" "}
            <span className="font-mono text-[12px] text-[var(--text)]">
              {new Date(meta.timestampISO).toISOString()}
            </span>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="text-[11px] text-red-300/80">
            Preflight failed. Could not load Vault state.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  loading,
}: {
  label: string;
  value?: string;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-[var(--muted)]">{label}</div>

      {loading ? (
        <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
      ) : (
        <div className="font-mono text-[12px] text-[var(--text)]">{value ?? "—"}</div>
      )}
    </div>
  );
}

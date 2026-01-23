import type { EvidenceSnapshot } from "@/lib/console/types";
import EvidenceEmpty from "@/components/console/evidence/EvidenceEmpty";
import VaultStateCard from "@/components/console/evidence/VaultStateCard";
import DecisionCard from "@/components/console/evidence/DecisionCard";
import ExecutionCard from "@/components/console/evidence/ExecutionCard";

export default function EvidencePanel({ evidence }: { evidence: EvidenceSnapshot }) {
  const has =
    Boolean(evidence.vault?.maxPerTx || evidence.vault?.dailyLimit || evidence.vault?.spentToday) ||
    Boolean(evidence.decision?.status || evidence.decision?.reason) ||
    Boolean(evidence.execution?.txHash || evidence.execution?.message);

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[rgba(17,24,39,0.22)]">
      <div className="border-b border-[var(--border)] px-5 py-4">
        <div className="font-[var(--font-display)] text-[13px] tracking-[0.18em] text-[var(--muted)]">
          Evidence
        </div>
        <div className="mt-1 text-[12px] text-[var(--muted)]">
          Vault state, decision, and execution proof.
        </div>
      </div>

      <div className="space-y-4 px-4 py-4">
        {!has ? (
          <EvidenceEmpty />
        ) : (
          <>
            <VaultStateCard vault={evidence.vault} />
            <DecisionCard decision={evidence.decision} />
            <ExecutionCard execution={evidence.execution} />
          </>
        )}
      </div>
    </div>
  );
}

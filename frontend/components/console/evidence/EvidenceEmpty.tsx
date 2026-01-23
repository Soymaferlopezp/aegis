import { EVIDENCE_EMPTY_BODY, EVIDENCE_EMPTY_TITLE } from "@/lib/console/constants";

export default function EvidenceEmpty() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[rgba(11,15,20,0.20)] p-5">
      <div className="font-[var(--font-display)] text-[13px] tracking-[0.12em] text-[var(--text)]">
        {EVIDENCE_EMPTY_TITLE}
      </div>
      <div className="mt-2 text-[13px] leading-relaxed text-[var(--muted)]">
        {EVIDENCE_EMPTY_BODY}
      </div>

      <div className="mt-4 text-[12px] text-[var(--muted)]">
        The UI never approves. The Vault enforces on-chain.
      </div>
    </div>
  );
}

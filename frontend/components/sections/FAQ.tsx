"use client";

import { useMemo, useState } from "react";
import Section from "@/components/ui/Section";
import Card from "@/components/ui/Card";
import { H1, Overline, P } from "@/components/ui/Text";
import { ChevronDown } from "lucide-react";

type Item = {
  q: string;
  a: string;
};

export default function FAQ() {
  const items: Item[] = useMemo(
    () => [
      {
        q: "What is AEGIS exactly?",
        a: "AEGIS is an on-chain control layer that enforces financial guardrails for AI agents before execution.",
      },
      {
        q: "Does the frontend approve or reject payments?",
        a: "No. The frontend is observational. Approval and rejection are enforced on-chain by the AEGIS Vault.",
      },
      {
        q: "Are real funds moved in this demo?",
        a: "No. This experience is designed for exploration and clarity. No execution happens from the UI.",
      },
      {
        q: "What happens if a payment violates a rule?",
        a: "Execution is blocked. If a limit is exceeded, nothing moves on-chain.",
      },
      {
        q: "What types of limits can AEGIS enforce?",
        a: "AEGIS can enforce per-transaction limits, daily spending limits, and deterministic policy enforcement on-chain.",
      },
      {
        q: "Is AEGIS tied to a specific AI model?",
        a: "No. AEGIS focuses on financial enforcement on-chain. It is not dependent on a specific model.",
      },
      {
        q: "Is AEGIS production-ready?",
        a: "AEGIS demonstrates a real enforcement model on-chain. Production readiness depends on the deployment environment and operational requirements.",
      },
      {
        q: "What problem does AEGIS focus on — and what does it not do?",
        a: "AEGIS focuses on enforcing financial constraints before execution. It does not evaluate intent quality, business logic, or agent behavior beyond spend limits.",
      },
    ],
    []
  );

  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <Section id="faq" className="pt-10 md:pt-16">
      <div className="grid items-start gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <Overline>TECHNICAL FAQ</Overline>
          <H1 className="mt-4">
            Clear answers for <em className="italic font-normal">technical</em> questions.
          </H1>
          <P className="mt-5">
            This section is designed to prevent the most common misunderstandings — especially
            around UI approval and execution.
          </P>
        </div>

        <div className="md:col-span-7">
          <Card className="p-4 md:p-6">
            <div className="divide-y divide-[var(--border)]">
              {items.map((it, idx) => {
                const isOpen = idx === openIndex;
                return (
                  <button
                    key={it.q}
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between gap-4 py-4">
                      <div className="font-[var(--font-display)] text-[15px] text-[var(--text)]">
                        {it.q}
                      </div>
                      <ChevronDown
                        className={[
                          "h-4 w-4 shrink-0 text-[var(--muted)] transition",
                          isOpen ? "rotate-180" : "rotate-0",
                        ].join(" ")}
                      />
                    </div>

                    <div
                      className={[
                        "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
                        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                      ].join(" ")}
                    >
                      <div className="overflow-hidden pb-4 pr-7 text-[14px] leading-relaxed text-[color:rgba(229,231,235,0.78)]">
                        {it.a}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="mt-4 text-[12px] text-[var(--muted)]">
            One item open at a time (recommended). UI remains observational by design.
          </div>
        </div>
      </div>
    </Section>
  );
}

import Section from "@/components/ui/Section";
import Card from "@/components/ui/Card";
import { H1, Overline, P } from "@/components/ui/Text";
import { ArrowRightLeft, CalendarDays, ShieldCheck } from "lucide-react";

const items = [
  {
    icon: ArrowRightLeft,
    title: "Per-transaction limits",
    body:
      "Each proposed payment is checked against a maximum allowed amount before execution.",
  },
  {
    icon: CalendarDays,
    title: "Daily spending limits",
    body:
      "Cumulative spending is tracked on-chain to prevent runaway or repeated transactions.",
  },
  {
    icon: ShieldCheck,
    title: "Deterministic enforcement",
    body:
      "Rules are enforced on-chain. If a limit is exceeded, execution is blocked — not delayed.",
  },
];

export default function Guardrails() {
  return (
    <Section id="guardrails" className="pt-10 md:pt-16">
      <div className="max-w-4xl">
        <Overline>WHAT IS ENFORCED</Overline>
        <H1 className="mt-4">
          Financial rules are enforced{" "}
          <em className="italic font-normal">before</em> execution.
        </H1>
        <P className="mt-5">AEGIS focuses on financial safety, not behavioral control.</P>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-12 md:gap-6">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Card
              key={it.title}
              className={[
                "p-6 md:col-span-4 md:p-7",
                "bg-[rgba(17,24,39,0.30)]",
                "transition hover:bg-[rgba(17,24,39,0.42)]",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <div className="font-[var(--font-display)] text-[16px] text-[var(--text)]">
                    {it.title}
                  </div>
                </div>

                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[rgba(11,15,20,0.25)]">
                  <Icon className="h-4.5 w-4.5 text-[var(--teal-soft)]" />
                </div>
              </div>

              <P className="mt-3">{it.body}</P>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 max-w-4xl">
        <div className="text-[12px] text-[var(--muted)]">
          AEGIS does not evaluate intent quality or business logic. It only enforces financial
          constraints.
        </div>
      </div>
    </Section>
  );
}

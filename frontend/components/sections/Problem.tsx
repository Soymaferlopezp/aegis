import { Zap, ShieldOff, LockKeyhole } from "lucide-react";
import Section from "@/components/ui/Section";
import Card from "@/components/ui/Card";
import { H1, Overline, P } from "@/components/ui/Text";

const items = [
  {
    icon: Zap,
    title: "AI can trigger financial decisions instantly",
    body:
      "Autonomous agents can initiate purchases, subscriptions,\n" +
      "and payments faster than any human review process.",
  },
  {
    icon: ShieldOff,
    title: "Most AI systems have no on-chain guardrails",
    body:
      "Without enforced limits, an agent can overspend,\n" +
      "repeat transactions, or drain funds by design or error.",
  },
  {
    icon: LockKeyhole,
    title: "Trust is not a security model",
    body:
      "Prompt rules and policies are not enough.\n" +
      "Financial safety requires hard, on-chain enforcement.",
  },
];

export default function Problem() {
  return (
    <Section className="pt-10 md:pt-16">
      <div className="max-w-4xl">
        <Overline>THE REAL CHALLENGE OF AUTONOMOUS AI</Overline>

        {/* Same copy, just editorial emphasis */}
        <H1 className="mt-4">
          Autonomous agents can <em className="italic font-normal">decide</em>.
          <br />
          But who <em className="italic font-normal">controls</em> what they spend?
        </H1>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-12">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Card
              key={it.title}
              className={[
                "p-6 md:col-span-4 md:p-7",
                "bg-[rgba(17,24,39,0.35)]",
                "hover:bg-[rgba(17,24,39,0.45)]",
                "transition",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <div className="font-[var(--font-display)] text-[16px] text-[var(--text)]">
                    {it.title}
                  </div>
                </div>

                {/* Icon subtle, no heavy box */}
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[rgba(11,15,20,0.25)]">
                  <Icon className="h-4.5 w-4.5 text-[var(--teal-soft)]" />
                </div>
              </div>

              <P className="mt-3 whitespace-pre-line text-[14px] md:text-[15px]">
                {it.body}
              </P>
            </Card>
          );
        })}
      </div>

      <div className="mt-9">
        <a
          href="#how-it-works"
          className={[
            "inline-flex items-center gap-2",
            "text-[13px] text-[var(--muted)]",
            "transition hover:text-[var(--text)]",
          ].join(" ")}
        >
          <span className="font-[var(--font-display)] tracking-[0.08em]">
            See how AEGIS works
          </span>
          <span aria-hidden className="text-[var(--muted)]">
            →
          </span>
        </a>
      </div>
    </Section>
  );
}

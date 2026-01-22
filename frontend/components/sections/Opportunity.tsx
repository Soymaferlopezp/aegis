import Section from "@/components/ui/Section";
import Card from "@/components/ui/Card";
import { H1, Overline, P } from "@/components/ui/Text";
import SectionGlow from "@/components/ui/SectionGlow";

const steps = [
  {
    title: "Intent stays flexible",
    body:
      "Agents can interpret human intent and propose payments without hardcoding every possible decision.",
  },
  {
    title: "Control becomes enforceable",
    body:
      "AEGIS validates every proposed payment against on-chain financial rules before execution.",
  },
  {
    title: "Execution is conditional",
    body:
      "Only approved transactions are executed via Circle. If a rule is violated, nothing moves.",
  },
];

function Node({
  index,
  title,
  body,
}: {
  index: string;
  title: string;
  body: string;
}) {
  return (
    <Card
      className={[
        "relative p-6 md:p-7",
        "bg-[rgba(17,24,39,0.30)]",
        "transition hover:bg-[rgba(17,24,39,0.42)]",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        <div
          className={[
            "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center",
            "rounded-xl border border-[var(--border)]",
            "bg-[rgba(11,15,20,0.25)]",
          ].join(" ")}
        >
          <span className="font-[var(--font-display)] text-[13px] tracking-[0.12em] text-[var(--muted)]">
            {index}
          </span>
        </div>

        <div className="min-w-0">
          <div className="font-[var(--font-display)] text-[16px] text-[var(--text)]">
            {title}
          </div>
          <P className="mt-2">{body}</P>
        </div>
      </div>
    </Card>
  );
}

export default function Opportunity() {
  return (
    <Section className="pt-10 md:pt-16">
      <div className="relative">
        <SectionGlow variant="mix" />

        <div className="max-w-4xl">
          <Overline>FROM TRUST TO ENFORCEMENT</Overline>
          <H1 className="mt-4">
            Turn AI autonomy into <em className="italic font-normal">enforceable</em>{" "}
            financial control.
          </H1>
        </div>

        <div className="relative mt-12">
          {/* Vertical conductor line (desktop) */}
          <div className="pointer-events-none absolute left-6 top-0 hidden h-full w-px md:block">
            <div className="h-full w-px bg-[rgba(94,234,212,0.16)]" />
            <div className="absolute inset-0">
              <div className="absolute top-[18%] h-2 w-2 -translate-x-1/2 rounded-full bg-[rgba(94,234,212,0.28)] shadow-[0_0_0_6px_rgba(20,184,166,0.06)]" />
              <div className="absolute top-[50%] h-2 w-2 -translate-x-1/2 rounded-full bg-[rgba(94,234,212,0.28)] shadow-[0_0_0_6px_rgba(20,184,166,0.06)]" />
              <div className="absolute top-[82%] h-2 w-2 -translate-x-1/2 rounded-full bg-[rgba(94,234,212,0.28)] shadow-[0_0_0_6px_rgba(20,184,166,0.06)]" />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-12 md:gap-6">
            <div className="md:col-span-8 md:col-start-3">
              <div className="grid gap-5">
                <Node index="01" title={steps[0].title} body={steps[0].body} />
                <Node index="02" title={steps[1].title} body={steps[1].body} />
                <Node index="03" title={steps[2].title} body={steps[2].body} />
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
            </div>
          </div>
        </div>

      </div>
    </Section>
  );
}

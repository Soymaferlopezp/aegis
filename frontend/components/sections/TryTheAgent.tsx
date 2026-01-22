import Section from "@/components/ui/Section";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { H1, Overline, P } from "@/components/ui/Text";
import { Eye, Shield, GitCommitHorizontal, X } from "lucide-react";

const explore = [
  {
    icon: Eye,
    title: "AI intent and payment proposal",
    body: "Understand how an intent becomes a proposed payment (amount, target).",
  },
  {
    icon: Shield,
    title: "On-chain rule evaluation",
    body: "See how the Vault evaluates the proposal against enforced financial rules.",
  },
  {
    icon: GitCommitHorizontal,
    title: "Deterministic outcome (would be approved or blocked)",
    body: "Observe the outcome deterministically — without moving any funds.",
  },
];

const notDo = [
  "Execute real transactions",
  "Approve or reject payments from the UI",
  "Modify on-chain rules",
  "Bypass the AEGIS Vault",
];

export default function TryTheAgent() {
  return (
    <Section id="try-agent" className="pt-10 md:pt-16">
      <div className="grid items-start gap-10 md:grid-cols-12">
        {/* Left: editorial */}
        <div className="md:col-span-5">
          <Overline>TRY THE AGENT</Overline>
          <H1 className="mt-4">
            Explore how an AI payment is <em className="italic font-normal">evaluated</em>.
          </H1>

          <div className="mt-5 text-[13px] text-[var(--muted)]">
            No funds are moved. No execution happens.
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button href="#how-it-works" variant="primary">
              Explore the Flow
            </Button>
            <Button href="#faq" variant="secondary">
              Read the FAQ
            </Button>
          </div>
        </div>

        {/* Right: content */}
        <div className="md:col-span-7">
          <Card className="p-5 md:p-7">
            <div className="font-[var(--font-display)] text-[13px] tracking-[0.18em] text-[var(--muted)]">
              What you can explore
            </div>

            <div className="mt-6 grid gap-4">
              {explore.map((it) => {
                const Icon = it.icon;
                return (
                  <div key={it.title} className="flex items-start gap-4">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[rgba(11,15,20,0.25)]">
                      <Icon className="h-4.5 w-4.5 text-[var(--teal-soft)]" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-[var(--font-display)] text-[15px] text-[var(--text)]">
                        {it.title}
                      </div>
                      <P className="mt-1">{it.body}</P>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 border-t border-[var(--border)] pt-8">
              <div className="font-[var(--font-display)] text-[13px] tracking-[0.18em] text-[var(--muted)]">
                What this does not do
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {notDo.map((t) => (
                  <div key={t} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[rgba(11,15,20,0.22)]">
                      <X className="h-4 w-4 text-[rgba(229,231,235,0.45)]" />
                    </div>
                    <div className="text-[14px] leading-relaxed text-[color:rgba(229,231,235,0.78)]">
                      {t}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="mt-4 text-[12px] text-[var(--muted)]">
            Explore is observational by design. Enforcement remains on-chain.
          </div>
        </div>
      </div>
    </Section>
  );
}

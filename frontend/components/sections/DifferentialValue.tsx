import Section from "@/components/ui/Section";
import { H1, Overline, P } from "@/components/ui/Text";
import { Check, X } from "lucide-react";

const left = [
  "Rely on prompts and best-effort rules",
  "Enforce limits at the UI or application layer",
  "Assume correct agent behavior",
  "Detect issues after execution",
  "Cannot prevent on-chain actions once triggered",
];

const right = [
  "Enforces financial rules on-chain",
  "Blocks execution before funds move",
  "Does not trust agent behavior",
  "Produces deterministic outcomes",
  "Separates decision-making from execution",
];

function Row({
  type,
  text,
  muted = false,
}: {
  type: "good" | "bad";
  text: string;
  muted?: boolean;
}) {
  const Icon = type === "good" ? Check : X;

  const iconColor =
    type === "good"
      ? "text-[var(--teal-soft)]"
      : "text-[rgba(229,231,235,0.35)]";

  const textColor = muted
    ? "text-[color:rgba(229,231,235,0.52)]"
    : "text-[color:rgba(229,231,235,0.86)]";

  const boxBg = muted ? "bg-[rgba(255,255,255,0.02)]" : "bg-[rgba(11,15,20,0.22)]";
  const boxBorder = muted ? "border-[rgba(255,255,255,0.06)]" : "border-[var(--border)]";

  return (
    <div className="flex items-start gap-3">
      <div
        className={[
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          "border",
          boxBorder,
          boxBg,
        ].join(" ")}
      >
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div className={`text-[14px] leading-relaxed ${textColor}`}>{text}</div>
    </div>
  );
}

export default function DifferentialValue() {
  return (
    <Section className="pt-10 md:pt-16">
      {/* Background glow (section-level, subtle) */}
      <div className="relative">
        <div className="pointer-events-none absolute -inset-x-8 -top-10 -z-10 h-[420px]">
          <div className="absolute left-[10%] top-0 h-64 w-64 rounded-full bg-[rgba(20,184,166,0.10)] blur-3xl" />
          <div className="absolute right-[12%] top-10 h-72 w-72 rounded-full bg-[rgba(59,130,246,0.07)] blur-3xl" />
        </div>

        <div className="max-w-4xl">
          <Overline>DIFFERENTIAL VALUE</Overline>
          <H1 className="mt-4">
            Most AI systems rely on <em className="italic font-normal">trust</em>. AEGIS relies
            on enforcement.
          </H1>
        </div>

        {/* Editorial compare layout (Weplash-like) */}
        <div className="mt-12 grid gap-6 md:grid-cols-12">
          {/* Left (muted) */}
          <div className="md:col-span-6">
            <div className="rounded-3xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-6 md:p-7">
              <div className="flex items-center justify-between">
                <div className="font-[var(--font-display)] text-[13px] tracking-[0.18em] text-[rgba(229,231,235,0.45)]">
                  Typical AI agent systems
                </div>
                <div className="text-[12px] text-[rgba(229,231,235,0.35)]">
                  (soft control)
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {left.map((t) => (
                  <Row key={t} type="bad" text={t} muted />
                ))}
              </div>
            </div>
          </div>

          {/* Right (highlight) */}
          <div className="md:col-span-6">
            <div className="relative rounded-3xl border border-[rgba(94,234,212,0.22)] bg-[rgba(17,24,39,0.42)] p-6 md:p-7">
              {/* Inner glow ring */}
              <div className="pointer-events-none absolute inset-0 rounded-3xl shadow-[0_0_0_1px_rgba(20,184,166,0.18),0_0_40px_rgba(20,184,166,0.10)]" />
              <div className="flex items-center justify-between">
                <div className="font-[var(--font-display)] text-[13px] tracking-[0.18em] text-[var(--text)]">
                  AEGIS
                </div>
                <div className="text-[12px] text-[rgba(229,231,235,0.70)]">
                  (hard enforcement)
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {right.map((t) => (
                  <Row key={t} type="good" text={t} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 max-w-4xl">
          <P className="text-[14px] md:text-[15px]">
            AEGIS is not an AI assistant. It is a financial control layer for AI systems.
          </P>
        </div>
      </div>
    </Section>
  );
}

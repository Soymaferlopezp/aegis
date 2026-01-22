import Image from "next/image";
import Section from "@/components/ui/Section";
import { H1, Overline, P } from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

import ProofOfEcosystem from "@/components/sections/ProofOfEcosystem";
import Problem from "@/components/sections/Problem";
import Opportunity from "@/components/sections/Opportunity";
import HowAegisWorks from "@/components/sections/HowAegisWorks";
import Guardrails from "@/components/sections/Guardrails";
import DifferentialValue from "@/components/sections/DifferentialValue";
import TryTheAgent from "@/components/sections/TryTheAgent";
import Team from "@/components/sections/Team";
import FAQ from "@/components/sections/FAQ";

export default function Page() {
  return (
    <>
      {/* HERO */}
      <Section className="pt-16 md:pt-20">
        <div className="grid items-center gap-10 md:grid-cols-12">
          <div className="md:col-span-6">
            <Overline>ON-CHAIN FINANCIAL GUARDRAILS FOR AI</Overline>

            <H1 className="mt-4">
              AI payments, with <em className="italic font-normal">on-chain</em> limits
            </H1>

            <div className="mt-5 space-y-1">
              <P>Agents can propose what to pay.</P>
              <P>The Vault enforces financial limits.</P>
              <P>Circle executes on-chain.</P>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="#try-agent" variant="primary">
                Try the Agent
              </Button>
              <Button href="#how-it-works" variant="secondary">
                How Aegis Works
              </Button>
            </div>

            <div className="mt-6 text-[12px] text-[var(--muted)]">
              UI is observational. Enforcement happens on-chain.
            </div>
          </div>

          <div className="md:col-span-6">
            <Card className="p-4 md:p-6">
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-[var(--border)] bg-[rgba(11,15,20,0.35)]">
                <Image
                  src="/brand/aegis-flow.png"
                  alt="AEGIS flow"
                  fill
                  className="object-contain p-4 md:p-6"
                  priority
                />
              </div>
            </Card>
          </div>
        </div>
      </Section>

      <ProofOfEcosystem />
      <Problem />
      <Opportunity />
      <HowAegisWorks />
      <Guardrails />
      <DifferentialValue />
      <TryTheAgent />
      <Team />
      <FAQ />

      {/* Anchor targets for navbar */}
      <div id="architecture" />
    </>
  );
}

import Image from "next/image";
import Section from "@/components/ui/Section";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { H1, Overline, P } from "@/components/ui/Text";
import SectionGlow from "@/components/ui/SectionGlow";

export default function HowAegisWorks() {
  return (
    <Section id="how-it-works" className="pt-10 md:pt-16">
      <div className="relative">
        <SectionGlow variant="mix" className="h-[520px]" />

        <div className="grid items-start gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Overline>HOW AEGIS WORKS</Overline>
            <H1 className="mt-4">
              Every AI payment follows a{" "}
              <em className="italic font-normal">strict</em> on-chain path.
            </H1>

            <div className="mt-6 space-y-2 text-[15px] text-[color:rgba(229,231,235,0.82)]">
              <div>• AI agents propose payments based on intent</div>
              <div>• AEGIS enforces financial rules on-chain</div>
              <div>• Only approved transactions are executed</div>
            </div>

            <P className="mt-6">
              The frontend does not approve or reject payments. All enforcement happens
              on-chain.
            </P>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button href="#try-agent" variant="primary">
                Try the Agent
              </Button>
            </div>
          </div>

          <div className="md:col-span-7">
            <Card className="p-4 md:p-6">
              <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[rgba(11,15,20,0.28)]">
                <div className="relative aspect-[9/16] sm:aspect-[4/5] md:aspect-[3/4]">
                  <Image
                    src="/brand/aegis-workflow.png"
                    alt="How AEGIS works flow"
                    fill
                    priority
                    className="object-contain p-5 md:p-7"
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Section>
  );
}

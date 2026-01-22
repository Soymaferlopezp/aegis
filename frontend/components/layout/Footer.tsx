import Image from "next/image";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-[var(--border)]">
      <div className="relative overflow-hidden bg-[rgba(11,15,20,0.55)]">
        {/* Subtle closing glow (premium, not loud) */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-[12%] h-80 w-80 rounded-full bg-[rgba(20,184,166,0.10)] blur-3xl" />
          <div className="absolute -top-44 right-[10%] h-96 w-96 rounded-full bg-[rgba(59,130,246,0.07)] blur-3xl" />
        </div>

        <Container className="relative py-16 md:py-20">
          {/* 3 columns: left copy / center CTA / right logo */}
          <div className="grid gap-10 md:grid-cols-12 md:items-center">
            {/* Left */}
            <div className="md:col-span-5">
              <div className="font-[var(--font-display)] text-[40px] leading-[0.98] tracking-[-0.02em] text-[var(--text)] md:text-[56px]">
                Control AI payments.
                <br />
                Before they happen.
              </div>

              <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-[color:rgba(229,231,235,0.78)] md:text-[16px]">
                AEGIS enforces financial limits on AI agents before any on-chain execution occurs.
              </p>
            </div>

            {/* Center CTA (true center) */}
            <div className="md:col-span-4 md:flex md:justify-center">
              <div className="flex">
                <Button href="#try-agent" variant="primary">
                  Go! Try the Agent
                </Button>
              </div>
            </div>

            {/* Right logo as “seal” */}
            <div className="md:col-span-3 md:flex md:justify-end">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="pointer-events-none absolute -inset-3 rounded-2xl bg-[rgba(20,184,166,0.08)] blur-xl" />
                  <Image
                    src="/brand/aegis.png"
                    alt="AEGIS"
                    width={1000}
                    height={1000}
                    className="relative rounded-xl border border-[rgba(94,234,212,0.18)] bg-[rgba(11,15,20,0.25)] p-2"
                  />
                </div>

                <div className="leading-tight">
                  <div className="inline-flex items-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-1">
                    <span className="font-[var(--font-display)] text-[12px] tracking-[0.18em] text-[rgba(229,231,235,0.70)]">
                      AEGIS
                    </span>
                  </div>
                  <div className="mt-2 text-[12px] text-[var(--muted)]">
                    On-chain control layer
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: signature + copyright */}
          <div className="mt-14 border-t border-[var(--border)] pt-8">
            <div className="flex flex-col gap-2 text-[12px] text-[var(--muted)] md:flex-row md:items-center md:justify-between">
              <div>Built with 🤍 by Blockbears</div>
              <div>©2026 All rights reserved - Blockbears</div>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}

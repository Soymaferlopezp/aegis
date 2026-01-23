import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-[var(--border)] bg-[rgba(11,15,20,0.72)] backdrop-blur-md">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/brand/aegis.png"
              alt="AEGIS"
              width={90}
              height={90}
              priority
              className="rounded-md"
            />
            <div className="leading-none">
              <div className="font-[var(--font-display)] text-[13px] tracking-[0.18em] text-[var(--muted)]">
                AEGIS
              </div>
              <div className="text-[12px] text-[var(--muted)]">
                On-chain guardrails
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-[13px] text-[var(--muted)] md:flex">
            <a href="#how-it-works" className="transition hover:text-[var(--text)]">
              How it works
            </a>
            <a href="#guardrails" className="transition hover:text-[var(--text)]">
              Guardrails
            </a>
            <a href="#architecture" className="transition hover:text-[var(--text)]">
              Architecture
            </a>
            <a href="#faq" className="transition hover:text-[var(--text)]">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button href="/console" variant="primary" size="sm">
              Try the Agent
            </Button>
          </div>
        </Container>
      </div>
    </header>
  );
}

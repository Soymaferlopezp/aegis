import Image from "next/image";
import Section from "@/components/ui/Section";
import { H2, P } from "@/components/ui/Text";

const partners = [
  { name: "LabLab", src: "/brand/partners/lablab.svg", imgClass: "h-12" }, // square → needs more height
  { name: "Circle", src: "/brand/partners/circle.svg", imgClass: "h-7" },
  { name: "Arc", src: "/brand/partners/arc.svg", imgClass: "h-7" },
  { name: "Gemini", src: "/brand/partners/gemini.svg", imgClass: "h-7" },
];

export default function ProofOfEcosystem() {
  return (
    <Section className="pt-6 md:pt-10">
      <div className="grid gap-10 md:grid-cols-12 md:items-end">
        <div className="md:col-span-5">
          <H2>Ecosystem Validation</H2>
          <P className="mt-3">
            AEGIS was <em className="italic font-normal">built and evaluated</em> across recognized AI and Web3 platforms.
          </P>
        </div>

        <div className="md:col-span-7">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {partners.map((p) => (
              <div
                key={p.name}
                className={[
                  "group flex h-16 items-center justify-center",
                  "rounded-2xl border border-[var(--border)]",
                  "bg-[rgba(17,24,39,0.30)]",
                  "transition",
                  "hover:border-[var(--border-strong)]",
                  "hover:bg-[rgba(17,24,39,0.45)]",
                ].join(" ")}
              >
                <Image
                  src={p.src}
                  alt={p.name}
                  width={140}
                  height={44}
                  className={[
                    p.imgClass,
                    "w-auto",
                    "opacity-70",
                    "transition",
                    "group-hover:opacity-95",
                    "brightness-125",
                  ].join(" ")}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

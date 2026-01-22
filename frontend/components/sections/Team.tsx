import Image from "next/image";
import Section from "@/components/ui/Section";
import { H1, Overline } from "@/components/ui/Text";
import SectionGlow from "@/components/ui/SectionGlow";

const people = [
  {
    name: "Mafer Lopez",
    role: "Developer & Design",
    img: "/team/mafer.png",
  },
  {
    name: "Mary Lopez",
    role: "PM & BizDev",
    img: "/team/mary.png",
  },
];

function TeamCard({
  name,
  role,
  img,
}: {
  name: string;
  role: string;
  img: string;
}) {
  return (
    <div className="relative rounded-3xl border border-[rgba(94,234,212,0.22)] bg-[rgba(17,24,39,0.42)] p-6 md:p-7">
      {/* Inner glow ring */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl shadow-[0_0_0_1px_rgba(20,184,166,0.18),0_0_40px_rgba(20,184,166,0.10)]" />

      <div className="relative flex items-center gap-5">
        {/* Avatar */}
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-[rgba(94,234,212,0.35)] bg-[rgba(11,15,20,0.25)]">
          <Image src={img} alt={name} fill className="object-cover" />
        </div>

        {/* Info */}
        <div className="min-w-0">
          <div className="font-[var(--font-display)] text-[17px] text-[var(--text)]">
            {name}
          </div>
          <div className="mt-0.5 text-[13px] text-[color:rgba(229,231,235,0.78)]">
            {role}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Team() {
  return (
    <Section className="pt-10 md:pt-16">
      <div className="relative">
        {/* Soft glow for the whole section (lower intensity than Differential) */}
        <SectionGlow variant="teal" className="h-[320px]" />

        <div className="mx-auto max-w-4xl text-center">
          <Overline>THE TEAM</Overline>
          <H1 className="mt-4">
            Built by <em className="italic font-normal">Blockbears</em>
          </H1>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          {people.map((p) => (
            <TeamCard key={p.name} {...p} />
          ))}
        </div>
      </div>
    </Section>
  );
}

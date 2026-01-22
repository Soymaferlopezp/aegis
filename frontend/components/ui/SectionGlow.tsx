import { cn } from "@/lib/cn";

type GlowVariant = "mix" | "teal" | "blue";

export default function SectionGlow({
  className,
  variant = "mix",
}: {
  className?: string;
  variant?: GlowVariant;
}) {
  const teal = "bg-[rgba(20,184,166,0.10)]";
  const blue = "bg-[rgba(59,130,246,0.07)]";

  return (
    <div className={cn("pointer-events-none absolute -inset-x-8 -top-10 -z-10 h-[420px]", className)}>
      {(variant === "mix" || variant === "teal") && (
        <div className={cn("absolute left-[10%] top-0 h-64 w-64 rounded-full blur-3xl", teal)} />
      )}
      {(variant === "mix" || variant === "blue") && (
        <div className={cn("absolute right-[12%] top-10 h-72 w-72 rounded-full blur-3xl", blue)} />
      )}
    </div>
  );
}

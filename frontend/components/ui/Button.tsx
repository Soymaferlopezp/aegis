import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

function styles(variant: Variant) {
  switch (variant) {
    case "primary":
      return cn(
        "bg-[var(--teal)] text-black",
        "hover:bg-[var(--teal-soft)]",
        "shadow-[0_0_0_1px_rgba(20,184,166,0.25)]"
      );
    case "secondary":
      return cn(
        "bg-[rgba(255,255,255,0.06)] text-[var(--text)]",
        "border border-[var(--border)]",
        "hover:bg-[rgba(255,255,255,0.09)]"
      );
    case "ghost":
    default:
      return cn(
        "bg-transparent text-[var(--text)]",
        "hover:bg-[rgba(255,255,255,0.06)]"
      );
  }
}

function sizes(size: Size) {
  switch (size) {
    case "sm":
      return "h-9 px-3 text-[13px]";
    case "md":
    default:
      return "h-11 px-4 text-[14px]";
  }
}

export default function Button({
  href,
  onClick,
  children,
  variant = "secondary",
  size = "md",
  className,
}: {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  const base = cn(
    "inline-flex items-center justify-center gap-2",
    "rounded-xl",
    "transition",
    "focus-visible:shadow-[0_0_0_3px_var(--ring)]",
    sizes(size),
    styles(variant),
    className
  );

  if (href) {
    return (
      <Link href={href} className={base}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={base}>
      {children}
    </button>
  );
}

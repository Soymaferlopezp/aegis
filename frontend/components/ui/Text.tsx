import { cn } from "@/lib/cn";

export function Overline({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "text-[12px] uppercase tracking-[0.22em] text-[var(--muted)]",
        "font-[var(--font-display)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function H1({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h1
      className={cn(
        "font-[var(--font-display)] font-semibold",
        "text-4xl leading-[1.05] md:text-6xl md:leading-[1.02]",
        "tracking-[-0.02em]",
        className
      )}
    >
      {children}
    </h1>
  );
}

export function H2({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      className={cn(
        "font-[var(--font-display)] font-semibold",
        "text-2xl leading-tight md:text-3xl",
        "tracking-[-0.01em]",
        className
      )}
    >
      {children}
    </h2>
  );
}

export function P({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "text-[15px] leading-relaxed md:text-[17px]",
        "text-[color:rgba(229,231,235,0.82)]",
        className
      )}
    >
      {children}
    </p>
  );
}

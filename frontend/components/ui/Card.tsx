import { cn } from "@/lib/cn";

export default function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--border)]",
        "bg-[rgba(17,24,39,0.55)] backdrop-blur",
        "shadow-[0_1px_0_rgba(255,255,255,0.05)]",
        className
      )}
    >
      {children}
    </div>
  );
}

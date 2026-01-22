import { cn } from "@/lib/cn";
import Container from "@/components/ui/Container";

export default function Section({
  id,
  className,
  children,
  bleed = false,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
  bleed?: boolean;
}) {
  const inner = (
    <div className={cn("py-20 md:py-28", className)}>{children}</div>
  );

  if (bleed) return <section id={id}>{inner}</section>;

  return (
    <section id={id}>
      <Container>{inner}</Container>
    </section>
  );
}

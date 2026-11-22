import { cn } from "@/lib/utils";

/** White card on the near-white page, hairline ring, 28px radius. */
export function Card({
  className,
  children,
  index,
  tint,
}: {
  className?: string;
  children: React.ReactNode;
  /** Position in reading order, used to stagger the entrance. */
  index?: number;
  /** The one insight card per screen: accent 50 background. */
  tint?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-l p-6",
        tint ? "bg-accent-50" : "card",
        index !== undefined && "rise",
        className,
      )}
      style={index !== undefined ? ({ "--i": index } as React.CSSProperties) : undefined}
    >
      {children}
    </section>
  );
}

/** Card title row: H3 900 on the left, an optional chip or action on the right. */
export function CardHeader({
  title,
  right,
  sub,
  className,
}: {
  title: React.ReactNode;
  right?: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h3 className="text-h3 text-ink">{title}</h3>
        {sub ? <p className="mt-1 text-body-s text-muted">{sub}</p> : null}
      </div>
      {right ? <div className="flex shrink-0 items-center gap-2">{right}</div> : null}
    </div>
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("text-eyebrow uppercase", className)}>{children}</div>;
}

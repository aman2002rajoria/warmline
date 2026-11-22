import { cn } from "@/lib/utils";
import { CountUp } from "./feedback";

/** KPI card: muted label, big 900 number, sub-line that explains the number. */
export function Kpi({
  label,
  value,
  sub,
  accent,
  index,
  suffix,
}: {
  label: string;
  value: number;
  sub: string;
  accent?: boolean;
  index?: number;
  suffix?: string;
}) {
  return (
    <div
      className="card rise rounded-m p-5"
      style={{ "--i": index ?? 0 } as React.CSSProperties}
    >
      <div className="text-body-s font-semibold text-muted">{label}</div>
      <div className={cn("mt-3 text-number", accent ? "text-accent-500" : "text-ink")}>
        <CountUp value={value} />
        {suffix}
      </div>
      <div className="mt-3 text-body-s text-muted">{sub}</div>
    </div>
  );
}

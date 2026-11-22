import { cn } from "@/lib/utils";
import type { ProfessorStatus } from "@/types";

export type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface text-ink-2",
  accent: "bg-accent-50 text-accent-700",
  success: "bg-success-tint text-success-text",
  warning: "bg-warning-tint text-warning-text",
  danger: "bg-danger-tint text-danger-text",
};

/** Pill chip, 14/500. Status chips use the tint as background (§3.3). */
export function Chip({
  tone = "neutral",
  className,
  children,
  onClick,
  title,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  const cls = cn(
    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-body-s",
    TONES[tone],
    onClick && "cursor-pointer transition-transform active:scale-95",
    className,
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls} title={title}>
        {children}
      </button>
    );
  }
  return (
    <span className={cls} title={title}>
      {children}
    </span>
  );
}

/** Small uppercase badge: AI, BETA, TEST DATA. */
export function Badge({
  tone = "accent",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-[3px] text-badge uppercase",
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

export const STATUS_META: Record<ProfessorStatus, { label: string; tone: Tone }> = {
  pending: { label: "No draft", tone: "neutral" },
  drafted: { label: "Needs review", tone: "warning" },
  approved: { label: "Approved", tone: "accent" },
  sent: { label: "Sent", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
};

export function StatusChip({ status }: { status: ProfessorStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <Chip tone={meta.tone} className="px-2.5 py-1 text-label">
      {meta.label}
    </Chip>
  );
}

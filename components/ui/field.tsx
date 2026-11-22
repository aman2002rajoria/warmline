import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cn("input", className)} {...rest} />;
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cn("input", className)} {...rest} />;
});

/** Label above (13/600), help or error text below. */
export function Field({
  label,
  htmlFor,
  help,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  help?: React.ReactNode;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className="text-label text-ink-2">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-body-s text-danger-text">{error}</p>
      ) : help ? (
        <p className="text-body-s text-muted">{help}</p>
      ) : null}
    </div>
  );
}

/** Round checkbox: a native input underneath for keyboard and screen readers. */
export function Checkbox({
  checked,
  onChange,
  label,
  indeterminate,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  indeterminate?: boolean;
}) {
  return (
    <label
      className="relative inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        className="peer absolute inset-0 cursor-pointer opacity-0"
        checked={checked}
        aria-label={label}
        aria-checked={indeterminate ? "mixed" : checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden
        className={cn(
          "flex h-[22px] w-[22px] items-center justify-center rounded-full transition-colors peer-focus-visible:shadow-[0_0_0_3px_var(--accent-200)]",
          checked || indeterminate
            ? "bg-accent-500 text-white"
            : "bg-white shadow-[inset_0_0_0_1.5px_var(--faint)]",
        )}
      >
        {indeterminate ? (
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M2 5h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : checked ? (
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path
              d="M2.5 6.2 5 8.5l4.5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
    </label>
  );
}

import { forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Buttons (design.md §6). Every button has the 3D lip.
 *   primary: the one action a screen exists for (one per view)
 *   dark:    strong secondary actions
 *   ghost:   everything else
 *   danger:  only inside a confirm modal
 */
export type ButtonVariant = "primary" | "dark" | "ghost" | "danger";
export type ButtonSize = "md" | "sm" | "icon";

export function buttonClass(
  variant: ButtonVariant = "dark",
  size: ButtonSize = "md",
  extra?: string,
) {
  return cn(
    "btn",
    variant !== "dark" && variant,
    size === "sm" && "sm",
    size === "icon" && "icon",
    extra,
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "dark", size = "md", className, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass(variant, size, className)}
      {...rest}
    />
  );
});

export function ButtonLink({
  href,
  variant = "dark",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}

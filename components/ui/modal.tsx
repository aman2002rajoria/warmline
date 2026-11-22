"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

/** Modal (§7): max 520px, 28px radius, lifted shadow, blurred backdrop. */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgba(0,0,0,.4)] backdrop-blur-[4px] [animation:fade-in_.2s_var(--soft)]" />
        <Dialog.Content
          className={`fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-l bg-card p-7 shadow-lift outline-none ${wide ? "max-w-[640px]" : "max-w-[520px]"}`}
        >
          <div className="[animation:modal-in_.4s_var(--spring)]">
            <div className="flex items-start justify-between gap-4">
              <Dialog.Title className="text-h2 text-ink">{title}</Dialog.Title>
              <Dialog.Close className="btn ghost icon -mr-2 -mt-1" aria-label="Close">
                <X size={18} strokeWidth={1.75} />
              </Dialog.Close>
            </div>
            {description ? (
              <Dialog.Description className="mt-2 text-body text-ink-2">
                {description}
              </Dialog.Description>
            ) : (
              <Dialog.Description className="sr-only">{title}</Dialog.Description>
            )}
            {children ? <div className="mt-6">{children}</div> : null}
            {footer ? (
              <div className="mt-7 flex flex-wrap items-center justify-end gap-3">{footer}</div>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

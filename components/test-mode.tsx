"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { Badge } from "@/components/ui/chip";

async function setMode(mode: "on" | "reset" | "off") {
  const res = await fetch("/api/test-mode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode }),
  });
  if (!res.ok) throw new Error("Couldn't switch modes. Try again.");
}

/** "Try with test data": loads fixtures and opens People. */
export function TryTestData({ variant = "ghost" }: { variant?: ButtonVariant }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant={variant}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await setMode("on");
          router.push("/people");
          router.refresh();
        } catch (err) {
          toast.error((err as Error).message);
          setBusy(false);
        }
      }}
    >
      {busy ? "Loading test data" : "Try with test data"}
    </Button>
  );
}

/** TEST DATA badge in the top bar, with its menu (§16). */
export function TestModeMenu({ publicDemo = false }: { publicDemo?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  async function run(mode: "reset" | "off") {
    setOpen(false);
    try {
      await setMode(mode);
      toast.success(mode === "off" ? "Back to your own data." : "Test data reset.");
      router.push(mode === "off" ? "/" : "/people");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const item = "w-full rounded-s px-3 py-2.5 text-left text-body-s text-ink hover:bg-surface";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 items-center"
      >
        <Badge tone="warning">Test data</Badge>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-12 z-40 w-[260px] rounded-[16px] bg-card p-2 shadow-float [animation:pop_.3s_var(--spring)]"
        >
          <p className="px-3 pb-2 pt-1 text-body-s text-muted">
            {publicDemo
              ? "A public demo with sample people. Sends are simulated and nothing is emailed. Add your own Gemini key in Settings for real AI lines."
              : "Sample people. Sends are simulated and nothing is emailed."}
          </p>
          {publicDemo ? null : (
            <button role="menuitem" type="button" className={item} onClick={() => run("off")}>
              Switch to my own data
            </button>
          )}
          <button role="menuitem" type="button" className={item} onClick={() => run("reset")}>
            Reset test data
          </button>
        </div>
      ) : null}
    </div>
  );
}

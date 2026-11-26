"use client";

import { Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/ui/card";

/** Sign in with Google to send from your own Gmail. The demo never sends, so sign-in is off there. */
export function GmailConnect({ testMode, connectedAs }: { testMode: boolean; connectedAs?: string }) {
  return (
    <Card className="h-full">
      <CardHeader title={<span className="inline-flex items-center gap-2"><Mail size={20} strokeWidth={1.9} className="text-accent-600" /> Gmail</span>} sub="Emails go out from your own account, one at a time." />
      {connectedAs ? (
        <div className="rounded-m bg-success-tint px-4 py-3 text-body-s text-success-text">Sending as {connectedAs}</div>
      ) : null}
      <button
        type="button"
        onClick={() => toast(testMode ? "Test mode: Google sign-in is off in the demo, and nothing is ever emailed." : "Google sign-in is next on the list. For now, use a Gmail app password below.")}
        className="mt-2 flex w-full items-center justify-center gap-3 rounded-full bg-card px-5 py-3 font-semibold text-ink shadow-[inset_0_0_0_1.5px_var(--line),0_4px_0_var(--surface-2)] transition-transform hover:-translate-y-0.5 active:translate-y-1"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        Sign in with Google
      </button>
      <p className="mt-3 flex items-start gap-2 text-label text-muted">
        <ShieldCheck size={15} strokeWidth={1.9} className="mt-0.5 shrink-0 text-accent-600" />
        Warmline only asks to send email for you. It never reads your inbox without asking.
      </p>
    </Card>
  );
}

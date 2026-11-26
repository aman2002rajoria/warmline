"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Check, KeyRound, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Chip } from "@/components/ui/chip";
import { getOwnKey, setOwnKey } from "@/lib/own-key";

/**
 * Bring your own Gemini key. The demo runs on test data; with a key, "Write draft" asks Gemini for
 * real lines about the test people. The key stays in this browser and is sent only with draft requests.
 */
export function OwnKeyCard() {
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    const k = getOwnKey();
    setKey(k);
    setSaved(Boolean(k));
  }, []);

  async function check() {
    setChecking(true);
    try {
      const res = await fetch("/api/gemini/check", { method: "POST", headers: { "x-gemini-key": key.trim() } });
      const r = (await res.json()) as { ok: boolean; message: string };
      if (r.ok) toast.success(r.message);
      else toast.error(r.message);
    } catch (e) {
      toast.error((e as Error).message);
    }
    setChecking(false);
  }

  return (
    <Card className="mb-6">
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <KeyRound size={20} strokeWidth={1.9} className="text-accent-600" /> Your Gemini key
          </span>
        }
        sub="This demo runs on test data and never sends email. Add your own key and “Write draft” asks Gemini for real lines."
      />
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={key}
            onChange={(e) => { setKey(e.target.value); setSaved(false); }}
            placeholder="Paste your Gemini API key"
            aria-label="Your Gemini API key"
            className="min-w-[260px] flex-1 font-mono"
          />
          {saved ? <Chip tone="success"><Check size={14} strokeWidth={2} /> In use</Chip> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" size="sm" disabled={!key.trim() || saved} onClick={() => { setOwnKey(key); setSaved(true); toast.success("Key saved in this browser."); }}>
            <Check size={16} strokeWidth={1.9} /> Use this key
          </Button>
          <Button variant="ghost" size="sm" disabled={!key.trim() || checking} onClick={check}>
            {checking ? "Checking…" : "Check key"}
          </Button>
          {saved ? (
            <Button variant="ghost" size="sm" onClick={() => { setOwnKey(""); setKey(""); setSaved(false); toast.success("Key removed from this browser."); }}>
              <Trash2 size={16} strokeWidth={1.9} /> Remove
            </Button>
          ) : null}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="link inline-flex items-center gap-0.5 text-body-s">
            Get a free key <ArrowUpRight size={14} strokeWidth={1.75} />
          </a>
        </div>
        <p className="flex items-start gap-2 rounded-s bg-surface px-4 py-3 text-body-s text-ink-2">
          <ShieldCheck size={18} strokeWidth={1.9} className="mt-0.5 shrink-0 text-accent-600" />
          Kept only in this browser. It travels with each draft request, through this app&rsquo;s server to Google, and is never saved on the server.
        </p>
      </div>
    </Card>
  );
}

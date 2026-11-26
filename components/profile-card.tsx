"use client";

import { useEffect, useState } from "react";
import { Check, ImagePlus, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { SignatureCard } from "@/components/signature-card";
import { DEFAULT_PROFILE, getProfile, readImage, saveProfile, type Profile } from "@/lib/profile";

/** Your profile, and a live preview of the signature card that goes at the end of every email. */
export function ProfileCard({ testMode }: { testMode: boolean }) {
  const [p, setP] = useState<Profile>(DEFAULT_PROFILE);
  const [saved, setSaved] = useState<Profile>(DEFAULT_PROFILE);
  useEffect(() => {
    const x = getProfile();
    setP(x);
    setSaved(x);
  }, []);
  const dirty = JSON.stringify(p) !== JSON.stringify(saved);
  const set = (k: keyof Profile) => (e: { target: { value: string } }) => setP((x) => ({ ...x, [k]: e.target.value }));
  const pick = (k: "photo" | "logo") => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const url = await readImage(f);
      setP((x) => ({ ...x, [k]: url }));
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Card>
      <CardHeader
        title={<span className="inline-flex items-center gap-2"><UserRound size={20} strokeWidth={1.9} className="text-accent-600" /> Your profile</span>}
        sub={testMode ? "Who the emails come from. In the demo it's kept in this browser." : "Who the emails come from, and the card that ends each one."}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Your name" aria-label="Your name" value={p.name} onChange={set("name")} />
          <Input placeholder="Role" aria-label="Role" value={p.role} onChange={set("role")} />
          <Input placeholder="Company" aria-label="Company" value={p.company} onChange={set("company")} />
          <Input placeholder="Website or LinkedIn" aria-label="Website or LinkedIn" value={p.link} onChange={set("link")} />
          <Input className="sm:col-span-2" placeholder="Phone (optional)" aria-label="Phone" value={p.phone} onChange={set("phone")} />
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
            <label className="btn ghost sm cursor-pointer">
              <ImagePlus size={16} strokeWidth={1.9} /> {p.photo ? "Change photo" : "Add a photo"}
              <input type="file" accept="image/*" className="hidden" onChange={pick("photo")} />
            </label>
            <label className="btn ghost sm cursor-pointer">
              <ImagePlus size={16} strokeWidth={1.9} /> {p.logo ? "Change logo" : "Add a logo"}
              <input type="file" accept="image/*" className="hidden" onChange={pick("logo")} />
            </label>
            {p.logo ? <button type="button" className="link text-label" onClick={() => setP((x) => ({ ...x, logo: "" }))}>Remove logo</button> : null}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="text-label font-extrabold uppercase tracking-[.06em] text-muted">How it ends each email</div>
          <SignatureCard p={p} />
          <label className="flex cursor-pointer items-center gap-2 text-body-s text-ink-2">
            <input type="checkbox" checked={p.signature} onChange={(e) => setP((x) => ({ ...x, signature: e.target.checked }))} className="h-4 w-4 accent-[var(--accent-500)]" />
            Add this card to every email
          </label>
          <div>
            <Button size="sm" variant="primary" disabled={!dirty} onClick={() => { saveProfile(p); setSaved(p); toast.success("Profile saved."); }}>
              <Check size={16} strokeWidth={1.9} /> {dirty ? "Save profile" : "Saved"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

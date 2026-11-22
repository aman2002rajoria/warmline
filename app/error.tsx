"use client";

import { Button } from "@/components/ui/button";

/** Page-level error state: what went wrong, and a way to try again (§15). */
export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-read rounded-l bg-danger-tint p-7">
      <h1 className="text-h2 text-danger-text">This page didn&rsquo;t load</h1>
      <p className="mt-3 text-body text-ink-2">
        {error.message || "Something went wrong reading your data folder."} Check that the
        project&rsquo;s data folder is readable, then try again.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}

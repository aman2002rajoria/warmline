import Link from "next/link";
import { getSetupStatus } from "@/lib/setup-status";
import { Chip } from "@/components/ui/chip";
import { isTestMode } from "@/lib/test-mode";
import { TestModeMenu } from "@/components/test-mode";
import { PUBLIC_DEMO } from "@/lib/paths";

/** Sticky top bar (§7, ref 08): app mark, name, tagline; setup status on the right. */
export function TopBar() {
  const setup = getSetupStatus();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/[.86] backdrop-blur-[16px]">
      <div className="mx-auto flex h-16 max-w-app items-center justify-between gap-4 px-[clamp(20px,4vw,48px)]">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Warmline home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/art/logo-tile.webp" alt="" width={34} height={36} className="h-9 w-[34px] shrink-0 drop-shadow-[0_4px_8px_rgba(47,107,255,.35)]" />
          <span className="text-[20px] font-black tracking-[-0.01em] text-ink">Warmline</span>
          <span className="hidden truncate text-body-s text-muted sm:inline">
            cold outreach that reads warm
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {isTestMode() ? (
            <TestModeMenu publicDemo={PUBLIC_DEMO} />
          ) : (
          <Link href="/settings" className="shrink-0">
            {setup.ready ? (
              <Chip tone="success">Setup done</Chip>
            ) : (
              <Chip tone="warning">
                {setup.toFix} to set up
              </Chip>
            )}
          </Link>
          )}
        </div>
      </div>
    </header>
  );
}

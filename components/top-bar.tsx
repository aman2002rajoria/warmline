import Link from "next/link";
import { getSetupStatus } from "@/lib/setup-status";
import { Chip } from "@/components/ui/chip";
import { isTestMode } from "@/lib/test-mode";
import { TestModeMenu } from "@/components/test-mode";
import { PUBLIC_DEMO } from "@/lib/paths";
import { Nav } from "@/components/nav";
import { ThemeToggle } from "@/components/theme-toggle";

/** The portfolio's header: the mark on the left, one floating pill of sections in the middle, theme and status on the right. */
export function TopBar() {
  const setup = getSetupStatus();
  return (
    <header className="sticky top-0 z-30 bg-[color-mix(in_srgb,var(--bg)_84%,transparent)] backdrop-blur-[16px]">
      <div className="mx-auto grid max-w-app grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 px-[clamp(20px,4vw,48px)] py-3 md:grid-cols-[1fr_auto_1fr]">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Warmline home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/art/logo-tile.webp" alt="" width={36} height={38} className="h-[38px] w-9 shrink-0 drop-shadow-[0_6px_12px_rgba(47,107,255,.35)]" />
          <span className="min-w-0">
            <span className="block text-[19px] font-black leading-none tracking-[-0.01em] text-ink">Warmline</span>
            <span className="mt-1 hidden truncate text-label text-muted lg:block">cold outreach that reads warm</span>
          </span>
        </Link>
        <div className="col-span-2 row-start-2 min-w-0 md:col-span-1 md:col-start-2 md:row-start-1">
          <div className="rounded-full bg-card p-1 shadow-flat">
            <Nav />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 md:col-start-3">
          {isTestMode() ? (
            <TestModeMenu publicDemo={PUBLIC_DEMO} />
          ) : (
            <Link href="/settings" className="shrink-0">
              {setup.ready ? <Chip tone="success">Setup done</Chip> : <Chip tone="warning">{setup.toFix} to set up</Chip>}
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

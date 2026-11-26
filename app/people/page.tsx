import { listProfessors } from "@/lib/professors-store";
import { getSettings } from "@/lib/settings-store";
import { isTestMode } from "@/lib/test-mode";
import { ProfessorsClient, type Filter } from "@/components/professors/professors-client";

export const dynamic = "force-dynamic";

const FILTERS: Filter[] = ["all", "pending", "drafted", "approved", "scheduled", "sent", "followup", "failed"];

export default function PeoplePage({
  searchParams,
}: {
  searchParams: { filter?: string; import?: string; new?: string; open?: string };
}) {
  const s = getSettings();
  const filter = FILTERS.includes(searchParams.filter as Filter)
    ? (searchParams.filter as Filter)
    : "all";
  return (
    <ProfessorsClient
      initial={listProfessors()}
      initialFilter={filter}
      openImport={searchParams.import === "1"}
      openNew={searchParams.new === "1"}
      openId={searchParams.open}
      limits={{ maxPerRun: s.maxPerRun, delaySeconds: s.defaultDelaySeconds }}
      sender={isTestMode() ? "your Gmail (simulated)" : s.gmailEmail}
      testMode={isTestMode()}
    />
  );
}

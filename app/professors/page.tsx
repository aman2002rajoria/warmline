import { listProfessors } from "@/lib/professors-store";
import { getSettings } from "@/lib/settings-store";
import { isTestMode } from "@/lib/test-mode";
import { ProfessorsClient, type Filter } from "@/components/professors/professors-client";

export const dynamic = "force-dynamic";

const FILTERS: Filter[] = ["all", "pending", "drafted", "approved", "sent", "failed"];

export default function ProfessorsPage({
  searchParams,
}: {
  searchParams: { filter?: string; import?: string };
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
      limits={{ maxPerRun: s.maxPerRun, delaySeconds: s.defaultDelaySeconds }}
      sender={isTestMode() ? "your Gmail (simulated)" : s.gmailEmail}
      testMode={isTestMode()}
    />
  );
}

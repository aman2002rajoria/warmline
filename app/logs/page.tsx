import { readSent, readFailed } from "@/lib/logs-store";
import { tailLog } from "@/lib/logger";
import { PATHS } from "@/lib/paths";
import { LogsClient } from "@/components/logs-client";

export const dynamic = "force-dynamic";

export default function LogsPage() {
  // Show newest first
  const sent = readSent().slice().reverse();
  const failed = readFailed().slice().reverse();
  const errorsLog = tailLog(PATHS.logErrors, 200);
  const appLog = tailLog(PATHS.logApp, 200);
  return (
    <LogsClient
      sent={sent}
      failed={failed}
      errorsLog={errorsLog}
      appLog={appLog}
    />
  );
}

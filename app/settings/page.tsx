import { getSettings } from "@/lib/settings-store";
import { SettingsClient } from "@/components/settings-client";
import { maskSecret } from "@/lib/utils";
import { isTestMode } from "@/lib/test-mode";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const s = getSettings();
  return (
    <SettingsClient
      testMode={isTestMode()}
      initial={{
        ...s,
        geminiApiKey: maskSecret(s.geminiApiKey),
        gmailAppPassword: s.gmailAppPassword ? "•••••••••••••" : "",
      }}
    />
  );
}

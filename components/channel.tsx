import { Linkedin, Mail, Twitter } from "lucide-react";
import { CHANNEL_LABEL, type Channel } from "@/lib/demo-people";

const STYLE: Record<Channel, string> = {
  gmail: "bg-[color-mix(in_srgb,#EA4335_14%,var(--card))] text-[#C5221F] [[data-theme=dark]_&]:text-[#FF8A80]",
  linkedin: "bg-[color-mix(in_srgb,#0A66C2_14%,var(--card))] text-[#0A66C2] [[data-theme=dark]_&]:text-[#7FB8F0]",
  x: "bg-surface-2 text-ink",
};

/** Where a reply came in: Gmail, LinkedIn or X. */
export function ChannelBadge({ channel, short }: { channel: Channel; short?: boolean }) {
  const Icon = channel === "gmail" ? Mail : channel === "linkedin" ? Linkedin : Twitter;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-extrabold ${STYLE[channel]}`} title={`Via ${CHANNEL_LABEL[channel]}`}>
      <Icon size={12} strokeWidth={2.2} />
      {short ? null : CHANNEL_LABEL[channel]}
    </span>
  );
}

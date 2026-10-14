import { Binary, Braces, Fingerprint, KeyRound, Link2, Radar } from "lucide-react";
import { IconTile } from "@/components/ui";
import type { ToolMeta } from "@/lib/tools";

const ICONS = {
  link: Link2,
  password: KeyRound,
  headers: Radar,
  jwt: Braces,
  hash: Fingerprint,
  encode: Binary,
} as const;

export function ToolIcon({ tool, className }: { tool: ToolMeta; className?: string }) {
  const Icon = ICONS[tool.slug];
  return (
    <IconTile tone={tool.tone} className={className}>
      <Icon className="size-[22px]" strokeWidth={2} />
    </IconTile>
  );
}

import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell";
import { Encoder } from "@/components/tools/encoder";

export const metadata: Metadata = { title: "Encoder", description: "Encode and decode Base64, hex, URL, ROT13 and binary." };

export default function Page() {
  return (
    <ToolShell slug="encode">
      <Encoder />
    </ToolShell>
  );
}

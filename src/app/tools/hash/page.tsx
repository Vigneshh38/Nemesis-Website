import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell";
import { HashLab } from "@/components/tools/hash-lab";

export const metadata: Metadata = { title: "Hash Lab", description: "Hash files and text, verify checksums, identify hash types." };

export default function Page() {
  return (
    <ToolShell slug="hash">
      <HashLab />
    </ToolShell>
  );
}

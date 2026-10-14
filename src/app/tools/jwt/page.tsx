import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell";
import { JwtWorkbench } from "@/components/tools/jwt-workbench";

export const metadata: Metadata = { title: "JWT Workbench", description: "Decode, verify and tamper-test JSON Web Tokens." };

export default function Page() {
  return (
    <ToolShell slug="jwt">
      <JwtWorkbench />
    </ToolShell>
  );
}

import type { Metadata } from "next";
import { connection } from "next/server";
import { LabFrame } from "@/components/arena/lab-frame";
import { issueInternToken } from "@/lib/arena/flags";
import { GateForm } from "./gate-form";

export const metadata: Metadata = { title: "Lab · Admin gate", robots: { index: false } };

export default async function GateLab() {
  await connection();
  return (
    <LabFrame code="lab://gate/admin" title="Admin gate">
      <p>
        Here is your badge. It says you&apos;re an intern. The gate only opens for role <code className="font-mono text-ink">admin</code>.
      </p>
      <p className="rounded-2xl bg-surface p-4 font-mono text-xs break-all text-ink">{issueInternToken()}</p>
      <GateForm />
    </LabFrame>
  );
}

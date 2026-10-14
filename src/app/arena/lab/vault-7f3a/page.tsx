import type { Metadata } from "next";
import { connection } from "next/server";
import { LabFrame } from "@/components/arena/lab-frame";
import { flagFor } from "@/lib/arena/flags";

export const metadata: Metadata = { title: "Vault", robots: { index: false, follow: false } };

export default async function VaultLab() {
  await connection();
  return (
    <LabFrame code="lab://vault-7f3a" title="Internal vault">
      <p>You weren&apos;t supposed to find this. Search engines were asked nicely not to look, and so were you.</p>
      <p className="rounded-2xl bg-surface p-4 font-mono text-ink">{flagFor("robots-know")}</p>
    </LabFrame>
  );
}

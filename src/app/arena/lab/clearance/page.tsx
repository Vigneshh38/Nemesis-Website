import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LabFrame } from "@/components/arena/lab-frame";
import { flagFor } from "@/lib/arena/flags";
import { SetVisitorCookie } from "./set-cookie";

export const metadata: Metadata = { title: "Lab · Archive", robots: { index: false } };

export default async function ClearanceLab() {
  const level = (await cookies()).get("nemesis_clearance")?.value ?? "visitor";
  const admin = level === "admin";
  return (
    <LabFrame code="lab://archive/restricted" title="Restricted archive">
      <SetVisitorCookie />
      <p>
        Your clearance level: <span className="rounded-full bg-surface px-3 py-1 font-mono text-ink">{level}</span>
      </p>
      {admin ? (
        <p className="rounded-2xl bg-safe-soft p-4 font-mono break-all text-safe">Access granted. {flagFor("cookie-clearance")}</p>
      ) : (
        <p className="rounded-2xl bg-danger-soft p-4 font-medium text-danger">Access denied. Only admin clearance can open the archive.</p>
      )}
    </LabFrame>
  );
}

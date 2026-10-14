import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { CaseControls } from "@/components/report/case-controls";
import { Chip } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { listReports } from "@/lib/reports";
import { REPORT_TYPE_LABEL, relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin triage", robots: { index: false } };

export default async function AdminPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");
  if (!viewer.isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="display text-4xl font-medium text-ink">Admins only</h1>
        <p className="mt-3 text-ink-2">Your account isn&apos;t on the admin list. Ask the event team to add your email to ADMIN_EMAILS.</p>
      </div>
    );
  }
  const reports = await listReports({}, 200);
  const open = reports?.filter((r) => r.status === "received" || r.status === "investigating").length ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-12 sm:px-6">
      <p className="eyebrow text-brand">Admin</p>
      <h1 className="display mt-3 text-5xl font-medium text-ink">Triage</h1>
      <p className="mt-3 text-ink-2">{reports ? `${reports.length} reports · ${open} open` : "Database not connected."}</p>
      <ul className="mt-10 space-y-4">
        {reports?.map((r) => (
          <li key={r.id} className="rounded-[28px] border border-line bg-raised p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono font-semibold text-ink">{r.caseId}</span>
              <span className="text-sm text-ink-3">{REPORT_TYPE_LABEL[r.type]} · {relativeTime(r.createdAt)} · {r.reporterEmail}</span>
              {r.risk !== null && <Chip level={r.risk >= 50 ? "danger" : r.risk >= 20 ? "warn" : "safe"}>Risk {r.risk}</Chip>}
              {r.amountLost > 0 && <Chip level="danger">₹{r.amountLost.toLocaleString("en-IN")} lost</Chip>}
            </div>
            <h2 className="mt-3 text-lg font-semibold text-ink">{r.title}</h2>
            <p className="mt-1 text-sm whitespace-pre-wrap text-ink-2">{r.description}</p>
            {r.suspectUrl && <p className="mt-2 font-mono text-xs break-all text-danger">{r.suspectUrl}</p>}
            {r.evidence.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {r.evidence.map((e) => (
                  <a key={e.url} href={e.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-2xl border border-line">
                    <Image src={e.url} alt="Evidence" width={120} height={120} className="size-28 object-cover" />
                  </a>
                ))}
              </div>
            )}
            <CaseControls id={r.id} status={r.status} note={r.adminNote} />
          </li>
        ))}
      </ul>
    </div>
  );
}

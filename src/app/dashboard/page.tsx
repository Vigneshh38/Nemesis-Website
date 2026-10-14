import { ArrowRight, Flag, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ButtonLink, Chip } from "@/components/ui";
import { CHALLENGES, TOTAL_POINTS } from "@/lib/arena/challenges";
import { getProgress } from "@/lib/arena/data";
import { getViewer } from "@/lib/auth";
import { listReports } from "@/lib/reports";
import { REPORT_TYPE_LABEL, relativeTime, STATUS_LABEL } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

const STATUS_LEVEL = { received: "info", investigating: "warn", resolved: "safe", dismissed: "info" } as const;

export default async function Dashboard() {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");
  const [progress, reports] = await Promise.all([getProgress(viewer.id), listReports({ userId: viewer.id })]);
  const solved = new Set(progress?.solved ?? []);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
      <p className="eyebrow text-brand">Dashboard</p>
      <h1 className="display mt-3 text-5xl font-medium text-ink">Hi, {viewer.name.split(" ")[0]}.</h1>
      {viewer.isAdmin && (
        <Link href="/admin" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
          Open admin triage <ArrowRight className="size-4" />
        </Link>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <section className="rounded-[28px] border border-line bg-raised p-6 sm:p-8">
          <div className="flex items-center gap-2 text-ink">
            <Flag className="size-5 text-brand" />
            <h2 className="font-semibold">Arena progress</h2>
          </div>
          <p className="display mt-6 font-mono text-6xl font-medium text-ink">
            {progress?.points ?? 0}
            <span className="text-2xl text-ink-3">/{TOTAL_POINTS}</span>
          </p>
          <p className="mt-2 text-sm text-ink-2">
            {progress?.rank ? `Rank #${progress.rank} of ${progress.players}` : "Capture a flag to get ranked."}
          </p>
          <ul className="mt-6 grid grid-cols-2 gap-2">
            {CHALLENGES.map((c) => (
              <li key={c.id} className={`truncate rounded-xl px-3 py-2 text-sm ${solved.has(c.id) ? "bg-safe-soft font-medium text-safe" : "bg-surface text-ink-3"}`}>
                {solved.has(c.id) ? "✓ " : ""}
                {c.title}
              </li>
            ))}
          </ul>
          <ButtonLink href="/arena" variant="secondary" size="sm" className="mt-6">
            Continue in the Arena
          </ButtonLink>
        </section>

        <section className="rounded-[28px] border border-line bg-raised p-6 sm:p-8">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-ink">
              <ShieldAlert className="size-5 text-danger" />
              <h2 className="font-semibold">Your reports</h2>
            </div>
            <ButtonLink href="/report" size="sm">New report</ButtonLink>
          </div>
          {reports === null ? (
            <p className="mt-6 text-sm text-ink-3">Reports are unavailable until the database is connected.</p>
          ) : reports.length === 0 ? (
            <p className="mt-6 text-sm text-ink-3">No reports yet. If something suspicious reaches you, file it here and track it.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {reports.map((r) => (
                <li key={r.id} className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-sm font-semibold text-ink">{r.caseId}</span>
                    <Chip level={STATUS_LEVEL[r.status as keyof typeof STATUS_LEVEL] ?? "info"}>{STATUS_LABEL[r.status] ?? r.status}</Chip>
                  </div>
                  <p className="mt-1 font-medium text-ink">{r.title}</p>
                  <p className="text-xs text-ink-3">{REPORT_TYPE_LABEL[r.type]} · filed {relativeTime(r.createdAt)}</p>
                  {r.adminNote && <p className="mt-2 rounded-xl bg-surface px-3 py-2 text-sm text-ink-2">{r.adminNote}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

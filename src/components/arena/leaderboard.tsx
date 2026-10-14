import { Trophy } from "lucide-react";
import Image from "next/image";
import { getLeaderboard } from "@/lib/arena/data";
import { TOTAL_POINTS } from "@/lib/arena/challenges";
import { cn, relativeTime } from "@/lib/utils";

const MEDAL = ["bg-[#F5B93A] text-[#3d2a00]", "bg-[#C9D2E1] text-[#1f2937]", "bg-[#E2A06B] text-[#3a1d05]"];

export async function Leaderboard({ limit = 10, highlight }: { limit?: number; highlight?: string }) {
  const board = await getLeaderboard(limit);

  if (!board.ok) {
    return (
      <div className="rounded-3xl border border-dashed border-line-strong p-8 text-center">
        <Trophy className="mx-auto size-8 text-ink-3" />
        <p className="mt-3 font-medium text-ink">Leaderboard offline</p>
        <p className="mt-1 text-sm text-ink-2">
          {board.reason === "unconfigured" ? "Connect the database to start scoring." : "Couldn't reach the database. Refresh to retry."}
        </p>
      </div>
    );
  }

  if (!board.rows.length) {
    return (
      <div className="rounded-3xl border border-dashed border-line-strong p-8 text-center">
        <Trophy className="mx-auto size-8 text-warn-dot" />
        <p className="mt-3 font-medium text-ink">The board is empty</p>
        <p className="mt-1 text-sm text-ink-2">Capture one flag and the top spot is yours.</p>
      </div>
    );
  }

  return (
    <ol className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-raised">
      {board.rows.map((r) => (
        <li key={r.userId} className={cn("flex items-center gap-4 px-5 py-3.5", r.userId === highlight && "bg-brand-soft")}>
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-full font-mono text-sm font-semibold",
              MEDAL[r.rank - 1] ?? "bg-surface text-ink-2",
            )}
          >
            {r.rank}
          </span>
          {r.imageUrl ? (
            <Image src={r.imageUrl} alt="" width={36} height={36} className="size-9 rounded-full object-cover" />
          ) : (
            <span className="grid size-9 place-items-center rounded-full bg-brand-soft font-semibold text-brand-soft-ink">{r.name[0]}</span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-ink">
              {r.name}
              {r.userId === highlight && <span className="ml-2 text-xs font-semibold text-brand">You</span>}
            </p>
            <p className="text-xs text-ink-3">
              {r.solves} {r.solves === 1 ? "flag" : "flags"}
              {r.lastSolveAt && ` · last ${relativeTime(r.lastSolveAt)}`}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg font-semibold tabular-nums text-ink">{r.points}</p>
            <div className="mt-1 h-1 w-16 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-brand" style={{ width: `${Math.round((r.points / TOTAL_POINTS) * 100)}%` }} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function LeaderboardSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-raised" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="skeleton size-8 rounded-full" />
          <div className="skeleton size-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3.5 w-1/3" />
            <div className="skeleton h-3 w-1/5" />
          </div>
          <div className="skeleton h-5 w-10" />
        </div>
      ))}
    </div>
  );
}

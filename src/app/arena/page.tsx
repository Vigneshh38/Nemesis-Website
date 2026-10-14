import type { Metadata } from "next";
import { Suspense } from "react";
import { ChallengeBoard } from "@/components/arena/challenge-board";
import { Leaderboard, LeaderboardSkeleton } from "@/components/arena/leaderboard";
import { PageHeader } from "@/components/ui";
import { CHALLENGES, FLAG_FORMAT, TOTAL_POINTS } from "@/lib/arena/challenges";
import { getProgress, getSolveCounts } from "@/lib/arena/data";
import { baseJumpCipher, hexMarksDump, saladDaysCipher } from "@/lib/arena/flags";
import { getViewer } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Arena",
  description: "Capture-the-flag challenges in encoding, crypto, web and forensics. Learn attacks by doing them.",
};

export default async function ArenaPage() {
  const viewer = await getViewer();
  const [progress, solveCounts] = await Promise.all([viewer ? getProgress(viewer.id) : null, getSolveCounts()]);
  const material = {
    "base-jump": baseJumpCipher(),
    "salad-days": saladDaysCipher(),
    "hex-marks": hexMarksDump(),
  };
  const pct = progress ? Math.round((progress.points / TOTAL_POINTS) * 100) : 0;

  return (
    <>
      <PageHeader
        eyebrow="Capture the flag"
        title="The Arena"
        lede={`${CHALLENGES.length} challenges. Find the hidden flag in each (format ${FLAG_FORMAT}), submit it, climb the board. Every challenge ends with the defence it teaches.`}
      >
        {viewer && progress && (
          <div className="mt-8 max-w-md rounded-3xl border border-line bg-raised p-5">
            <div className="flex items-baseline justify-between">
              <p className="font-semibold text-ink">Your run</p>
              <p className="font-mono text-sm text-ink-2">
                {progress.points}/{TOTAL_POINTS} pts{progress.rank ? ` · rank #${progress.rank} of ${progress.players}` : ""}
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-linear-to-r from-brand to-violet transition-[width] duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </PageHeader>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <ChallengeBoard challenges={CHALLENGES} solved={progress?.solved ?? []} signedIn={Boolean(viewer)} material={material} solveCounts={solveCounts} />
      </section>

      <section id="leaderboard" className="mx-auto mt-20 max-w-3xl scroll-mt-24 px-4 sm:px-6">
        <h2 className="display text-4xl font-medium text-ink">Leaderboard</h2>
        <p className="mt-2 text-ink-2">Ties go to whoever got there first.</p>
        <div className="mt-6">
          <Suspense fallback={<LeaderboardSkeleton rows={8} />}>
            <Leaderboard limit={25} highlight={viewer?.id} />
          </Suspense>
        </div>
      </section>
    </>
  );
}

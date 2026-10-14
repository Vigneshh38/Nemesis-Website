import "server-only";
import { connection } from "next/server";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Player, Solve } from "@/lib/models";

export type LeaderRow = { rank: number; userId: string; name: string; imageUrl: string; points: number; solves: number; lastSolveAt: string | null };

export type BoardResult = { ok: true; rows: LeaderRow[]; players: number } | { ok: false; reason: "unconfigured" | "error" };

export async function getLeaderboard(limit = 10): Promise<BoardResult> {
  await connection();
  if (!isDbConfigured()) return { ok: false, reason: "unconfigured" };
  try {
    await connectDb();
    const [docs, players] = await Promise.all([
      Player.find({ points: { $gt: 0 } })
        .sort({ points: -1, lastSolveAt: 1 })
        .limit(limit)
        .lean(),
      Player.countDocuments({ points: { $gt: 0 } }),
    ]);
    return {
      ok: true,
      players,
      rows: docs.map((d, i) => ({
        rank: i + 1,
        userId: d.userId,
        name: d.name,
        imageUrl: d.imageUrl ?? "",
        points: d.points ?? 0,
        solves: d.solves ?? 0,
        lastSolveAt: d.lastSolveAt ? new Date(d.lastSolveAt).toISOString() : null,
      })),
    };
  } catch (err) {
    console.error("leaderboard failed", err);
    return { ok: false, reason: "error" };
  }
}

export type PlayerProgress = { solved: string[]; points: number; rank: number | null; players: number };

export async function getProgress(userId: string): Promise<PlayerProgress | null> {
  if (!isDbConfigured()) return null;
  try {
    await connectDb();
    const [solves, player] = await Promise.all([Solve.find({ userId }).select("challengeId").lean(), Player.findOne({ userId }).lean()]);
    const points = player?.points ?? 0;
    let rank: number | null = null;
    const players = await Player.countDocuments({ points: { $gt: 0 } });
    if (player && points > 0) {
      const ahead = await Player.countDocuments({
        $or: [{ points: { $gt: points } }, { points, lastSolveAt: { $lt: player.lastSolveAt } }],
      });
      rank = ahead + 1;
    }
    return { solved: solves.map((s) => s.challengeId), points, rank, players };
  } catch (err) {
    console.error("progress failed", err);
    return null;
  }
}

export async function getSolveCounts(): Promise<Record<string, number>> {
  if (!isDbConfigured()) return {};
  try {
    await connectDb();
    const rows = await Solve.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$challengeId", n: { $sum: 1 } } }]);
    return Object.fromEntries(rows.map((r) => [r._id, r.n]));
  } catch {
    return {};
  }
}

import { z } from "zod";
import { getViewer } from "@/lib/auth";
import { getChallenge } from "@/lib/arena/challenges";
import { checkFlag } from "@/lib/arena/flags";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Attempt, Player, Solve } from "@/lib/models";

const Body = z.object({
  challengeId: z.string().min(1).max(64),
  flag: z.string().min(1).max(200),
});

const MAX_WRONG_PER_HOUR = 8;

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer) return Response.json({ error: "Sign in to submit flags." }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Send a challenge and a flag." }, { status: 400 });
  const { challengeId, flag } = parsed.data;

  const challenge = getChallenge(challengeId);
  if (!challenge) return Response.json({ error: "That challenge doesn't exist." }, { status: 404 });
  if (!isDbConfigured()) return Response.json({ error: "Scoring is offline: the database isn't connected yet." }, { status: 503 });

  await connectDb();

  if (await Solve.exists({ userId: viewer.id, challengeId })) {
    return Response.json({ status: "already", message: "You've already captured this one." });
  }

  const wrong = await Attempt.countDocuments({
    userId: viewer.id,
    challengeId,
    correct: false,
    createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
  });
  if (wrong >= MAX_WRONG_PER_HOUR) {
    return Response.json(
      { status: "limited", message: "Too many wrong guesses on this challenge. Try again within the hour." },
      { status: 429 },
    );
  }

  if (!checkFlag(challengeId, flag)) {
    await Attempt.create({ userId: viewer.id, challengeId, correct: false });
    const left = MAX_WRONG_PER_HOUR - wrong - 1;
    return Response.json({
      status: "wrong",
      message: left > 0 ? `Not quite. ${left} ${left === 1 ? "guess" : "guesses"} left this hour.` : "Not quite. That was your last guess this hour.",
    });
  }

  try {
    await Solve.create({ userId: viewer.id, challengeId, points: challenge.points });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      return Response.json({ status: "already", message: "You've already captured this one." });
    }
    throw err;
  }
  await Attempt.create({ userId: viewer.id, challengeId, correct: true });

  const now = new Date();
  const player = await Player.findOneAndUpdate(
    { userId: viewer.id },
    {
      $inc: { points: challenge.points, solves: 1 },
      $set: { name: viewer.name, imageUrl: viewer.imageUrl, lastSolveAt: now },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );

  return Response.json({
    status: "correct",
    message: `Flag captured. +${challenge.points} points.`,
    points: challenge.points,
    total: player?.points ?? challenge.points,
  });
}

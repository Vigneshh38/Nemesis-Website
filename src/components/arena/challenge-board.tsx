"use client";

import { SignInButton } from "@clerk/nextjs";
import { ArrowUpRight, Check, Flag, Lightbulb, Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { inputClass } from "@/components/ui";
import type { Challenge } from "@/lib/arena/challenges";
import { cn } from "@/lib/utils";

const DIFF_TONE: Record<string, string> = {
  "Warm-up": "bg-safe-soft text-safe",
  Easy: "bg-brand-soft text-brand-soft-ink",
  Medium: "bg-warn-soft text-warn",
  Hard: "bg-danger-soft text-danger",
};

export function ChallengeBoard({
  challenges,
  solved,
  signedIn,
  material,
  solveCounts,
}: {
  challenges: Challenge[];
  solved: string[];
  signedIn: boolean;
  material: Record<string, string>;
  solveCounts: Record<string, number>;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [localSolved, setLocalSolved] = useState(solved);
  const open = challenges.find((c) => c.id === openId) ?? null;

  useEffect(() => setLocalSolved(solved), [solved]);
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenId(null);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [openId]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {challenges.map((c, i) => {
          const done = localSolved.includes(c.id);
          return (
            <motion.button
              key={c.id}
              type="button"
              onClick={() => setOpenId(c.id)}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "group relative flex flex-col rounded-[28px] border p-6 text-left transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-1 hover:shadow-e3",
                done ? "border-safe/40 bg-safe-soft/50" : "border-line bg-raised hover:border-transparent",
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", DIFF_TONE[c.difficulty])}>{c.difficulty}</span>
                {done ? (
                  <span className="grid size-7 place-items-center rounded-full bg-safe text-white"><Check className="size-4" strokeWidth={3} /></span>
                ) : (
                  <Flag className="size-5 text-ink-3 transition-colors group-hover:text-brand" />
                )}
              </div>
              <p className="eyebrow mt-6 text-ink-3">{c.category}</p>
              <h3 className="display-tight mt-1 text-xl font-semibold text-ink">{c.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-2">{c.brief}</p>
              <div className="mt-5 flex items-end justify-between">
                <span className="font-mono text-2xl font-semibold text-ink">{c.points}<span className="ml-1 text-xs font-normal text-ink-3">pts</span></span>
                <span className="text-xs text-ink-3">{solveCounts[c.id] ?? 0} solved</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setOpenId(null)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="challenge-title"
              initial={{ y: 40, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-[32px] bg-raised p-6 shadow-e3 sm:rounded-[32px] sm:p-8"
            >
              <button type="button" onClick={() => setOpenId(null)} aria-label="Close" className="absolute right-4 top-4 grid size-10 place-items-center rounded-full text-ink-2 hover:bg-surface">
                <X className="size-5" />
              </button>
              <div className="flex flex-wrap items-center gap-2 pr-12">
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", DIFF_TONE[open.difficulty])}>{open.difficulty}</span>
                <span className="text-sm text-ink-3">{open.category} · {open.points} pts</span>
              </div>
              <h2 id="challenge-title" className="display mt-3 text-4xl font-medium text-ink">{open.title}</h2>
              <p className="mt-3 text-lg leading-relaxed text-ink-2">{open.brief}</p>

              {material[open.id] && (
                <pre className="mt-5 max-h-64 overflow-auto rounded-2xl bg-ink p-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-all text-bg">{material[open.id]}</pre>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {open.lab && (
                  <Link href={open.lab.href} target="_blank" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-bg hover:opacity-90">
                    {open.lab.label} <ArrowUpRight className="size-4" />
                  </Link>
                )}
                {open.tool && (
                  <Link href={open.tool.href} target="_blank" className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line-strong px-4 text-sm font-semibold text-ink hover:bg-surface">
                    {open.tool.label} <ArrowUpRight className="size-4" />
                  </Link>
                )}
              </div>

              <details className="group mt-5 rounded-2xl bg-surface p-4">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-ink">
                  <Lightbulb className="size-4 text-warn-dot" /> Need a hint?
                </summary>
                <p className="mt-2 text-sm text-ink-2">{open.hint}</p>
              </details>

              <FlagForm challenge={open} signedIn={signedIn} solved={localSolved.includes(open.id)} onSolved={() => setLocalSolved((s) => [...s, open.id])} />

              <p className="mt-5 border-t border-line pt-4 text-sm text-ink-3">
                <span className="font-semibold text-ink-2">The lesson: </span>
                {open.learn}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function FlagForm({ challenge, signedIn, solved, onSolved }: { challenge: Challenge; signedIn: boolean; solved: boolean; onSolved: () => void }) {
  const router = useRouter();
  const [flag, setFlag] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);

  if (solved) {
    return <p className="mt-5 flex items-center gap-2 rounded-2xl bg-safe-soft px-4 py-3 font-semibold text-safe"><Check className="size-5" /> Captured. Nice work.</p>;
  }
  if (!signedIn) {
    return (
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-4">
        <span className="text-sm text-ink-2">Sign in to submit flags and join the leaderboard.</span>
        <SignInButton mode="modal">
          <button type="button" className="h-10 rounded-full bg-brand px-5 text-sm font-semibold text-brand-ink">Sign in</button>
        </SignInButton>
      </div>
    );
  }

  return (
    <form
      className="mt-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        try {
          const res = await fetch("/api/arena/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ challengeId: challenge.id, flag }) });
          const data = await res.json();
          if (data.status === "correct" || data.status === "already") {
            setMsg({ tone: "ok", text: data.message });
            onSolved();
            router.refresh();
          } else setMsg({ tone: "bad", text: data.message ?? data.error ?? "Something went wrong." });
        } catch {
          setMsg({ tone: "bad", text: "Network error. Try again." });
        } finally {
          setBusy(false);
        }
      }}
    >
      <label htmlFor="flag" className="text-sm font-semibold text-ink">Submit flag</label>
      <div className="mt-2 flex gap-2">
        <input id="flag" value={flag} onChange={(e) => setFlag(e.target.value)} placeholder="NEMESIS{...}" autoComplete="off" spellCheck={false} className={cn(inputClass, "font-mono")} />
        <button type="submit" disabled={busy || !flag.trim()} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand px-6 font-semibold text-brand-ink hover:bg-brand-hover disabled:opacity-50">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Flag className="size-4" />} Submit
        </button>
      </div>
      <AnimatePresence>
        {msg && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={cn("mt-3 text-sm font-semibold", msg.tone === "ok" ? "text-safe" : "text-danger")} role="status">
            {msg.text}
          </motion.p>
        )}
      </AnimatePresence>
    </form>
  );
}

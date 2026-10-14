"use client";

import { Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    id: "2fa",
    title: "2-step verification on your main email",
    how: "Google Account → Security → 2-Step Verification. Prefer an authenticator app or passkey over SMS.",
    weight: 20,
  },
  {
    id: "unique",
    title: "A different password for every account",
    how: "Use a password manager (Google Password Manager, Bitwarden, 1Password). One leak then can't unlock everything.",
    weight: 18,
  },
  {
    id: "lock",
    title: "Screen lock on your phone",
    how: "A 6-digit PIN or biometrics. Lost phones with open email are the fastest route to account takeover.",
    weight: 12,
  },
  {
    id: "updates",
    title: "Automatic updates on phone and laptop",
    how: "Most attacks use bugs that were already fixed. Updates close those doors.",
    weight: 12,
  },
  {
    id: "upi",
    title: "UPI app lock on, PIN never shared",
    how: "You only enter your UPI PIN to send money, never to receive it. Turn on the app's own lock too.",
    weight: 12,
  },
  {
    id: "devices",
    title: "Reviewed where you're signed in",
    how: "Check myaccount.google.com/device-activity and sign out of devices you don't recognise.",
    weight: 10,
  },
  {
    id: "perms",
    title: "Trimmed app permissions",
    how: "Settings → Privacy → Permission manager. Revoke location, contacts and SMS from apps that don't need them.",
    weight: 8,
  },
  {
    id: "backup",
    title: "Backups of your important files",
    how: "Cloud backup or an external drive. Ransomware and dead laptops hurt less with a copy elsewhere.",
    weight: 8,
  },
];

const KEY = "nemesis-checkup";
const R = 46;
const C = 2 * Math.PI * R;

export function SecurityCheckup() {
  const [done, setDone] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      if (Array.isArray(saved)) setDone(saved.filter((x) => typeof x === "string"));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(done));
    } catch {}
  }, [done, loaded]);

  const score = ITEMS.filter((i) => done.includes(i.id)).reduce((s, i) => s + i.weight, 0);
  const tone = score >= 80 ? "var(--safe)" : score >= 45 ? "var(--warn-dot)" : "var(--danger)";
  const label = score >= 80 ? "Well protected" : score >= 45 ? "Getting there" : "Exposed";

  return (
    <div className="grid gap-10 lg:grid-cols-[320px_1fr] lg:gap-16">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className="relative mx-auto size-56 lg:mx-0">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90">
            <circle cx="60" cy="60" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
            <motion.circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke={tone}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={C}
              initial={false}
              animate={{ strokeDashoffset: C - (C * score) / 100, stroke: tone }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="display-tight font-mono text-5xl font-semibold tabular-nums text-ink">{score}</p>
              <p className="mt-1 text-sm font-medium" style={{ color: tone }}>
                {label}
              </p>
            </div>
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-ink-3 lg:text-left">Saved on this device only.</p>
      </div>

      <ul className="space-y-3">
        {ITEMS.map((item) => {
          const checked = done.includes(item.id);
          const expanded = open === item.id;
          return (
            <li key={item.id} className={cn("rounded-3xl border transition-colors", checked ? "border-safe/30 bg-safe-soft/60" : "border-line bg-raised")}>
              <div className="flex items-center gap-4 p-4 pr-3 sm:p-5">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  aria-label={item.title}
                  onClick={() => setDone((d) => (checked ? d.filter((x) => x !== item.id) : [...d, item.id]))}
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full border-2 transition-[background-color,border-color,transform] active:scale-90",
                    checked ? "border-safe bg-safe text-white" : "border-line-strong hover:border-safe",
                  )}
                >
                  <AnimatePresence>
                    {checked && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 500, damping: 26 }}>
                        <Check className="size-4" strokeWidth={3} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? null : item.id)}
                >
                  <span className={cn("font-medium", checked ? "text-ink-2" : "text-ink")}>{item.title}</span>
                  <ChevronDown className={cn("size-5 shrink-0 text-ink-3 transition-transform duration-300", expanded && "rotate-180")} />
                </button>
              </div>
              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 pl-[4.25rem] text-sm leading-relaxed text-ink-2">{item.how}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

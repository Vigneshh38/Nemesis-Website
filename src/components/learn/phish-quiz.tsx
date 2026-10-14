"use client";

import { CircleCheck, OctagonAlert, RotateCcw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Round = {
  channel: "Email" | "SMS" | "WhatsApp";
  from: string;
  subject?: string;
  body: string;
  link?: string;
  phish: boolean;
  tells: string[];
};

const ROUNDS: Round[] = [
  {
    channel: "SMS", from: "VM-SBIINB", phish: true,
    body: "Dear Customer, your SBI YONO account will be blocked today. Update your PAN immediately:",
    link: "http://sbi-yono-kyc.in-update.top/login",
    tells: ["The real domain is in-update.top, not sbi.co.in", "Deadline pressure: 'blocked today'", "Banks never ask you to update PAN via an SMS link"],
  },
  {
    channel: "Email", from: "no-reply@accounts.google.com", subject: "Security alert: new sign-in on Windows", phish: false,
    body: "A new sign-in to your Google Account was detected on a Windows device. If this was you, you don't need to do anything. If not, we'll help you secure your account.",
    link: "https://myaccount.google.com/notifications",
    tells: ["Sender and link both on google.com", "No request for a password or code", "Tells you that you don't need to do anything if it was you"],
  },
  {
    channel: "WhatsApp", from: "+44 7700 900412", phish: true,
    body: "Hi! I'm Neha from an HR agency. Part-time job: like YouTube videos and earn ₹3,000–8,000 daily. Join our Telegram to start your first prepaid task 👍",
    tells: ["Unsolicited job offer from a foreign number", "Easy money for 'liking videos'", "'Prepaid task' means you'll be asked to deposit money"],
  },
  {
    channel: "Email", from: "it-helpdesk@yourcoll3ge-support.com", subject: "Action required: mailbox storage full", phish: true,
    body: "Your college mailbox has exceeded 99% of its quota. Sign in within 24 hours to keep receiving mail, or your account will be deactivated.",
    link: "https://yourcoll3ge-support.com/owa/signin",
    tells: ["'coll3ge' with a 3: a look-alike domain", "24-hour threat of deactivation", "IT would point you to the real college portal, not a new domain"],
  },
  {
    channel: "SMS", from: "AX-HDFCBK", phish: false,
    body: "Rs 1,250.00 debited from a/c **4821 on 14-10-26 to VPA swiggy@icici. Not you? Call 18002586161 / SMS BLOCK 4821 to 7308080808.",
    tells: ["No link to click", "Helpline matches the number printed on the card", "Informs you; doesn't ask you to do anything risky"],
  },
  {
    channel: "Email", from: "DHL Express <dhl@dhl-parcel-redelivery.net>", subject: "Your parcel is on hold: customs fee ₹49 unpaid", phish: true,
    body: "We tried to deliver your package. A customs fee of ₹49 is pending. Pay within 48 hours or the parcel returns to sender.",
    link: "https://dhl-parcel-redelivery.net/pay",
    tells: ["Small fee to lower your guard, then your card details are stolen", "Domain isn't dhl.com", "You weren't expecting an international parcel"],
  },
  {
    channel: "Email", from: "notifications@github.com", subject: "[GitHub] A third-party OAuth application has been added to your account", phish: false,
    body: "Hey there! A third-party OAuth application (Vercel) with read:user and repo scopes was recently authorized to access your account. Visit your settings to review.",
    link: "https://github.com/settings/applications",
    tells: ["Sender and link are github.com", "Matches something you'd have just done", "Points you to settings, which you can also open yourself"],
  },
  {
    channel: "WhatsApp", from: "Papa (new number)", phish: true,
    body: "Beta this is my new number, old phone broke. Urgent, need ₹15,000 for hospital bill, please send to this UPI now, I'll explain later. Don't call, I'm in a meeting.",
    tells: ["'New number' + urgent money is the classic family impersonation scam", "'Don't call' stops you from verifying", "Always call the old number or another family member first"],
  },
];

export function PhishQuiz() {
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const done = i >= ROUNDS.length;
  const r = ROUNDS[i];

  if (done) {
    const verdict = score >= 7 ? "Sharp eyes. Scammers would struggle with you." : score >= 5 ? "Solid, but a couple slipped past." : "Scammers count on this. Replay and study the tells.";
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[32px] border border-line bg-raised p-10 text-center shadow-e2">
        <p className="eyebrow text-brand">Your score</p>
        <p className="display mt-3 text-8xl font-medium text-ink">{score}<span className="text-4xl text-ink-3">/{ROUNDS.length}</span></p>
        <p className="mx-auto mt-4 max-w-md text-lg text-ink-2">{verdict}</p>
        <button type="button" onClick={() => { setI(0); setScore(0); setAnswer(null); }} className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-brand px-6 font-semibold text-brand-ink hover:bg-brand-hover">
          <RotateCcw className="size-4" /> Play again
        </button>
      </motion.div>
    );
  }

  const correct = answer !== null && answer === r.phish;
  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
          <motion.div className="h-full rounded-full bg-brand" animate={{ width: `${(i / ROUNDS.length) * 100}%` }} />
        </div>
        <span className="font-mono text-sm text-ink-2">{i + 1}/{ROUNDS.length} · score {score}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.35 }}>
          <div className="overflow-hidden rounded-[32px] border border-line bg-raised shadow-e2">
            <div className="flex items-center justify-between border-b border-line bg-surface px-6 py-3 text-sm">
              <span className="font-semibold text-ink">{r.channel}</span>
              <span className="truncate pl-4 font-mono text-xs text-ink-2">{r.from}</span>
            </div>
            <div className="p-6 sm:p-8">
              {r.subject && <p className="text-lg font-semibold text-ink">{r.subject}</p>}
              <p className="mt-2 text-[1.05rem] leading-relaxed text-ink-2">{r.body}</p>
              {r.link && <p className="mt-4 break-all font-mono text-sm text-brand underline decoration-dotted underline-offset-4">{r.link}</p>}
            </div>
          </div>

          {answer === null ? (
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => { setAnswer(true); if (r.phish) setScore((s) => s + 1); }} className="h-14 rounded-full bg-danger text-lg font-semibold text-white transition-transform hover:opacity-90 active:scale-[0.98]">
                Phish
              </button>
              <button type="button" onClick={() => { setAnswer(false); if (!r.phish) setScore((s) => s + 1); }} className="h-14 rounded-full bg-safe text-lg font-semibold text-white transition-transform hover:opacity-90 active:scale-[0.98]">
                Legit
              </button>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("mt-6 rounded-[28px] p-6", correct ? "bg-safe-soft" : "bg-danger-soft")}>
              <p className={cn("flex items-center gap-2 text-lg font-semibold", correct ? "text-safe" : "text-danger")}>
                {correct ? <CircleCheck className="size-5" /> : <OctagonAlert className="size-5" />}
                {correct ? "Correct" : "Not quite"}: this one is {r.phish ? "a phish" : "legit"}.
              </p>
              <ul className="mt-3 space-y-1.5 text-ink-2">
                {r.tells.map((t) => <li key={t}>• {t}</li>)}
              </ul>
              <button type="button" onClick={() => { setI((n) => n + 1); setAnswer(null); }} className="mt-5 h-11 rounded-full bg-ink px-6 font-semibold text-bg">
                {i + 1 === ROUNDS.length ? "See my score" : "Next"}
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

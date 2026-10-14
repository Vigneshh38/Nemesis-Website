"use client";

import { Lock } from "lucide-react";
import { motion } from "motion/react";
import { Lens } from "@/components/lens/lens";

const LINE_1 = ["Check", "anything"];
const LINE_2 = ["before", "you", "trust", "it."];

export function Hero() {
  let i = 0;
  const word = (w: string, accent = false) => {
    const idx = i++;
    return (
      <span key={`${w}-${idx}`} className="mr-[0.24em] inline-block overflow-hidden pb-[0.08em] align-bottom last:mr-0">
        <motion.span
          className={accent ? "brand-gradient-text inline-block" : "inline-block"}
          initial={{ y: "105%" }}
          animate={{ y: 0 }}
          transition={{ duration: 0.9, delay: 0.08 + idx * 0.07, ease: [0.16, 1, 0.3, 1] }}
        >
          {w}
        </motion.span>
      </span>
    );
  };

  return (
    <section className="relative isolate overflow-hidden">
      <div
        className="dot-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,black,transparent)]"
        aria-hidden
      />
      <div
        className="absolute left-1/2 top-[-12rem] -z-10 h-[34rem] w-[58rem] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--brand) 16%, transparent), transparent)" }}
        aria-hidden
      />

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-14 text-center sm:px-6 sm:pt-20">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-raised px-3.5 py-1.5 text-sm font-medium text-ink-2 shadow-e1"
        >
          <span className="relative flex size-2">
            <span className="animate-pulse-ring absolute inline-flex size-full rounded-full bg-safe" />
            <span className="relative inline-flex size-2 rounded-full bg-safe" />
          </span>
          Cybersecurity toolkit for students
        </motion.p>

        <h1 className="display mx-auto mt-7 max-w-4xl text-[2.9rem] font-medium text-ink sm:text-7xl lg:text-[5.4rem]">
          <span className="block">{LINE_1.map((w) => word(w))}</span>
          <span className="block">
            {LINE_2.map((w) => word(w, w === "trust"))}
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-2 sm:text-xl"
        >
          Paste a link, a message, a password or a token. Nemesis reads it the way an attacker would, then tells you what
          it found in plain words.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10"
        >
          <Lens />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="mt-6 inline-flex items-center gap-1.5 text-xs text-ink-3"
        >
          <Lock className="size-3.5" />
          Runs entirely in your browser. Nothing you paste is uploaded.
        </motion.p>
      </div>
    </section>
  );
}

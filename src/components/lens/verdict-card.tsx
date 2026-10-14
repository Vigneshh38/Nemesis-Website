"use client";

import { ArrowRight, CircleAlert, CircleCheck, Info, OctagonAlert } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { KIND_LABEL, type Finding, type Level, type Verdict } from "@/lib/analyzers/types";
import { cn } from "@/lib/utils";
import { RiskDial } from "./risk-dial";

const ICON: Record<Level, typeof Info> = {
  safe: CircleCheck,
  warn: CircleAlert,
  danger: OctagonAlert,
  info: Info,
};
const TONE: Record<Level, string> = {
  safe: "text-safe",
  warn: "text-warn",
  danger: "text-danger",
  info: "text-brand",
};
const BAND: Record<Level, string> = {
  safe: "from-safe-soft",
  warn: "from-warn-soft",
  danger: "from-danger-soft",
  info: "from-brand-soft",
};

export function FindingRow({ f, index = 0 }: { f: Finding; index?: number }) {
  const Icon = ICON[f.level];
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 + index * 0.05, duration: 0.4 }}
      className="flex gap-3 py-3"
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", TONE[f.level])} strokeWidth={2.2} />
      <div className="min-w-0">
        <p className="font-medium text-ink">{f.title}</p>
        {f.detail && <p className="mt-0.5 text-sm leading-relaxed break-words text-ink-2">{f.detail}</p>}
      </div>
    </motion.li>
  );
}

export function VerdictCard({
  verdict,
  extra,
  kindSwitcher,
}: {
  verdict: Verdict;
  extra?: ReactNode;
  kindSwitcher?: ReactNode;
}) {
  const hasRisk = typeof verdict.risk === "number";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden rounded-[28px] border border-line bg-raised text-left shadow-e2"
    >
      <div className={cn("bg-linear-to-b to-transparent px-6 pb-2 pt-6 sm:px-8", BAND[verdict.level])}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow text-ink-3">Detected</span>
          <span className="rounded-full border border-line bg-raised px-2.5 py-0.5 text-xs font-semibold text-ink">{KIND_LABEL[verdict.kind]}</span>
          {kindSwitcher}
        </div>
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center">
          {hasRisk && (
            <div className="shrink-0 pb-5">
              <RiskDial risk={verdict.risk!} level={verdict.level} />
            </div>
          )}
          <div className="min-w-0">
            <h3 className={cn("display-tight text-[1.9rem] font-semibold leading-tight", TONE[verdict.level])}>{verdict.headline}</h3>
            <p className="mt-2 text-[0.98rem] leading-relaxed break-words text-ink-2">{verdict.summary}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-0 px-6 pb-6 sm:px-8 md:grid-cols-[1fr_240px] md:gap-8">
        <ul className="divide-y divide-line">
          {verdict.findings.map((f, i) => (
            <FindingRow key={`${f.title}-${i}`} f={f} index={i} />
          ))}
        </ul>
        {!!verdict.facts?.length && (
          <dl className="mt-4 h-fit space-y-3 rounded-2xl bg-surface p-4 md:mt-3">
            {verdict.facts.map((fact) => (
              <div key={fact.label}>
                <dt className="text-xs font-medium text-ink-3">{fact.label}</dt>
                <dd className={cn("mt-0.5 text-sm break-all text-ink", fact.mono && "font-mono")}>{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {(extra || verdict.next) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4 sm:px-8">
          <div className="min-w-0 flex-1">{extra}</div>
          {verdict.next && (
            <Link href={verdict.next.href} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
              {verdict.next.label}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
      )}
    </motion.div>
  );
}

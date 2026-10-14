"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import type { Level } from "@/lib/analyzers/types";

const R = 54;
const CX = 70;
const CY = 70;

function polar(angleDeg: number, r = R) {
  const a = ((angleDeg - 180) * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}
function arc(from: number, to: number) {
  const s = polar(from);
  const e = polar(to);
  return `M ${s.x} ${s.y} A ${R} ${R} 0 0 1 ${e.x} ${e.y}`;
}

const COLOR: Record<Level, string> = {
  safe: "var(--safe)",
  warn: "var(--warn-dot)",
  danger: "var(--danger)",
  info: "var(--brand)",
};

/** A half-circle gauge: 0 = harmless, 100 = malicious. Segments match the verdict thresholds (20 / 50). */
export function RiskDial({ risk, level, size = 140 }: { risk: number; level: Level; size?: number }) {
  const value = useMotionValue(0);
  const needleX = useTransform(value, (v) => polar((v / 100) * 180, R - 14).x);
  const needleY = useTransform(value, (v) => polar((v / 100) * 180, R - 14).y);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(value, risk, { duration: 1.1, ease: [0.16, 1, 0.3, 1] });
    const unsub = value.on("change", (v) => setDisplay(Math.round(v)));
    return () => {
      controls.stop();
      unsub();
    };
  }, [risk, value]);

  const gap = 3;
  return (
    <div className="relative" style={{ width: size, height: size * 0.62 }}>
      <svg viewBox="0 0 140 86" width={size} height={size * 0.62} aria-hidden>
        <path d={arc(0 + 0.5, 36 - gap / 2)} stroke="var(--safe)" strokeOpacity={0.9} strokeWidth="10" strokeLinecap="round" fill="none" />
        <path d={arc(36 + gap / 2, 90 - gap / 2)} stroke="var(--warn-dot)" strokeOpacity={0.9} strokeWidth="10" strokeLinecap="round" fill="none" />
        <path d={arc(90 + gap / 2, 179.5)} stroke="var(--danger)" strokeOpacity={0.9} strokeWidth="10" strokeLinecap="round" fill="none" />
        <motion.line x1={CX} y1={CY} x2={needleX} y2={needleY} stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx={CX} cy={CY} r="7" fill="var(--raised)" stroke="var(--ink)" strokeWidth="3" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex translate-y-5 flex-col items-center">
        <span className="display-tight font-mono text-2xl font-semibold tabular-nums" style={{ color: COLOR[level] }}>
          {display}
        </span>
      </div>
      <span className="sr-only">Risk score {risk} out of 100</span>
    </div>
  );
}

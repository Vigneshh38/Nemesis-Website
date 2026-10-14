import { COMMON_WORDS, KEYBOARD_ROWS } from "./common-words";
import type { Finding, Verdict } from "./types";

const WORDS = new Set(COMMON_WORDS);
const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", $: "s", "!": "i", "|": "l", "+": "t" };

export type PasswordReport = {
  bits: number;
  score: 0 | 1 | 2 | 3 | 4;
  charset: number;
  offline: string;
  slowHash: string;
  findings: Finding[];
  composition: { lower: boolean; upper: boolean; digit: boolean; symbol: boolean; length: number };
};

const SCORE_LABEL = ["Very weak", "Weak", "Fair", "Strong", "Very strong"] as const;
export const scoreLabel = (s: number) => SCORE_LABEL[s] ?? SCORE_LABEL[0];

function charsetSize(pw: string) {
  let size = 0;
  if (/[a-z]/.test(pw)) size += 26;
  if (/[A-Z]/.test(pw)) size += 26;
  if (/[0-9]/.test(pw)) size += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) size += 33;
  if (/[^\x00-\x7F]/.test(pw)) size += 100;
  return Math.max(size, 10);
}

function keyboardAdjacent(a: string, b: string) {
  for (const row of KEYBOARD_ROWS) {
    const i = row.indexOf(a);
    if (i >= 0 && (row[i + 1] === b || row[i - 1] === b)) return true;
  }
  return false;
}

export function formatDuration(seconds: number): string {
  const MIN = 60, HOUR = 3600, DAY = 86400, MONTH = 2629746, YEAR = 31556952, CENTURY = YEAR * 100;
  const plural = (n: number, unit: string) => `${n.toLocaleString("en-US")} ${unit}${n === 1 ? "" : "s"}`;
  if (!isFinite(seconds) || seconds > 4.35e17) return "longer than the age of the universe";
  if (seconds < 1) return "instantly";
  if (seconds < MIN) return plural(Math.round(seconds), "second");
  if (seconds < HOUR) return plural(Math.round(seconds / MIN), "minute");
  if (seconds < DAY) return plural(Math.round(seconds / HOUR), "hour");
  if (seconds < MONTH) return plural(Math.round(seconds / DAY), "day");
  if (seconds < YEAR) return plural(Math.round(seconds / MONTH), "month");
  if (seconds < CENTURY) return plural(Math.round(seconds / YEAR), "year");
  const centuries = Math.round(seconds / CENTURY);
  if (centuries >= 1e6) return `${Math.round(centuries / 1e6).toLocaleString("en-US")} million centuries`;
  return centuries === 1 ? "1 century" : `${centuries.toLocaleString("en-US")} centuries`;
}

export function analyzePasswordDetailed(input: string): PasswordReport {
  const pw = input.slice(0, 256);
  const len = [...pw].length;
  const charset = charsetSize(pw);
  const perChar = Math.log2(charset);
  const cost = new Array<number>(pw.length).fill(perChar);
  const findings: Finding[] = [];
  const lowered = pw.toLowerCase();
  const unleet = [...lowered].map((c) => LEET[c] ?? c).join("");

  const cover = (start: number, end: number, totalBits: number) => {
    const each = totalBits / (end - start);
    for (let i = start; i < end; i++) cost[i] = Math.min(cost[i], each);
  };

  // Dictionary words (plain and leetspeak)
  const found = new Set<string>();
  for (let i = 0; i < pw.length; i++) {
    for (let j = pw.length; j >= i + 3; j--) {
      const plain = lowered.slice(i, j);
      const decoded = unleet.slice(i, j);
      const hit = WORDS.has(plain) ? plain : WORDS.has(decoded) ? decoded : null;
      if (hit) {
        const leet = decoded === hit && plain !== hit;
        cover(i, j, Math.log2(COMMON_WORDS.length * 4) + (leet ? 2 : 0) + (/[A-Z]/.test(pw.slice(i, j)) ? 1 : 0));
        found.add(hit);
        i = j - 1;
        break;
      }
    }
  }
  if (found.size) {
    const list = [...found].slice(0, 3).map((w) => `“${w}”`).join(", ");
    findings.push({
      level: "danger",
      title: `Contains a common word: ${list}`,
      detail: "Attackers try breach lists and dictionaries first, including l33t swaps like p@ssw0rd.",
    });
  }

  // Sequences: abc, 123, 987, qwer
  let seqFound = false;
  for (let i = 0; i < pw.length - 2; ) {
    let j = i + 1;
    const step = lowered.charCodeAt(i + 1) - lowered.charCodeAt(i);
    const kb = keyboardAdjacent(lowered[i], lowered[i + 1]);
    if (Math.abs(step) === 1 || kb) {
      while (
        j < pw.length &&
        (lowered.charCodeAt(j) - lowered.charCodeAt(j - 1) === step || (kb && keyboardAdjacent(lowered[j - 1], lowered[j])))
      )
        j++;
    }
    if (j - i >= 3) {
      cover(i, j, 4 + Math.log2(j - i));
      seqFound = true;
      i = j;
    } else i++;
  }
  if (seqFound) findings.push({ level: "warn", title: "Has a sequence (like abc, 123 or qwer)", detail: "Sequences and keyboard walks are among the first patterns tried." });

  // Repeats: aaa, 111, abcabc
  const repeat = /(.)\1{2,}/g;
  let m: RegExpExecArray | null;
  let repFound = false;
  while ((m = repeat.exec(pw))) {
    cover(m.index, m.index + m[0].length, perChar + Math.log2(m[0].length));
    repFound = true;
  }
  const chunk = /(.{2,})\1+/g;
  while ((m = chunk.exec(pw))) {
    cover(m.index + m[1].length, m.index + m[0].length, Math.log2(m[0].length / m[1].length) + 1);
    repFound = true;
  }
  if (repFound) findings.push({ level: "warn", title: "Repeats characters or chunks", detail: "Repetition adds length without adding much unpredictability." });

  // Years & dates
  const year = /(19[4-9]\d|20[0-4]\d)/g;
  let yearFound = false;
  while ((m = year.exec(pw))) {
    cover(m.index, m.index + 4, 7);
    yearFound = true;
  }
  const date = /(0?[1-9]|[12]\d|3[01])[-/.]?(0?[1-9]|1[0-2])[-/.]?(\d{2}|\d{4})/g;
  while ((m = date.exec(pw))) {
    if (m[0].length >= 6) {
      cover(m.index, m.index + m[0].length, 15);
      yearFound = true;
    }
  }
  if (yearFound) findings.push({ level: "warn", title: "Contains a year or date", detail: "Birthdays and years are easy to guess from social media." });

  const lower = /[a-z]/.test(pw);
  const upper = /[A-Z]/.test(pw);
  const digit = /\d/.test(pw);
  const symbol = /[^a-zA-Z0-9]/.test(pw);

  let bits = cost.reduce((a, b) => a + b, 0);
  if (/^[A-Z][a-z]+\d{1,4}[!@#$.]?$/.test(pw)) {
    bits = Math.min(bits, 30);
    findings.push({ level: "warn", title: "Follows the “Capital + word + digits” template", detail: "The most common pattern people use to satisfy password rules." });
  }
  bits = Math.max(0, Math.round(bits * 10) / 10);

  if (len < 8) findings.push({ level: "danger", title: `Only ${len} character${len === 1 ? "" : "s"}`, detail: "Under 8 characters can be brute-forced quickly whatever you use." });
  else if (len < 12) findings.push({ level: "warn", title: `${len} characters`, detail: "Aim for 14+ — length beats complexity." });
  else findings.push({ level: "safe", title: `${len} characters long`, detail: "Length is the single biggest factor in strength." });

  const variety = [lower, upper, digit, symbol].filter(Boolean).length;
  if (variety >= 3) findings.push({ level: "safe", title: "Mixes character types" });
  else if (len < 16) findings.push({ level: "warn", title: "Uses few character types", detail: "Mix cases, digits and symbols, or make it a long passphrase." });

  const score = (bits < 28 ? 0 : bits < 40 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4) as PasswordReport["score"];
  const guesses = Math.pow(2, bits) / 2;

  return {
    bits,
    score,
    charset,
    offline: formatDuration(guesses / 1e10),
    slowHash: formatDuration(guesses / 1e4),
    findings,
    composition: { lower, upper, digit, symbol, length: len },
  };
}

export function analyzePassword(pw: string): Verdict {
  const r = analyzePasswordDetailed(pw);
  const risk = [92, 70, 42, 18, 5][r.score];
  const level = r.score <= 1 ? "danger" : r.score === 2 ? "warn" : "safe";
  return {
    kind: "password",
    risk,
    level,
    headline: `${scoreLabel(r.score)} password`,
    summary:
      r.score >= 3
        ? `A GPU rig would need ${r.offline} to crack this offline.`
        : `A GPU rig could crack this in ${r.offline}.`,
    findings: r.findings,
    facts: [
      { label: "Entropy", value: `${r.bits} bits`, mono: true },
      { label: "Fast hash (10B/s)", value: r.offline },
      { label: "bcrypt (10K/s)", value: r.slowHash },
    ],
    next: { label: "Open the full Password Lab", href: "/tools/password" },
  };
}

/** k-anonymity breach check against Have I Been Pwned. Only 5 hex chars of the SHA-1 leave the browser. */
export async function breachCount(pw: string, signal?: AbortSignal): Promise<number> {
  const data = new TextEncoder().encode(pw);
  const digest = await crypto.subtle.digest("SHA-1", data);
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  const prefix = hex.slice(0, 5);
  const suffix = hex.slice(5);
  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { "Add-Padding": "true" },
    signal,
  });
  if (!res.ok) throw new Error(`Breach service returned ${res.status}`);
  const body = await res.text();
  for (const line of body.split("\n")) {
    const [hash, count] = line.trim().split(":");
    if (hash === suffix) return parseInt(count, 10) || 0;
  }
  return 0;
}

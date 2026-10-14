"use client";

import { Check, Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { BreachCheck } from "@/components/lens/breach-check";
import { FindingRow } from "@/components/lens/verdict-card";
import { inputClass } from "@/components/ui";
import { analyzePasswordDetailed, formatDuration, scoreLabel } from "@/lib/analyzers/password";
import { cn } from "@/lib/utils";

const WORDS =
  "amber anchor apple arrow atlas autumn badge bamboo banjo beacon berry bison blossom bramble breeze brick bridge bronze buffalo cactus camel candle canyon carbon cedar cello cherry cinder citrus clover cobalt comet copper coral cosmos cotton crane crater cricket crystal cypress dahlia delta desert dolphin domino dragon drift eagle echo ember emerald falcon fern fiddle fjord flint forest fossil fox galaxy garnet gecko geyser ginger glacier granite gravel harbor hazel heron hollow honey horizon iris island ivory jade jasmine jungle juniper kayak kernel kettle kiwi lagoon lantern lava lemon lily lotus lunar mango maple marble meadow mercury meteor mint monsoon mosaic nectar nebula nickel nimbus oasis ocean olive onyx orbit orchid otter oyster palm panda papaya pebble pepper pine planet plaza plum polar prism puffin quartz quill radish rain raven reef ripple river rocket ruby saffron sage salmon sapphire satin scarlet shadow shell sierra silver sketch sparrow spice spruce stone storm summit sunset tango temple thunder tiger timber topaz tulip tundra turtle velvet violet walnut willow wombat yarn zebra zephyr".split(" ");

function rand(n: number) {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] % n;
}
function passphrase(words = 5) {
  return Array.from({ length: words }, () => WORDS[rand(WORDS.length)]).join("-") + "-" + (10 + rand(90));
}
function randomPassword(len = 20) {
  const cs = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*-_=+";
  return Array.from({ length: len }, () => cs[rand(cs.length)]).join("");
}

const SEG = ["bg-danger", "bg-danger", "bg-warn-dot", "bg-safe", "bg-safe"];

export function PasswordLab() {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<"phrase" | "random">("phrase");
  const [generated, setGenerated] = useState("");
  const [copied, setCopied] = useState(false);
  const r = useMemo(() => (pw ? analyzePasswordDetailed(pw) : null), [pw]);
  const guesses = r ? Math.pow(2, r.bits) / 2 : 0;

  const scenarios = [
    { label: "Online, rate-limited", rate: 10, note: "10 guesses/sec against a login form" },
    { label: "Online, no limits", rate: 1e3, note: "1K/sec against a careless API" },
    { label: "Offline, bcrypt", rate: 1e4, note: "Stolen database, slow hash" },
    { label: "Offline, fast hash", rate: 1e10, note: "Stolen MD5/SHA-1 database, GPU rig" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-line bg-raised p-6 shadow-e1 sm:p-8">
        <div className="relative">
          <input
            aria-label="Password to test"
            type={show ? "text" : "password"}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Type a password to test"
            autoComplete="off"
            className={cn(inputClass, "h-16 pr-14 font-mono text-lg")}
          />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide" : "Show"} className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-ink-2 hover:bg-surface">
            {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
          </button>
        </div>
        <div className="mt-5 grid grid-cols-5 gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-2 overflow-hidden rounded-full bg-surface-2">
              <motion.div className={cn("h-full", r ? SEG[r.score] : "")} initial={false} animate={{ width: r && i <= r.score ? "100%" : "0%" }} transition={{ duration: 0.4, delay: i * 0.04 }} />
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-semibold text-ink">{r ? scoreLabel(r.score) : "Waiting for input"}</span>
          <span className="font-mono text-ink-3">{r ? `${r.bits} bits of entropy` : ""}</span>
        </div>
        {pw && <BreachCheck password={pw} className="mt-5" />}
      </div>

      {r && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[28px] border border-line bg-raised p-6">
            <h2 className="font-semibold text-ink">Time to crack</h2>
            <ul className="mt-3 divide-y divide-line">
              {scenarios.map((s) => {
                const secs = guesses / s.rate;
                return (
                  <li key={s.label} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-ink">{s.label}</p>
                      <p className="text-xs text-ink-3">{s.note}</p>
                    </div>
                    <span className={cn("text-right font-mono text-sm font-semibold", secs < 86400 ? "text-danger" : secs < 3.15e9 ? "text-warn" : "text-safe")}>{formatDuration(secs)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="rounded-[28px] border border-line bg-raised p-6">
            <h2 className="font-semibold text-ink">What an attacker sees</h2>
            <ul className="mt-1 divide-y divide-line">
              {r.findings.map((f, i) => (
                <FindingRow key={f.title} f={f} index={i} />
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="rounded-[28px] bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="display-tight text-xl font-semibold text-ink">Generate a strong one</h2>
          <div className="flex rounded-full border border-line bg-raised p-1 text-sm">
            {(["phrase", "random"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} className={cn("rounded-full px-4 py-1.5 font-medium", mode === m ? "bg-brand text-brand-ink" : "text-ink-2")}>
                {m === "phrase" ? "Passphrase" : "Random"}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <output className="flex min-h-14 flex-1 items-center break-all rounded-2xl border border-line bg-raised px-4 py-3 font-mono text-base text-ink">
            {generated || <span className="text-ink-3">Press generate</span>}
          </output>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setGenerated(mode === "phrase" ? passphrase() : randomPassword()); setCopied(false); }} className="inline-flex h-14 items-center gap-2 rounded-full bg-brand px-6 font-semibold text-brand-ink hover:bg-brand-hover">
              <RefreshCw className="size-4" /> Generate
            </button>
            <button
              type="button"
              disabled={!generated}
              onClick={async () => { await navigator.clipboard.writeText(generated); setCopied(true); }}
              aria-label="Copy"
              className="grid size-14 place-items-center rounded-full border border-line-strong bg-raised text-ink hover:bg-surface disabled:opacity-40"
            >
              {copied ? <Check className="size-5 text-safe" /> : <Copy className="size-5" />}
            </button>
          </div>
        </div>
        {generated && (
          <button type="button" onClick={() => setPw(generated)} className="mt-3 text-sm font-semibold text-brand">
            Test this one ↑
          </button>
        )}
        <p className="mt-3 text-xs text-ink-3">Generated locally with crypto.getRandomValues. Store it in a password manager.</p>
      </div>
    </div>
  );
}

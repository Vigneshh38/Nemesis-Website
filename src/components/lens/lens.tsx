"use client";

import { ArrowUp, Eye, EyeOff, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { NemesisMark } from "@/components/brand/logo";
import { analyze, detectKind, KIND_LABEL, type InputKind } from "@/lib/analyzers";
import { cn } from "@/lib/utils";
import { BreachCheck } from "./breach-check";
import { VerdictCard } from "./verdict-card";

const SAMPLES: { label: string; value: string }[] = [
  { label: "Fake bank link", value: "http://sbi-kyc-update.xyz/login?verify=account" },
  {
    label: "SMS scam",
    value:
      "Dear customer, your SBI account will be BLOCKED today. Update KYC immediately at bit.ly/sbi-kyc-upd8 or share the OTP to avoid suspension.",
  },
  { label: "Password", value: "Sachin@2011" },
  {
    label: "Leaky JWT",
    value:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMUNTMDQyIiwibmFtZSI6IlByaXlhIFMiLCJyb2xlIjoic3R1ZGVudCIsInBhc3N3b3JkIjoiaHVudGVyMiIsImlhdCI6MTc2MDQwMDAwMH0.kN2v8xQ0bS4m1yJpZ7rT3cWfL9aHeU6dGqVt0YiX5oE",
  },
  { label: "Spoofed sender", value: "security-alert@paypa1.com" },
  { label: "Mystery hash", value: "5f4dcc3b5aa765d61d8327deb882cf99" },
];

const KINDS: InputKind[] = ["link", "message", "password", "email", "jwt", "hash", "ip", "base64"];

export function Lens() {
  const [input, setInput] = useState("");
  const [settled, setSettled] = useState("");
  const [forced, setForced] = useState<InputKind | null>(null);
  const [reveal, setReveal] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const scanning = input.trim() !== settled.trim();
  const detected = useMemo(() => detectKind(input), [input]);
  const kind = forced ?? detected;
  const verdict = useMemo(() => (settled.trim() ? analyze(settled, forced ?? undefined) : null), [settled, forced]);
  const masked = kind === "password" && !reveal;

  useEffect(() => {
    const t = setTimeout(() => setSettled(input), 420);
    return () => clearTimeout(t);
  }, [input]);

  // Auto-grow textarea
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [input, masked]);

  function setValue(v: string) {
    setForced(null);
    setInput(v);
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSettled(input);
        }}
        className={cn(
          "group relative flex items-start gap-3 rounded-[30px] border bg-raised py-3 pl-4 pr-3 shadow-e2 transition-[border-color,box-shadow] duration-300 focus-within:shadow-e3 sm:pl-5",
          scanning && input ? "border-brand" : "border-line focus-within:border-line-strong",
        )}
      >
        <div className="relative mt-1.5">
          <NemesisMark size={30} scanning={scanning && !!input} />
        </div>

        <label htmlFor="lens-input" className="sr-only">
          Paste a link, message, password, email, token or hash
        </label>
        <textarea
          id="lens-input"
          ref={ref}
          rows={1}
          value={input}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              setSettled(input);
            }
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          style={{ WebkitTextSecurity: masked ? "disc" : "none" } as React.CSSProperties}
          className="min-h-[42px] min-w-0 flex-1 resize-none bg-transparent py-2 text-lg leading-relaxed text-ink outline-none placeholder:text-ink-3"
          placeholder="Paste a link, an SMS, a password, a token…"
        />

        <div className="mt-1 flex shrink-0 items-center gap-1.5">
          <AnimatePresence mode="popLayout" initial={false}>
            {kind && (
              <motion.span
                key={kind}
                initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                transition={{ duration: 0.25 }}
                className="hidden rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-soft-ink sm:inline-block"
              >
                {KIND_LABEL[kind]}
              </motion.span>
            )}
          </AnimatePresence>
          {kind === "password" && (
            <button
              type="button"
              onClick={() => setReveal((v) => !v)}
              className="grid size-10 place-items-center rounded-full text-ink-2 hover:bg-surface"
              aria-label={reveal ? "Hide password" : "Show password"}
            >
              {reveal ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
            </button>
          )}
          {input && (
            <button
              type="button"
              onClick={() => {
                setValue("");
                setSettled("");
                ref.current?.focus();
              }}
              className="grid size-10 place-items-center rounded-full text-ink-2 hover:bg-surface"
              aria-label="Clear"
            >
              <X className="size-[18px]" />
            </button>
          )}
          <button
            type="submit"
            disabled={!input.trim()}
            className="grid size-11 place-items-center rounded-full bg-brand text-brand-ink shadow-e1 transition-[background-color,transform,opacity] hover:bg-brand-hover active:scale-95 disabled:opacity-40"
            aria-label="Inspect"
          >
            <ArrowUp className="size-5" strokeWidth={2.4} />
          </button>
        </div>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2" aria-label="Examples">
        <span className="mr-1 text-sm text-ink-3">Try</span>
        {SAMPLES.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => {
              setValue(s.value);
              setSettled(s.value);
              setReveal(false);
            }}
            className="rounded-full border border-line bg-raised px-3.5 py-1.5 text-sm font-medium text-ink-2 transition-[border-color,color,transform] hover:-translate-y-px hover:border-brand hover:text-brand"
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-8" aria-live="polite">
        <AnimatePresence mode="wait">
          {verdict && (
            <VerdictCard
              key={`${verdict.kind}-${settled}`}
              verdict={verdict}
              kindSwitcher={
                <label className="ml-auto inline-flex items-center gap-2 text-xs text-ink-3">
                  Treat as
                  <select
                    value={verdict.kind}
                    onChange={(e) => setForced(e.target.value as InputKind)}
                    className="rounded-full border border-line bg-raised px-2 py-1 text-xs font-medium text-ink outline-none focus:border-brand"
                  >
                    {KINDS.map((k) => (
                      <option key={k} value={k}>
                        {KIND_LABEL[k]}
                      </option>
                    ))}
                  </select>
                </label>
              }
              extra={verdict.kind === "password" ? <BreachCheck password={settled} /> : undefined}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

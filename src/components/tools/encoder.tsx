"use client";

import { ArrowDown, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { inputClass } from "@/components/ui";
import { cn } from "@/lib/utils";

const enc = new TextEncoder();
const dec = new TextDecoder();
const toB64 = (s: string) => { let b = ""; enc.encode(s).forEach((x) => (b += String.fromCharCode(x))); return btoa(b); };
const fromB64 = (s: string) => {
  const clean = s.trim().replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  return dec.decode(Uint8Array.from(atob(clean + "=".repeat((4 - (clean.length % 4)) % 4)), (c) => c.charCodeAt(0)));
};
const shift = (s: string, n: number) => s.replace(/[a-z]/gi, (c) => { const b = c <= "Z" ? 65 : 97; return String.fromCharCode(((c.charCodeAt(0) - b + n + 26 * 10) % 26) + b); });
const fromHex = (s: string) => {
  const hex = s
    .split("\n")
    .map((l) => l.replace(/^\s*[0-9a-f]{4,8}:\s?/i, "").split(/\s{2,}/)[0])
    .join("")
    .replace(/0x/gi, "")
    .replace(/[^0-9a-f]/gi, "");
  if (hex.length % 2) throw new Error("Hex needs an even number of digits");
  return dec.decode(Uint8Array.from(hex.match(/../g) ?? [], (h) => parseInt(h, 16)));
};

const OPS: Record<string, { label: string; fn: (s: string) => string }> = {
  "b64-enc": { label: "Base64 encode", fn: toB64 },
  "b64-dec": { label: "Base64 decode", fn: fromB64 },
  "hex-enc": { label: "Hex encode", fn: (s) => [...enc.encode(s)].map((b) => b.toString(16).padStart(2, "0")).join(" ") },
  "hex-dec": { label: "Hex decode", fn: fromHex },
  "url-enc": { label: "URL encode", fn: encodeURIComponent },
  "url-dec": { label: "URL decode", fn: decodeURIComponent },
  rot13: { label: "ROT13", fn: (s) => shift(s, 13) },
  "caesar-3": { label: "Caesar −3", fn: (s) => shift(s, -3) },
  "bin-enc": { label: "Binary encode", fn: (s) => [...enc.encode(s)].map((b) => b.toString(2).padStart(8, "0")).join(" ") },
  "bin-dec": { label: "Binary decode", fn: (s) => dec.decode(Uint8Array.from(s.replace(/[^01]/g, "").match(/.{8}/g) ?? [], (b) => parseInt(b, 2))) },
  reverse: { label: "Reverse", fn: (s) => [...s].reverse().join("") },
  "html-enc": { label: "HTML escape", fn: (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`) },
};

export function Encoder() {
  const [input, setInput] = useState("");
  const [steps, setSteps] = useState<string[]>(["b64-dec"]);

  const results = useMemo(() => {
    const out: { value: string; error?: string }[] = [];
    let cur = input;
    for (const id of steps) {
      try {
        cur = OPS[id].fn(cur);
        out.push({ value: cur });
      } catch (e) {
        out.push({ value: "", error: e instanceof Error ? e.message : "Couldn't decode this input" });
        break;
      }
    }
    return out;
  }, [input, steps]);

  const final = results[results.length - 1];
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-3">
        <textarea aria-label="Input" value={input} onChange={(e) => setInput(e.target.value)} rows={6} spellCheck={false} placeholder="Paste text to encode or decode" className={cn(inputClass, "font-mono text-sm")} />
        {steps.map((id, i) => (
          <div key={`${id}-${i}`} className="space-y-3">
            <div className="flex items-center gap-2">
              <ArrowDown className="size-4 text-ink-3" />
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft py-1 pl-3 pr-1 text-sm font-semibold text-brand-soft-ink">
                {OPS[id].label}
                <button type="button" aria-label={`Remove ${OPS[id].label}`} onClick={() => setSteps((s) => s.filter((_, j) => j !== i))} className="grid size-6 place-items-center rounded-full hover:bg-raised">
                  <X className="size-3.5" />
                </button>
              </span>
            </div>
            {results[i] && i < steps.length - 1 && !results[i].error && (
              <p className="rounded-2xl bg-surface px-4 py-3 font-mono text-xs break-all text-ink-2">{results[i].value || "∅"}</p>
            )}
          </div>
        ))}
        <div className="rounded-[24px] border border-line bg-raised p-5 shadow-e1">
          <p className="eyebrow text-ink-3">Output</p>
          {final?.error ? (
            <p className="mt-2 text-sm font-medium text-danger">{final.error}. Check the input or the steps.</p>
          ) : (
            <p className="mt-2 min-h-12 font-mono text-sm break-all whitespace-pre-wrap text-ink">{steps.length ? final?.value : input}</p>
          )}
        </div>
      </div>
      <div className="rounded-[28px] bg-surface p-5">
        <p className="text-sm font-semibold text-ink">Add a step</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(OPS).map(([id, op]) => (
            <button key={id} type="button" onClick={() => setSteps((s) => [...s, id])} className="inline-flex items-center gap-1 rounded-full border border-line bg-raised px-3 py-1.5 text-xs font-medium text-ink-2 hover:border-brand hover:text-brand">
              <Plus className="size-3" /> {op.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setSteps([])} className="mt-4 text-xs font-semibold text-ink-3 hover:text-danger">Clear steps</button>
        <p className="mt-4 text-xs leading-relaxed text-ink-3">Steps run top to bottom, like a recipe. Hex decode understands xxd dumps (offsets are skipped).</p>
      </div>
    </div>
  );
}

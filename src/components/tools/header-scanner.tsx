"use client";

import { ChevronDown, CircleCheck, CircleAlert, Loader2, OctagonAlert, Radar } from "lucide-react";
import { motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { inputClass } from "@/components/ui";
import type { HeaderScan } from "@/lib/header-scan";
import { cn } from "@/lib/utils";

const GRADE_COLOR: Record<string, string> = { "A+": "var(--safe)", A: "var(--safe)", B: "var(--warn-dot)", C: "var(--warn-dot)", D: "var(--danger)", F: "var(--danger)" };

export function HeaderScanner() {
  const params = useSearchParams();
  const [url, setUrl] = useState(params.get("url") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scan, setScan] = useState<HeaderScan | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const autoRan = useRef(false);

  async function run(target = url) {
    if (!target.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/scan/headers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: target }) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Scan failed.");
        setScan(null);
      } else setScan(data);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initial = params.get("url");
    if (initial && !autoRan.current) {
      autoRan.current = true;
      run(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <form onSubmit={(e) => { e.preventDefault(); run(); }} className="flex flex-col gap-3 sm:flex-row">
        <input aria-label="Website to scan" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="example.com" spellCheck={false} className={cn(inputClass, "h-14 rounded-full px-6 font-mono shadow-e1")} />
        <button type="submit" disabled={loading || !url.trim()} className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-brand px-8 font-semibold text-brand-ink hover:bg-brand-hover disabled:opacity-50">
          {loading ? <Loader2 className="size-5 animate-spin" /> : <Radar className="size-5" />} {loading ? "Scanning…" : "Scan"}
        </button>
      </form>
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="text-ink-3">Try</span>
        {["google.com", "github.com", "wikipedia.org", "example.com"].map((d) => (
          <button key={d} type="button" onClick={() => { setUrl(d); run(d); }} className="rounded-full border border-line bg-raised px-3 py-1 font-mono text-xs text-ink-2 hover:border-brand hover:text-brand">
            {d}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="rounded-2xl bg-danger-soft px-5 py-4 text-sm font-medium text-danger">{error}</p>}

      {scan && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-[28px] border border-line bg-raised shadow-e2">
          <div className="flex flex-col gap-6 border-b border-line p-6 sm:flex-row sm:items-center sm:p-8">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="grid size-28 shrink-0 place-items-center rounded-[32px] text-5xl font-semibold text-white display-tight"
              style={{ background: GRADE_COLOR[scan.grade] }}
            >
              {scan.grade}
            </motion.div>
            <div className="min-w-0">
              <p className="break-all font-mono text-sm text-ink-3">{scan.finalUrl}</p>
              <p className="display-tight mt-1 text-3xl font-semibold text-ink">{scan.score}/100</p>
              <p className="mt-1 text-sm text-ink-2">
                HTTP {scan.status}
                {scan.chain.length > 1 && ` · ${scan.chain.length - 1} redirect${scan.chain.length > 2 ? "s" : ""}`}
                {scan.leaks.length > 0 && ` · ${scan.leaks.length} version leak${scan.leaks.length > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <ul className="divide-y divide-line">
            {scan.checks.map((c, i) => {
              const Icon = c.status === "pass" ? CircleCheck : c.status === "partial" ? CircleAlert : OctagonAlert;
              const tone = c.status === "pass" ? "text-safe" : c.status === "partial" ? "text-warn" : "text-danger";
              return (
                <motion.li key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 * i }} className="flex gap-4 px-6 py-4 sm:px-8">
                  <Icon className={cn("mt-0.5 size-5 shrink-0", tone)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-medium text-ink">{c.name}</p>
                      <span className="font-mono text-xs text-ink-3">+{c.earned}/{c.weight}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-ink-2">{c.why}</p>
                    {c.value ? (
                      <p className="mt-2 break-all rounded-xl bg-surface px-3 py-2 font-mono text-xs text-ink-2">{c.value}</p>
                    ) : (
                      <p className="mt-2 break-all rounded-xl bg-brand-soft px-3 py-2 font-mono text-xs text-brand-soft-ink">Fix: {c.fix}</p>
                    )}
                  </div>
                </motion.li>
              );
            })}
            {scan.leaks.map((l) => (
              <li key={l.header} className="flex gap-4 px-6 py-4 sm:px-8">
                <CircleAlert className="mt-0.5 size-5 shrink-0 text-warn" />
                <div>
                  <p className="font-medium text-ink">Reveals software version ({l.header}) · −5</p>
                  <p className="mt-1 font-mono text-xs text-ink-2">{l.value}</p>
                </div>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setShowRaw((v) => !v)} className="flex w-full items-center justify-between border-t border-line px-6 py-4 text-sm font-semibold text-ink-2 hover:bg-surface sm:px-8">
            Raw response headers ({scan.headers.length})
            <ChevronDown className={cn("size-4 transition-transform", showRaw && "rotate-180")} />
          </button>
          {showRaw && (
            <dl className="max-h-96 overflow-auto border-t border-line bg-surface px-6 py-4 font-mono text-xs sm:px-8">
              {scan.headers.map(([k, v]) => (
                <div key={k} className="py-1 break-all">
                  <dt className="inline font-semibold text-ink">{k}: </dt>
                  <dd className="inline text-ink-2">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </motion.div>
      )}
    </div>
  );
}

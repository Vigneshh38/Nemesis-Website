"use client";

import { Link2, X } from "lucide-react";
import { motion } from "motion/react";
import { useDeferredValue, useMemo, useState } from "react";
import { VerdictCard } from "@/components/lens/verdict-card";
import { inputClass } from "@/components/ui";
import { analyzeLink, parseLink, registrableDomain } from "@/lib/analyzers/link";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "https://accounts.google.com/signin",
  "http://paypa1.com/secure/login",
  "https://www.amazon.in.order-refund.top/claim?id=8812",
  "https://bit.ly/3xFreeRecharge",
  "http://192.168.10.5:8080/kyc/update.apk",
];

function Anatomy({ raw }: { raw: string }) {
  const url = parseLink(raw);
  if (!url || !/^https?:$/.test(url.protocol)) return null;
  const host = url.hostname;
  const isIp = /^[\d.]+$/.test(host) || host.startsWith("[");
  const reg = isIp ? host : registrableDomain(host);
  const sub = host.endsWith(reg) ? host.slice(0, host.length - reg.length) : "";
  const parts = [
    { text: `${url.protocol}//`, label: "scheme", cls: "text-ink-3" },
    ...(url.username ? [{ text: `${url.username}@`, label: "decoy", cls: "text-danger" }] : []),
    ...(sub ? [{ text: sub, label: "subdomain", cls: "text-ink-2" }] : []),
    { text: reg, label: "real domain", cls: "rounded-md bg-brand-soft px-1 font-semibold text-brand-soft-ink" },
    ...(url.port ? [{ text: `:${url.port}`, label: "port", cls: "text-warn" }] : []),
    ...(url.pathname !== "/" ? [{ text: url.pathname, label: "path", cls: "text-ink-2" }] : []),
    ...(url.search ? [{ text: url.search, label: "query", cls: "text-ink-3" }] : []),
  ];
  return (
    <div className="rounded-[28px] border border-line bg-raised p-6">
      <p className="eyebrow text-ink-3">Anatomy</p>
      <div className="mt-4 flex flex-wrap items-end gap-y-4 font-mono text-[15px] leading-none">
        {parts.map((p, i) => (
          <motion.span key={`${p.label}-${i}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="flex min-w-0 flex-col">
            <span className={cn("break-all py-1", p.cls)}>{p.text}</span>
            <span className={cn("mt-1.5 border-t pt-1 font-sans text-[11px] font-medium", p.label === "real domain" ? "border-brand text-brand" : "border-line-strong text-ink-3")}>
              {p.label}
            </span>
          </motion.span>
        ))}
      </div>
      <p className="mt-5 text-sm text-ink-2">
        Read domains <strong className="text-ink">right to left</strong>: whoever owns <span className="font-mono text-brand">{reg}</span> controls this page.
        Everything to its left is decoration they chose.
      </p>
    </div>
  );
}

export function LinkInspector() {
  const [value, setValue] = useState("");
  const deferred = useDeferredValue(value);
  const verdict = useMemo(() => (deferred.trim() ? analyzeLink(deferred) : null), [deferred]);
  return (
    <div className="space-y-6">
      <div className="relative">
        <Link2 className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-ink-3" />
        <input
          aria-label="Link to inspect"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Paste a link, e.g. https://example.com/login"
          autoComplete="off"
          spellCheck={false}
          className={cn(inputClass, "h-16 rounded-full pl-14 pr-14 font-mono text-base shadow-e1")}
        />
        {value && (
          <button type="button" onClick={() => setValue("")} aria-label="Clear" className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-ink-2 hover:bg-surface">
            <X className="size-[18px]" />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button key={ex} type="button" onClick={() => setValue(ex)} className="max-w-full truncate rounded-full border border-line bg-raised px-3 py-1.5 font-mono text-xs text-ink-2 hover:border-brand hover:text-brand">
            {ex.replace(/^https?:\/\//, "")}
          </button>
        ))}
      </div>
      {verdict && (
        <div key={deferred} className="space-y-6">
          <Anatomy raw={deferred} />
          <VerdictCard verdict={verdict} />
        </div>
      )}
    </div>
  );
}

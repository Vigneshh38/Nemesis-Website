"use client";

import { CircleCheck, ImagePlus, Loader2, X } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Field, inputClass } from "@/components/ui";
import { cn, REPORT_TYPE_LABEL } from "@/lib/utils";

type Done = { caseId: string; emailed: boolean; scan: { risk: number | null; headline: string } };

export function ReportForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Done | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[32px] border border-line bg-raised p-8 text-center shadow-e2 sm:p-12">
        <CircleCheck className="mx-auto size-14 text-safe" />
        <p className="eyebrow mt-6 text-ink-3">Case filed</p>
        <p className="display mt-2 font-mono text-5xl font-medium text-ink">{done.caseId}</p>
        <p className="mx-auto mt-4 max-w-md text-ink-2">
          {done.emailed ? "A confirmation is on its way to your inbox." : "Saved. We couldn't send the confirmation email, but you can track the case from your dashboard."}
          {done.scan.risk !== null && ` Auto-scan: ${done.scan.headline.toLowerCase()} (risk ${done.scan.risk}/100).`}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className="inline-flex h-11 items-center rounded-full bg-brand px-6 font-semibold text-brand-ink">Track it</Link>
          <button type="button" onClick={() => { setDone(null); setFiles([]); }} className="h-11 rounded-full border border-line-strong px-6 font-semibold text-ink">File another</button>
        </div>
      </motion.div>
    );
  }

  return (
    <form
      className="space-y-6 rounded-[32px] border border-line bg-raised p-6 shadow-e1 sm:p-8"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const fd = new FormData(e.currentTarget);
        fd.delete("evidence");
        files.forEach((f) => fd.append("evidence", f));
        try {
          const res = await fetch("/api/reports", { method: "POST", body: fd });
          const data = await res.json();
          if (!res.ok) setError(data.error ?? "Couldn't file the report.");
          else {
            setDone(data);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        } catch {
          setError("Network error. Your report wasn't sent. Try again.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <Field label="What kind of incident?" htmlFor="type">
        <select id="type" name="type" required defaultValue="phishing" className={inputClass}>
          {Object.entries(REPORT_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </Field>
      <Field label="Short title" htmlFor="title">
        <input id="title" name="title" required minLength={4} maxLength={140} placeholder="Fake KYC SMS pretending to be SBI" className={inputClass} />
      </Field>
      <Field label="What happened?" htmlFor="description" hint="Include what they asked for and what you did. At least 20 characters.">
        <textarea id="description" name="description" required minLength={20} maxLength={4000} rows={5} className={inputClass} />
      </Field>
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Field label="Suspicious link (optional)" htmlFor="suspectUrl" hint="We'll auto-scan it.">
            <input id="suspectUrl" name="suspectUrl" placeholder="https://…" className={cn(inputClass, "font-mono text-sm")} />
          </Field>
        </div>
        <Field label="When?" htmlFor="occurredOn">
          <input id="occurredOn" name="occurredOn" type="date" required max={today} defaultValue={today} className={inputClass} />
        </Field>
      </div>
      <Field label="Money lost (₹, optional)" htmlFor="amountLost">
        <input id="amountLost" name="amountLost" type="number" min={0} step={1} placeholder="0" className={cn(inputClass, "sm:max-w-xs")} />
      </Field>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-ink">Screenshots (up to 3, 5 MB each)</p>
        <div className="flex flex-wrap gap-3">
          {previews.map((src, i) => (
            <div key={src} className="relative size-24 overflow-hidden rounded-2xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Evidence ${i + 1}`} className="size-full object-cover" />
              <button type="button" onClick={() => setFiles((f) => f.filter((_, j) => j !== i))} aria-label="Remove" className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-ink/70 text-bg">
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          {files.length < 3 && (
            <label className="grid size-24 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-line-strong text-ink-3 hover:border-brand hover:text-brand">
              <ImagePlus className="size-6" />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                className="sr-only"
                onChange={(e) => {
                  const picked = Array.from(e.target.files ?? []);
                  const tooBig = picked.find((f) => f.size > 5 * 1024 * 1024);
                  if (tooBig) setError(`“${tooBig.name}” is over 5 MB.`);
                  setFiles((f) => [...f, ...picked.filter((p) => p.size <= 5 * 1024 * 1024)].slice(0, 3));
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
        <p className="text-xs text-ink-3">Location and camera data are stripped when images are stored.</p>
      </div>

      {error && <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{error}</p>}
      <button type="submit" disabled={busy} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand font-semibold text-brand-ink hover:bg-brand-hover disabled:opacity-60 sm:w-auto sm:px-8">
        {busy && <Loader2 className="size-4 animate-spin" />} {busy ? "Filing…" : "File report"}
      </button>
    </form>
  );
}

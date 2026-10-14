"use client";

import { FileUp, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { inputClass } from "@/components/ui";
import { identifyHash } from "@/lib/analyzers/misc";
import { cn } from "@/lib/utils";

const ALGOS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;

async function digestAll(data: BufferSource) {
  const out: Record<string, string> = {};
  for (const a of ALGOS) {
    const buf = await crypto.subtle.digest(a, data);
    out[a] = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return out;
}

export function HashLab() {
  const [mode, setMode] = useState<"text" | "file">("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [expected, setExpected] = useState("");
  const [drag, setDrag] = useState(false);
  const [unknown, setUnknown] = useState("");

  useEffect(() => {
    if (mode !== "text") return;
    let live = true;
    digestAll(new TextEncoder().encode(text)).then((h) => live && setHashes(h));
    return () => { live = false; };
  }, [text, mode]);

  async function onFile(f: File | undefined) {
    if (!f) return;
    if (f.size > 500 * 1024 * 1024) return alert("Files over 500 MB aren't supported in the browser.");
    setFile(f);
    setBusy(true);
    setHashes(await digestAll(await f.arrayBuffer()));
    setBusy(false);
  }

  const exp = expected.trim().toLowerCase();
  const match = exp ? Object.entries(hashes).find(([, v]) => v === exp)?.[0] : undefined;
  const ids = useMemo(() => identifyHash(unknown), [unknown]);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-line bg-raised p-6 shadow-e1 sm:p-8">
        <div className="flex w-fit rounded-full border border-line bg-surface p-1 text-sm">
          {(["text", "file"] as const).map((m) => (
            <button key={m} type="button" onClick={() => { setMode(m); setHashes({}); setFile(null); }} className={cn("rounded-full px-5 py-1.5 font-medium capitalize", mode === m ? "bg-brand text-brand-ink" : "text-ink-2")}>
              {m}
            </button>
          ))}
        </div>
        {mode === "text" ? (
          <textarea aria-label="Text to hash" value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Type or paste text" className={cn(inputClass, "mt-5 font-mono")} />
        ) : (
          <label
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files[0]); }}
            className={cn("mt-5 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center transition-colors", drag ? "border-brand bg-brand-soft" : "border-line-strong hover:bg-surface")}
          >
            {busy ? <Loader2 className="size-8 animate-spin text-brand" /> : <FileUp className="size-8 text-brand" />}
            <span className="mt-3 font-medium text-ink">{file ? file.name : "Drop a file or click to choose"}</span>
            <span className="mt-1 text-xs text-ink-3">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · hashed locally` : "The file never leaves your device"}</span>
            <input type="file" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
        )}
        <label className="mt-5 block text-sm font-semibold text-ink" htmlFor="expected">Compare with a published checksum (optional)</label>
        <input id="expected" value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="Paste the expected hash" className={cn(inputClass, "mt-2 font-mono text-sm")} />
        {exp && Object.keys(hashes).length > 0 && (
          <p className={cn("mt-3 rounded-2xl px-4 py-3 text-sm font-semibold", match ? "bg-safe-soft text-safe" : "bg-danger-soft text-danger")}>
            {match ? `Match (${match}). The file is exactly what the publisher released.` : "No match. The file was changed, corrupted, or the checksum is for something else."}
          </p>
        )}
      </div>

      {Object.keys(hashes).length > 0 && (
        <dl className="divide-y divide-line overflow-hidden rounded-[28px] border border-line bg-raised">
          {ALGOS.map((a) => (
            <div key={a} className={cn("grid gap-1 px-6 py-4 sm:grid-cols-[100px_1fr]", match === a && "bg-safe-soft")}>
              <dt className="text-sm font-semibold text-ink">{a}{a === "SHA-1" && <span className="ml-1 text-xs font-normal text-warn">weak</span>}</dt>
              <dd className="font-mono text-xs break-all text-ink-2">{hashes[a]}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="rounded-[28px] bg-surface p-6 sm:p-8">
        <h2 className="display-tight text-xl font-semibold text-ink">Identify a hash</h2>
        <input aria-label="Unknown hash" value={unknown} onChange={(e) => setUnknown(e.target.value)} placeholder="e.g. 5f4dcc3b5aa765d61d8327deb882cf99" className={cn(inputClass, "mt-4 font-mono text-sm")} />
        {unknown.trim() && (
          <ul className="mt-4 space-y-2">
            {ids.length ? ids.map((h) => (
              <li key={h.name} className="rounded-2xl bg-raised p-4">
                <p className={cn("font-semibold", h.strong ? "text-safe" : "text-danger")}>{h.name}</p>
                <p className="mt-1 text-sm text-ink-2">{h.note}</p>
              </li>
            )) : <li className="text-sm text-ink-3">Doesn&apos;t match a common format.</li>}
          </ul>
        )}
      </div>
    </div>
  );
}

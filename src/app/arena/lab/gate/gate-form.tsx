"use client";

import { DoorOpen, Loader2 } from "lucide-react";
import { useState } from "react";
import { inputClass } from "@/components/ui";
import { cn } from "@/lib/utils";

export function GateForm() {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ ok: boolean; message: string; flag?: string } | null>(null);
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const r = await fetch("/api/arena/gate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
          setRes(await r.json());
        } catch {
          setRes({ ok: false, message: "Network error. Try again." });
        }
        setBusy(false);
      }}
    >
      <label htmlFor="badge" className="text-sm font-semibold text-ink">Present a badge</label>
      <textarea id="badge" value={token} onChange={(e) => setToken(e.target.value.trim())} rows={4} spellCheck={false} className={cn(inputClass, "font-mono text-xs")} placeholder="Paste a token" />
      <button type="submit" disabled={busy || !token} className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-6 font-semibold text-brand-ink disabled:opacity-50">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <DoorOpen className="size-4" />} Open the gate
      </button>
      {res && (
        <p className={cn("rounded-2xl p-4 text-sm font-medium", res.flag ? "bg-safe-soft text-safe" : "bg-danger-soft text-danger")}>
          {res.message}
          {res.flag && <span className="mt-1 block font-mono break-all">{res.flag}</span>}
        </p>
      )}
    </form>
  );
}

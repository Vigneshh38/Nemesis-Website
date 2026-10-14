"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { inputClass } from "@/components/ui";
import { cn, STATUS_LABEL } from "@/lib/utils";

export function CaseControls({ id, status, note }: { id: string; status: string; note: string }) {
  const router = useRouter();
  const [s, setS] = useState(status);
  const [n, setN] = useState(note);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  return (
    <form
      className="mt-5 flex flex-col gap-2 border-t border-line pt-5 sm:flex-row"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg("");
        const res = await fetch(`/api/admin/reports/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: s, note: n }) });
        const data = await res.json().catch(() => ({}));
        setBusy(false);
        setMsg(res.ok ? (data.emailed ? "Updated · reporter emailed" : "Updated") : data.error ?? "Update failed");
        if (res.ok) router.refresh();
      }}
    >
      <select aria-label="Status" value={s} onChange={(e) => setS(e.target.value)} className={cn(inputClass, "py-2 sm:w-44")}>
        {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <input aria-label="Note to reporter" value={n} onChange={(e) => setN(e.target.value)} placeholder="Note to reporter (optional)" className={cn(inputClass, "py-2")} />
      <button type="submit" disabled={busy} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-brand-ink disabled:opacity-60">
        {busy && <Loader2 className="size-4 animate-spin" />} Update
      </button>
      {msg && <span className="self-center text-xs text-ink-2">{msg}</span>}
    </form>
  );
}

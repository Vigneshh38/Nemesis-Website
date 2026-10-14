"use client";

import { DatabaseZap, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { breachCount } from "@/lib/analyzers/password";
import { cn } from "@/lib/utils";

type State = { status: "idle" } | { status: "loading" } | { status: "done"; count: number } | { status: "error"; message: string };

/** Have I Been Pwned check via k-anonymity: only 5 hex characters of the SHA-1 leave the browser. */
export function BreachCheck({ password, className }: { password: string; className?: string }) {
  const [state, setState] = useState<State>({ status: "idle" });
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => {
    ctrl.current?.abort();
    setState({ status: "idle" });
  }, [password]);

  useEffect(() => () => ctrl.current?.abort(), []);

  async function run() {
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setState({ status: "loading" });
    try {
      const count = await breachCount(password, c.signal);
      if (!c.signal.aborted) setState({ status: "done", count });
    } catch (err) {
      if (c.signal.aborted) return;
      setState({ status: "error", message: err instanceof Error ? err.message : "Breach check failed" });
    }
  }

  if (state.status === "done") {
    return (
      <p className={cn("flex items-start gap-2 text-sm font-medium", state.count ? "text-danger" : "text-safe", className)} role="status">
        <DatabaseZap className="mt-0.5 size-4 shrink-0" />
        {state.count
          ? `Found ${state.count.toLocaleString("en-IN")} times in known breaches. Never use it.`
          : "Not found in any known breach. Good."}
      </p>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1", className)}>
      <button
        type="button"
        onClick={run}
        disabled={!password || state.status === "loading"}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-line-strong bg-raised px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface disabled:opacity-50"
      >
        {state.status === "loading" ? <Loader2 className="size-4 animate-spin" /> : <DatabaseZap className="size-4" />}
        Check known breaches
      </button>
      <span className="text-xs text-ink-3">
        {state.status === "error" ? state.message : "Sends only 5 characters of a hash. Your password stays here."}
      </span>
    </div>
  );
}

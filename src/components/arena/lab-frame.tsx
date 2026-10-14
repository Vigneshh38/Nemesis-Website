import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function LabFrame({ code, title, children }: { code: string; title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/arena" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-brand">
        <ArrowLeft className="size-4" /> Back to the Arena
      </Link>
      <div className="mt-6 overflow-hidden rounded-[32px] border border-line bg-raised shadow-e2">
        <div className="flex items-center gap-2 border-b border-line bg-surface px-6 py-3">
          <span className="size-3 rounded-full bg-danger/70" />
          <span className="size-3 rounded-full bg-warn-dot/70" />
          <span className="size-3 rounded-full bg-safe/70" />
          <span className="ml-3 font-mono text-xs text-ink-3">{code}</span>
        </div>
        <div className="p-6 sm:p-10">
          <h1 className="display text-4xl font-medium text-ink">{title}</h1>
          <div className="mt-6 space-y-4 text-ink-2">{children}</div>
        </div>
      </div>
    </div>
  );
}

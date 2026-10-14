import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ToolIcon } from "@/components/tool-icon";
import { getTool, TOOLS, type ToolMeta } from "@/lib/tools";
import { cn } from "@/lib/utils";

export function ToolShell({ slug, children, aside }: { slug: ToolMeta["slug"]; children: ReactNode; aside?: ReactNode }) {
  const tool = getTool(slug)!;
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 pt-8 text-sm text-ink-3">
        <Link href="/tools" className="rounded-md hover:text-brand">
          Tools
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-ink-2">{tool.name}</span>
      </nav>

      <header className="flex flex-col gap-5 pb-10 pt-6 sm:flex-row sm:items-start">
        <ToolIcon tool={tool} className="size-14 rounded-[18px]" />
        <div className="max-w-3xl">
          <h1 className="display text-[2.4rem] font-medium text-ink sm:text-[3.4rem]">{tool.name}</h1>
          <p className="mt-3 text-lg leading-relaxed text-ink-2">{tool.description}</p>
        </div>
      </header>

      <div className={cn("grid gap-8", Boolean(aside) && "lg:grid-cols-[1fr_320px]")}>
        <div className="min-w-0">{children}</div>
        {aside && <aside className="space-y-4">{aside}</aside>}
      </div>

      <div className="mt-20 border-t border-line pt-8">
        <p className="eyebrow text-ink-3">More tools</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {TOOLS.filter((t) => t.slug !== slug).map((t) => (
            <Link
              key={t.slug}
              href={`/tools/${t.slug}`}
              className="rounded-full border border-line bg-raised px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:border-brand hover:text-brand"
            >
              {t.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SideNote({ title, children, tone = "default" }: { title: string; children: ReactNode; tone?: "default" | "brand" }) {
  return (
    <div className={cn("rounded-3xl p-5", tone === "brand" ? "bg-brand-soft text-brand-soft-ink" : "border border-line bg-surface")}>
      <h2 className={cn("text-sm font-semibold", tone === "brand" ? "" : "text-ink")}>{title}</h2>
      <div className={cn("mt-2 space-y-2 text-sm leading-relaxed", tone === "brand" ? "opacity-90" : "text-ink-2")}>{children}</div>
    </div>
  );
}

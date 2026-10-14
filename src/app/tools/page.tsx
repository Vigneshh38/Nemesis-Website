import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { ToolIcon } from "@/components/tool-icon";
import { PageHeader } from "@/components/ui";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Tools",
  description: "Link inspector, password lab, security header scanner, JWT workbench, hash lab and encoder.",
};

export default function ToolsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Toolkit"
        title="Tools that explain themselves."
        lede="Each tool tells you what it found and why it matters. Everything except the header scanner runs in your browser, so nothing you paste leaves this page."
      />
      <section className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-2">
        {TOOLS.map((tool, i) => (
          <Reveal key={tool.slug} delay={i * 0.05}>
            <Link
              href={`/tools/${tool.slug}`}
              className="group flex h-full items-start gap-5 rounded-[28px] border border-line bg-raised p-6 transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-e3 sm:p-8"
            >
              <ToolIcon tool={tool} className="size-14 rounded-[18px]" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="display-tight text-2xl font-semibold text-ink">{tool.name}</h2>
                  <ArrowRight className="size-5 shrink-0 text-ink-3 transition-[transform,color] duration-300 group-hover:translate-x-1 group-hover:text-brand" />
                </div>
                <p className="mt-1 font-medium text-ink-2">{tool.tagline}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink-3">{tool.description}</p>
              </div>
            </Link>
          </Reveal>
        ))}
      </section>
    </>
  );
}

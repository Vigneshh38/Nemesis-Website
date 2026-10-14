import { ArrowRight, Crosshair, Fish } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Leaderboard, LeaderboardSkeleton } from "@/components/arena/leaderboard";
import { SecurityCheckup } from "@/components/home/checkup";
import { Hero } from "@/components/home/hero";
import { Reveal } from "@/components/reveal";
import { ToolIcon } from "@/components/tool-icon";
import { ButtonLink, Chip } from "@/components/ui";
import { CHALLENGES, TOTAL_POINTS } from "@/lib/arena/challenges";
import { TOOLS } from "@/lib/tools";

export default function Home() {
  return (
    <>
      <Hero />

      {/* Tools */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6" aria-labelledby="tools-heading">
        <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow text-brand">The toolkit</p>
            <h2 id="tools-heading" className="display mt-3 text-4xl font-medium text-ink sm:text-5xl">
              Six instruments. One rule: understand it before you click it.
            </h2>
          </div>
          <ButtonLink href="/tools" variant="secondary">
            All tools <ArrowRight className="size-4" />
          </ButtonLink>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool, i) => (
            <Reveal key={tool.slug} delay={i * 0.06}>
              <Link
                href={`/tools/${tool.slug}`}
                className="group flex h-full flex-col rounded-[28px] border border-line bg-raised p-6 transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-e3"
              >
                <div className="flex items-start justify-between">
                  <ToolIcon tool={tool} />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                    {tool.runsOn === "browser" ? "In your browser" : "Server scan"}
                  </span>
                </div>
                <h3 className="display-tight mt-6 text-xl font-semibold text-ink">{tool.name}</h3>
                <p className="mt-1 font-medium text-ink-2">{tool.tagline}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-3">{tool.description}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                  Open <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Arena */}
      <section className="relative border-y border-line bg-surface" aria-labelledby="arena-heading">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_440px] lg:gap-20">
          <Reveal>
            <p className="eyebrow text-brand">The Arena</p>
            <h2 id="arena-heading" className="display mt-3 text-4xl font-medium text-ink sm:text-5xl">
              Learn the attacks by pulling them off.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-2">
              {CHALLENGES.length} capture-the-flag challenges, from Base64 warm-ups to forging an admin token. Every flag
              teaches one defence. {TOTAL_POINTS.toLocaleString("en-IN")} points on the table.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {CHALLENGES.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-2 rounded-full border border-line bg-raised px-3 py-1.5 text-sm text-ink-2">
                  <Crosshair className="size-3.5 text-brand" />
                  {c.title}
                  <span className="font-mono text-xs text-ink-3">{c.points}</span>
                </span>
              ))}
            </div>
            <ButtonLink href="/arena" size="lg" className="mt-10">
              Enter the Arena <ArrowRight className="size-4" />
            </ButtonLink>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-ink">Top agents</h3>
              <Chip level="safe">Live</Chip>
            </div>
            <Suspense fallback={<LeaderboardSkeleton />}>
              <Leaderboard limit={5} />
            </Suspense>
          </Reveal>
        </div>
      </section>

      {/* Checkup */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6" aria-labelledby="checkup-heading">
        <Reveal className="mb-12 max-w-2xl">
          <p className="eyebrow text-brand">Security checkup</p>
          <h2 id="checkup-heading" className="display mt-3 text-4xl font-medium text-ink sm:text-5xl">
            Two minutes. Eight switches. Most attacks stop here.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-2">Tick what you've already done. Open any item to see how.</p>
        </Reveal>
        <SecurityCheckup />
      </section>

      {/* Quiz + Report */}
      <section className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-2">
        <Reveal>
          <Link
            href="/learn"
            className="group relative flex h-full flex-col overflow-hidden rounded-[32px] bg-brand p-8 text-brand-ink transition-shadow duration-300 hover:shadow-e3 sm:p-10"
          >
            <Fish className="absolute -right-6 -top-6 size-48 rotate-12 opacity-[0.12]" strokeWidth={1.4} />
            <p className="eyebrow opacity-80">Game · 8 rounds</p>
            <h2 className="display mt-3 text-4xl font-medium">Phish or Legit?</h2>
            <p className="mt-4 max-w-md text-lg opacity-90">
              Real-world emails and texts. You call it, then see the tells you missed. Most people score under 6.
            </p>
            <span className="mt-auto inline-flex items-center gap-2 pt-10 font-semibold">
              Play now <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="flex h-full flex-col rounded-[32px] border border-line bg-raised p-8 sm:p-10">
            <p className="eyebrow text-danger">Report</p>
            <h2 className="display mt-3 text-4xl font-medium text-ink">Scammed, or nearly?</h2>
            <ol className="mt-6 space-y-4">
              {[
                "Describe what happened and paste the suspicious link.",
                "Attach screenshots. Location data is stripped on upload.",
                "Get a case ID by email and track it from your dashboard.",
              ].map((text, i) => (
                <li key={text} className="flex items-start gap-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface font-mono text-sm font-semibold text-ink-2">
                    {i + 1}
                  </span>
                  <span className="pt-1 text-ink-2">{text}</span>
                </li>
              ))}
            </ol>
            <div className="mt-auto flex flex-wrap items-center gap-4 pt-10">
              <ButtonLink href="/report">File a report</ButtonLink>
              <span className="text-sm text-ink-3">Money taken? Call 1930 first.</span>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

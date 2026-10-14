import Link from "next/link";
import { NemesisLogo } from "@/components/brand/logo";

const COLUMNS = [
  {
    title: "Tools",
    links: [
      { href: "/tools/link", label: "Link Inspector" },
      { href: "/tools/password", label: "Password Lab" },
      { href: "/tools/headers", label: "Header Scanner" },
      { href: "/tools/jwt", label: "JWT Workbench" },
      { href: "/tools/hash", label: "Hash Lab" },
      { href: "/tools/encode", label: "Encoder" },
    ],
  },
  {
    title: "Practice",
    links: [
      { href: "/arena", label: "Capture the Flag" },
      { href: "/arena#leaderboard", label: "Leaderboard" },
      { href: "/learn", label: "Phish or Legit" },
      { href: "/nemesis-guard.zip", label: "Chrome extension", external: true },
    ],
  },
  {
    title: "Get help",
    links: [
      { href: "/report", label: "Report a scam" },
      { href: "/dashboard", label: "Your cases" },
      { href: "https://cybercrime.gov.in", label: "cybercrime.gov.in", external: true },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <NemesisLogo />
          <p className="mt-4 text-sm leading-relaxed text-ink-2">
            Check anything before you trust it. Practice the attacks so you recognise them. Report what slips through.
          </p>
          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-line bg-raised px-4 py-3">
            <span className="display-tight text-2xl font-semibold text-danger">1930</span>
            <span className="text-xs leading-snug text-ink-2">
              National cybercrime helpline (India).
              <br />
              Call fast if money was taken.
            </span>
          </div>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="eyebrow text-ink-3">{col.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  {"external" in l ? (
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-sm text-ink-2 transition-colors hover:text-brand">
                      {l.label} ↗
                    </a>
                  ) : (
                    <Link href={l.href} className="text-sm text-ink-2 transition-colors hover:text-brand">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Nemesis. Built for students, by students.</p>
          <p>Scans are never stored. Passwords never leave your browser.</p>
        </div>
      </div>
    </footer>
  );
}

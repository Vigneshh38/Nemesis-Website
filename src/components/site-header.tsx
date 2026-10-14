"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { LayoutDashboard, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NemesisLogo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/tools", label: "Tools" },
  { href: "/arena", label: "Arena" },
  { href: "/learn", label: "Phish or Legit" },
  { href: "/report", label: "Report" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function AuthControls({ compact = false }: { compact?: boolean }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="skeleton h-10 w-[92px] rounded-full" aria-hidden />;
  if (isSignedIn) {
    return (
      <div className="flex items-center gap-1.5">
        {!compact && (
          <Link
            href="/dashboard"
            className="hidden h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-ink-2 transition-colors hover:bg-surface hover:text-ink sm:inline-flex"
          >
            <LayoutDashboard className="size-4" />
            Dashboard
          </Link>
        )}
        <div className="grid size-10 place-items-center">
          <UserButton appearance={{ elements: { avatarBox: { width: 32, height: 32 } } }} />
        </div>
      </div>
    );
  }
  return (
    <SignInButton mode="modal">
      <button
        type="button"
        className="h-10 rounded-full bg-brand px-5 text-sm font-semibold text-brand-ink shadow-e1 transition-[background-color,transform] hover:bg-brand-hover active:scale-[0.97]"
      >
        Sign in
      </button>
    </SignInButton>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300",
        scrolled || open
          ? "border-line bg-bg/85 backdrop-blur-xl backdrop-saturate-150"
          : "border-transparent bg-bg",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="rounded-xl" aria-label="Nemesis home">
          <NemesisLogo />
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative h-10 rounded-full px-4 text-sm font-medium leading-10 transition-colors",
                  active ? "text-brand-soft-ink" : "text-ink-2 hover:text-ink",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-brand-soft"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <AuthControls />
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full text-ink-2 hover:bg-surface md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-nav"
            aria-label="Mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
            className="overflow-hidden border-t border-line md:hidden"
          >
            <ul className="flex flex-col gap-1 px-4 py-3">
              {[{ href: "/", label: "Home" }, ...NAV, { href: "/dashboard", label: "Dashboard" }].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "block rounded-2xl px-4 py-3 text-base font-medium",
                      (item.href === "/" ? pathname === "/" : isActive(pathname, item.href))
                        ? "bg-brand-soft text-brand-soft-ink"
                        : "text-ink hover:bg-surface",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

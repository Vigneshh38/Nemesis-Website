import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { Level } from "@/lib/analyzers/types";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-brand-ink shadow-e1 hover:bg-brand-hover hover:shadow-e2",
  secondary: "border border-line-strong bg-raised text-ink hover:bg-surface",
  ghost: "text-brand hover:bg-brand-soft",
  danger: "bg-danger text-white hover:opacity-90",
};
const SIZES = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-[0.95rem]",
  lg: "h-13 px-7 text-base",
};

export function buttonClass(variant: Variant = "primary", size: keyof typeof SIZES = "md", className?: string) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-[background-color,box-shadow,transform,opacity] duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: keyof typeof SIZES }) {
  return <button type="button" className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: keyof typeof SIZES }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-[28px] border border-line bg-raised", className)} {...props} />;
}

const LEVEL_STYLES: Record<Level, { chip: string; dot: string; text: string; soft: string }> = {
  safe: { chip: "bg-safe-soft text-safe", dot: "bg-safe", text: "text-safe", soft: "bg-safe-soft" },
  warn: { chip: "bg-warn-soft text-warn", dot: "bg-warn-dot", text: "text-warn", soft: "bg-warn-soft" },
  danger: { chip: "bg-danger-soft text-danger", dot: "bg-danger", text: "text-danger", soft: "bg-danger-soft" },
  info: { chip: "bg-brand-soft text-brand-soft-ink", dot: "bg-brand", text: "text-brand", soft: "bg-brand-soft" },
};
export const levelStyle = (l: Level) => LEVEL_STYLES[l];

export function Chip({ level = "info", children, className }: { level?: Level; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", LEVEL_STYLES[level].chip, className)}>
      <span className={cn("size-1.5 rounded-full", LEVEL_STYLES[level].dot)} />
      {children}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lede,
  icon,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lede: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pt-16">
      <div className="flex items-start gap-5">
        {icon && <div className="mt-1 hidden sm:block">{icon}</div>}
        <div className="max-w-3xl">
          <p className="eyebrow text-brand">{eyebrow}</p>
          <h1 className="display mt-3 text-[2.6rem] font-medium text-ink sm:text-6xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-2">{lede}</p>
          {children}
        </div>
      </div>
    </section>
  );
}

export function IconTile({ children, tone = "brand", className }: { children: ReactNode; tone?: "brand" | "safe" | "warn" | "danger" | "violet"; className?: string }) {
  const tones = {
    brand: "bg-brand-soft text-brand",
    safe: "bg-safe-soft text-safe",
    warn: "bg-warn-soft text-warn",
    danger: "bg-danger-soft text-danger",
    violet: "bg-[color-mix(in_srgb,var(--violet)_14%,transparent)] text-violet",
  };
  return <div className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", tones[tone], className)}>{children}</div>;
}

export function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

export const inputClass =
  "w-full rounded-2xl border border-line-strong bg-raised px-4 py-3 text-[0.95rem] text-ink placeholder:text-ink-3 outline-none transition-[border-color,box-shadow] focus:border-brand focus:shadow-[var(--ring)]";

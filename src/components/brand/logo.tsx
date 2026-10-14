import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * The Nemesis mark: a shield carrying a rounded "N", with a green status light.
 * `scanning` runs the lens sweep across the shield.
 */
export function NemesisMark({
  size = 32,
  scanning = false,
  className,
  title,
}: {
  size?: number;
  scanning?: boolean;
  className?: string;
  title?: string;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <linearGradient id={`g-${id}`} x1="6" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3D6BFF" />
          <stop offset="1" stopColor="#7B5CFF" />
        </linearGradient>
        <linearGradient id={`s-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`c-${id}`}>
          <path d="M20 3.2 33.6 8.4c.9.35 1.4 1.2 1.4 2.1v8.9c0 8-5.9 14.5-14.3 17-.45.13-.95.13-1.4 0C10.9 33.9 5 27.4 5 19.4v-8.9c0-.9.55-1.75 1.4-2.1L20 3.2Z" />
        </clipPath>
      </defs>
      <path
        d="M20 3.2 33.6 8.4c.9.35 1.4 1.2 1.4 2.1v8.9c0 8-5.9 14.5-14.3 17-.45.13-.95.13-1.4 0C10.9 33.9 5 27.4 5 19.4v-8.9c0-.9.55-1.75 1.4-2.1L20 3.2Z"
        fill={`url(#g-${id})`}
      />
      <path d="M14 26.5V14.2l12 12.3V14" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      {scanning && (
        <g clipPath={`url(#c-${id})`}>
          <rect x="0" y="0" width="40" height="14" fill={`url(#s-${id})`} className="animate-sweep-svg" />
        </g>
      )}
      <circle cx="32.5" cy="8.5" r="4.6" fill="var(--bg, #fff)" />
      <circle cx="32.5" cy="8.5" r="3.1" fill="#10B26C" />
    </svg>
  );
}

export function NemesisLogo({ className, size = 30 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <NemesisMark size={size} />
      <span className="display-tight text-[1.32rem] font-semibold text-ink">Nemesis</span>
    </span>
  );
}

"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("nemesis-theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.setAttribute("data-theme",d?"dark":"light")}catch(e){}})()`;

function subscribe(cb: () => void) {
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
const getTheme = () => document.documentElement.getAttribute("data-theme") ?? "light";

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light");
  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => {
        document.documentElement.setAttribute("data-theme", next);
        try {
          localStorage.setItem("nemesis-theme", next);
        } catch {}
      }}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className="grid size-10 place-items-center rounded-full text-ink-2 transition-colors hover:bg-surface hover:text-ink"
    >
      <Sun className="size-[18px] dark:hidden" strokeWidth={2} />
      <Moon className="hidden size-[18px] dark:block" strokeWidth={2} />
    </button>
  );
}

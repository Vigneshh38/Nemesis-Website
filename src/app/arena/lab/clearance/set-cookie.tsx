"use client";

import { useEffect } from "react";

export function SetVisitorCookie() {
  useEffect(() => {
    if (!document.cookie.includes("nemesis_clearance=")) {
      document.cookie = "nemesis_clearance=visitor; path=/; max-age=86400; SameSite=Lax";
    }
  }, []);
  return null;
}

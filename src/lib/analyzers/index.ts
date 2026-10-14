import { analyzeJwt, decodeJwt } from "./jwt";
import { analyzeLink } from "./link";
import { analyzeMessage } from "./message";
import { analyzeBase64, analyzeEmail, analyzeHash, analyzeIp, isValidIPv4, isValidIPv6, looksLikeHash, tryBase64 } from "./misc";
import { analyzePassword } from "./password";
import type { InputKind, Verdict } from "./types";

export * from "./types";

const DOMAIN_LIKE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,24}|xn--[a-z0-9-]+)(?::\d{1,5})?(?:[/?#][^\s]*)?$/i;

/** Decide what someone pasted into the Lens. Order matters: most specific shapes first. */
export function detectKind(raw: string): InputKind | null {
  const s = raw.trim();
  if (!s) return null;

  const words = s.split(/\s+/);
  if (words.length >= 3) return "message";

  if (words.length === 1) {
    if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(s) && decodeJwt(s)) return "jwt";
    if (looksLikeHash(s)) return "hash";
    if (isValidIPv4(s) || isValidIPv6(s)) return "ip";
    if (/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(s)) return "email";
    if (/^(https?|ftp|javascript|data|vbscript):/i.test(s) || /^www\./i.test(s) || DOMAIN_LIKE.test(s)) return "link";
    if (s.length >= 16 && tryBase64(s)) return "base64";
    if (s.length <= 128) return "password";
  }
  return "message";
}

export function analyze(raw: string, forced?: InputKind): Verdict | null {
  const kind = forced ?? detectKind(raw);
  if (!kind) return null;
  const s = raw.trim();
  switch (kind) {
    case "link":
      return analyzeLink(s);
    case "password":
      return analyzePassword(raw);
    case "message":
      return analyzeMessage(s);
    case "jwt":
      return analyzeJwt(s);
    case "hash":
      return analyzeHash(s);
    case "ip":
      return analyzeIp(s);
    case "email":
      return analyzeEmail(s);
    case "base64":
      return analyzeBase64(s);
  }
}

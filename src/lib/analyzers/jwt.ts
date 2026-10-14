import type { Finding, Verdict } from "./types";

export type DecodedJwt = {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  raw: [string, string, string];
};

export function base64UrlDecode(segment: string): string {
  const b64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function base64UrlEncode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeJwt(token: string): DecodedJwt | null {
  const parts = token.trim().split(".");
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    if (typeof header !== "object" || header === null || typeof payload !== "object" || payload === null) return null;
    return { header, payload, signature: parts[2], raw: parts as [string, string, string] };
  } catch {
    return null;
  }
}

/** Builds an unsigned token (alg: none). Exists to demonstrate why servers must reject it. */
export function forgeUnsigned(payload: Record<string, unknown>, header: Record<string, unknown> = {}): string {
  const h = base64UrlEncode(JSON.stringify({ ...header, alg: "none", typ: "JWT" }));
  const p = base64UrlEncode(JSON.stringify(payload));
  return `${h}.${p}.`;
}

const SENSITIVE_CLAIMS = /^(password|pass|pwd|secret|ssn|aadhaa?r|pan|card|cvv|otp|pin|private_?key|api_?key)$/i;

function formatTime(sec: number) {
  return new Date(sec * 1000).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function analyzeJwt(token: string, now = Date.now()): Verdict {
  const decoded = decodeJwt(token);
  if (!decoded) {
    return {
      kind: "jwt",
      level: "info",
      headline: "Couldn't decode that token",
      summary: "A JWT has three Base64URL parts separated by dots: header.payload.signature.",
      findings: [],
    };
  }
  const { header, payload, signature } = decoded;
  const findings: Finding[] = [];
  let risk = 0;
  const alg = String(header.alg ?? "missing");

  if (alg.toLowerCase() === "none" || !signature) {
    risk += 60;
    findings.push({
      level: "danger",
      title: "Unsigned token (alg: none)",
      detail: "Anyone can edit this token. A server that accepts it lets attackers become any user.",
    });
  } else if (/^HS/i.test(alg)) {
    findings.push({
      level: "info",
      title: `Shared-secret signature (${alg})`,
      detail: "Safe only if the secret is long and random. Short secrets can be brute-forced offline.",
    });
  } else if (/^(RS|PS|ES|EdDSA)/i.test(alg)) {
    findings.push({ level: "safe", title: `Public-key signature (${alg})`, detail: "Only the issuer's private key can create valid tokens." });
  }

  const exp = typeof payload.exp === "number" ? payload.exp : null;
  const nowSec = Math.floor(now / 1000);
  if (exp === null) {
    risk += 20;
    findings.push({ level: "warn", title: "Never expires", detail: "A stolen token stays valid forever. Add an exp claim." });
  } else if (exp < nowSec) {
    findings.push({ level: "info", title: "Expired", detail: `Expired ${formatTime(exp)}.` });
  } else {
    findings.push({ level: "safe", title: "Has an expiry", detail: `Valid until ${formatTime(exp)}.` });
  }

  if (typeof payload.iat === "number" && payload.iat > nowSec + 300) {
    risk += 10;
    findings.push({ level: "warn", title: "Issued in the future", detail: "The iat claim is ahead of the current time. Check the issuer's clock." });
  }

  const sensitive = Object.keys(payload).filter((k) => SENSITIVE_CLAIMS.test(k));
  if (sensitive.length) {
    risk += 30;
    findings.push({
      level: "danger",
      title: `Secrets in the payload: ${sensitive.join(", ")}`,
      detail: "JWT payloads are only encoded, not encrypted. Anyone holding the token can read them.",
    });
  }
  if (typeof payload.email === "string" || typeof payload.phone === "string") {
    findings.push({ level: "info", title: "Carries personal data", detail: "Email or phone is readable by anyone who has the token." });
  }

  risk = Math.min(100, risk);
  const level = risk >= 50 ? "danger" : risk >= 20 ? "warn" : "safe";
  const facts = [
    { label: "Algorithm", value: alg, mono: true },
    ...(payload.sub !== undefined ? [{ label: "Subject", value: String(payload.sub), mono: true }] : []),
    ...(payload.iss !== undefined ? [{ label: "Issuer", value: String(payload.iss), mono: true }] : []),
    ...(payload.role !== undefined ? [{ label: "Role", value: String(payload.role), mono: true }] : []),
  ];

  return {
    kind: "jwt",
    risk,
    level,
    headline: level === "danger" ? "Insecure token" : level === "warn" ? "Token has weaknesses" : "Token structure looks sound",
    summary: "Decoded locally. The signature itself can only be verified with the issuer's key.",
    findings,
    facts,
    next: { label: "Open in the JWT Workbench", href: `/tools/jwt#${encodeURIComponent(token.trim())}` },
  };
}

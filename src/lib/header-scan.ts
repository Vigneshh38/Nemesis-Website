import "server-only";
import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import http, { type IncomingHttpHeaders } from "node:http";
import https from "node:https";
import { isIP, type LookupFunction } from "node:net";
import { classifyIp } from "./analyzers/misc";

export type CheckStatus = "pass" | "partial" | "fail";
export type HeaderCheck = {
  id: string;
  name: string;
  header: string;
  status: CheckStatus;
  value: string | null;
  why: string;
  fix: string;
  weight: number;
  earned: number;
};
export type HeaderScan = {
  finalUrl: string;
  status: number;
  chain: { url: string; status: number }[];
  grade: string;
  score: number;
  checks: HeaderCheck[];
  leaks: { header: string; value: string }[];
  headers: [string, string][];
  scannedAt: string;
};

export class ScanError extends Error {}

const ALLOWED_PORTS = new Set(["", "80", "443", "8080", "8443"]);

function isPublicAddress(address: string) {
  const mapped = address.toLowerCase().match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return classifyIp(mapped ? mapped[1] : address).isPublic;
}

/** DNS lookup that refuses private, loopback and metadata addresses (SSRF guard, checked at connect time). */
const safeLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { all: true, family: options.family as number | undefined }, (err, addresses: LookupAddress[]) => {
    if (err) return callback(err, "", 4);
    const list = addresses ?? [];
    if (!list.length || list.some((a) => !isPublicAddress(a.address))) {
      return callback(Object.assign(new Error("Blocked: resolves to a private address"), { code: "EBLOCKED" }), "", 4);
    }
    if (options.all) return (callback as unknown as (e: null, a: LookupAddress[]) => void)(null, list);
    callback(null, list[0].address, list[0].family);
  });
};

function requestHeaders(url: URL): Promise<{ status: number; headers: IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const mod = url.protocol === "https:" ? https : http;
    const req = mod.request(
      url,
      {
        method: "GET",
        lookup: safeLookup,
        timeout: 8000,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; NemesisHeaderScan/1.0; +https://github.com/Vigneshh38/Nemesis-Website)",
          Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
        },
      },
      (res) => {
        resolve({ status: res.statusCode ?? 0, headers: res.headers });
        res.destroy();
      },
    );
    req.on("timeout", () => req.destroy(new ScanError("The site took longer than 8 seconds to answer.")));
    req.on("error", (err: NodeJS.ErrnoException) => {
      if (err instanceof ScanError) return reject(err);
      if (err.code === "EBLOCKED") return reject(new ScanError("That address points to a private network. Nemesis only scans public sites."));
      if (err.code === "ENOTFOUND" || err.code === "EAI_AGAIN") return reject(new ScanError("That domain doesn't resolve. Check the spelling."));
      if (err.code === "ECONNREFUSED") return reject(new ScanError("The server refused the connection."));
      if (err.code?.startsWith("ERR_TLS") || err.code?.includes("CERT")) return reject(new ScanError("The site's TLS certificate is invalid or untrusted."));
      reject(new ScanError(`Couldn't reach the site (${err.code ?? err.message}).`));
    });
    req.end();
  });
}

function validateTarget(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new ScanError("Only http and https sites can be scanned.");
  if (url.username || url.password) throw new ScanError("Remove the user:password part from the address.");
  if (!ALLOWED_PORTS.has(url.port)) throw new ScanError("Only standard web ports (80, 443, 8080, 8443) can be scanned.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host) && !isPublicAddress(host)) throw new ScanError("That address points to a private network. Nemesis only scans public sites.");
  if (/^(localhost|.*\.local|.*\.internal|.*\.localhost)$/i.test(host)) throw new ScanError("Nemesis only scans public sites.");
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join(", ") : (v ?? null));

export async function scanHeaders(input: string): Promise<HeaderScan> {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`);
  } catch {
    throw new ScanError("That isn't a valid web address.");
  }

  const chain: { url: string; status: number }[] = [];
  let result: { status: number; headers: IncomingHttpHeaders } | null = null;
  for (let hop = 0; hop < 6; hop++) {
    validateTarget(url);
    result = await requestHeaders(url);
    chain.push({ url: url.href, status: result.status });
    const location = one(result.headers.location);
    if (result.status >= 300 && result.status < 400 && location) {
      url = new URL(location, url);
      continue;
    }
    break;
  }
  if (!result) throw new ScanError("No response.");

  const h = result.headers;
  const isHttps = url.protocol === "https:";
  const csp = one(h["content-security-policy"]);
  const hsts = one(h["strict-transport-security"]);
  const xfo = one(h["x-frame-options"]);
  const xcto = one(h["x-content-type-options"]);
  const rp = one(h["referrer-policy"]);
  const pp = one(h["permissions-policy"]);
  const coop = one(h["cross-origin-opener-policy"]);

  const checks: HeaderCheck[] = [];
  const push = (c: Omit<HeaderCheck, "earned">) =>
    checks.push({ ...c, earned: c.status === "pass" ? c.weight : c.status === "partial" ? Math.round(c.weight / 2) : 0 });

  push({
    id: "https", name: "HTTPS", header: "—", weight: 10, value: isHttps ? url.protocol : "http:",
    status: isHttps ? "pass" : "fail",
    why: "Encrypts everything between the visitor and the site.",
    fix: "Serve the site over HTTPS and redirect all http:// traffic to it.",
  });

  const maxAge = Number(hsts?.match(/max-age=(\d+)/i)?.[1] ?? 0);
  push({
    id: "hsts", name: "Strict Transport Security", header: "Strict-Transport-Security", weight: 15, value: hsts,
    status: hsts && maxAge >= 15552000 ? "pass" : hsts ? "partial" : "fail",
    why: "Tells browsers to never connect over plain http, blocking SSL-stripping attacks.",
    fix: "Strict-Transport-Security: max-age=63072000; includeSubDomains; preload",
  });

  const unsafeCsp = csp && /(script-src|default-src)[^;]*'unsafe-(inline|eval)'/i.test(csp);
  push({
    id: "csp", name: "Content Security Policy", header: "Content-Security-Policy", weight: 25, value: csp,
    status: csp && !unsafeCsp ? "pass" : csp ? "partial" : "fail",
    why: "Limits where scripts can load from. The strongest defence against XSS.",
    fix: "Start with: Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'",
  });

  const frameProtected = Boolean(xfo && /deny|sameorigin/i.test(xfo)) || Boolean(csp && /frame-ancestors/i.test(csp));
  push({
    id: "framing", name: "Clickjacking protection", header: "X-Frame-Options", weight: 15,
    value: xfo ?? (csp?.match(/frame-ancestors[^;]*/i)?.[0] ?? null),
    status: frameProtected ? "pass" : "fail",
    why: "Stops other sites from embedding this one in an invisible frame to hijack clicks.",
    fix: "X-Frame-Options: DENY  (or CSP frame-ancestors 'none')",
  });

  push({
    id: "nosniff", name: "MIME sniffing protection", header: "X-Content-Type-Options", weight: 10, value: xcto,
    status: xcto && /nosniff/i.test(xcto) ? "pass" : "fail",
    why: "Stops browsers from guessing file types and running uploads as scripts.",
    fix: "X-Content-Type-Options: nosniff",
  });

  push({
    id: "referrer", name: "Referrer Policy", header: "Referrer-Policy", weight: 10, value: rp,
    status: rp && !/unsafe-url/i.test(rp) ? "pass" : rp ? "partial" : "fail",
    why: "Controls how much of the URL leaks to other sites when people click links.",
    fix: "Referrer-Policy: strict-origin-when-cross-origin",
  });

  push({
    id: "permissions", name: "Permissions Policy", header: "Permissions-Policy", weight: 10, value: pp,
    status: pp ? "pass" : "fail",
    why: "Switches off powerful browser features (camera, mic, location) the site doesn't use.",
    fix: "Permissions-Policy: camera=(), microphone=(), geolocation=()",
  });

  push({
    id: "coop", name: "Cross-Origin Opener Policy", header: "Cross-Origin-Opener-Policy", weight: 5, value: coop,
    status: coop ? "pass" : "fail",
    why: "Isolates the page from pop-ups it opens, blocking cross-window attacks.",
    fix: "Cross-Origin-Opener-Policy: same-origin",
  });

  const leaks: { header: string; value: string }[] = [];
  const server = one(h.server);
  if (server && /\d/.test(server)) leaks.push({ header: "Server", value: server });
  for (const name of ["x-powered-by", "x-aspnet-version", "x-aspnetmvc-version", "x-generator"]) {
    const v = one(h[name]);
    if (v) leaks.push({ header: name.replace(/(^|-)([a-z])/g, (_, d, c) => d + c.toUpperCase()), value: v });
  }

  const raw = checks.reduce((s, c) => s + c.earned, 0) - leaks.length * 5;
  const score = Math.max(0, Math.min(100, raw));
  const grade = score >= 90 ? "A+" : score >= 80 ? "A" : score >= 65 ? "B" : score >= 50 ? "C" : score >= 35 ? "D" : "F";

  return {
    finalUrl: url.href,
    status: result.status,
    chain,
    grade,
    score,
    checks,
    leaks,
    headers: Object.entries(h)
      .filter(([k]) => k !== "set-cookie")
      .map(([k, v]) => [k, one(v) ?? ""] as [string, string])
      .sort(([a], [b]) => a.localeCompare(b)),
    scannedAt: new Date().toISOString(),
  };
}

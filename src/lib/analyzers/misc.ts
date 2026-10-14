import { analyzeLink, registrableDomain } from "./link";
import type { Finding, Verdict } from "./types";

/* ───────────────────────── Hashes ───────────────────────── */

type HashInfo = { name: string; note: string; strong: boolean };

export function identifyHash(input: string): HashInfo[] {
  const s = input.trim();
  if (/^\$2[abxy]?\$\d{2}\$[./A-Za-z0-9]{53}$/.test(s)) return [{ name: "bcrypt", note: "Deliberately slow, salted. A good choice for passwords.", strong: true }];
  if (/^\$argon2(id|i|d)\$/.test(s)) return [{ name: "Argon2", note: "Memory-hard and salted. The current best practice for passwords.", strong: true }];
  if (/^\$6\$/.test(s)) return [{ name: "SHA-512 crypt", note: "Salted and iterated. Common in Linux /etc/shadow.", strong: true }];
  if (/^\$5\$/.test(s)) return [{ name: "SHA-256 crypt", note: "Salted and iterated (Unix crypt).", strong: true }];
  if (/^\$1\$/.test(s)) return [{ name: "MD5 crypt", note: "Legacy Unix format. Crackable on modern GPUs.", strong: false }];
  if (/^scrypt:|^\$scrypt\$|^\$7\$/.test(s)) return [{ name: "scrypt", note: "Memory-hard and salted.", strong: true }];
  if (!/^[a-f0-9]+$/i.test(s)) return [];
  switch (s.length) {
    case 32:
      return [
        { name: "MD5", note: "Broken. Collisions are trivial and unsalted MD5 passwords crack in seconds.", strong: false },
        { name: "NTLM", note: "Windows password hash. Unsalted, very fast to crack.", strong: false },
      ];
    case 40:
      return [{ name: "SHA-1", note: "Deprecated. Practical collisions exist (SHAttered, 2017).", strong: false }];
    case 56:
      return [{ name: "SHA-224", note: "Fine for integrity. Too fast for passwords on its own.", strong: true }];
    case 64:
      return [{ name: "SHA-256", note: "Secure for integrity checks. Too fast for storing passwords unsalted.", strong: true }];
    case 96:
      return [{ name: "SHA-384", note: "Secure for integrity checks.", strong: true }];
    case 128:
      return [{ name: "SHA-512", note: "Secure for integrity checks. Too fast for passwords unsalted.", strong: true }];
    default:
      return [];
  }
}

export function looksLikeHash(s: string) {
  return identifyHash(s).length > 0;
}

export function analyzeHash(input: string): Verdict {
  const matches = identifyHash(input);
  if (!matches.length) {
    return { kind: "hash", level: "info", headline: "Unknown hash format", summary: "The length and characters don't match a common algorithm.", findings: [] };
  }
  const primary = matches[0];
  const findings: Finding[] = matches.map((m) => ({ level: m.strong ? "safe" : "danger", title: m.name, detail: m.note }));
  return {
    kind: "hash",
    level: primary.strong ? "safe" : "warn",
    headline: matches.length > 1 ? `Probably ${matches.map((m) => m.name).join(" or ")}` : `Looks like ${primary.name}`,
    summary: primary.strong
      ? "A modern algorithm. Hashes are one-way: you can't decode them, only guess and compare."
      : "A weak algorithm. If this protects a password, assume it can be cracked.",
    findings,
    facts: [
      { label: "Length", value: `${input.trim().length} characters`, mono: true },
      { label: "Bits", value: /^[a-f0-9]+$/i.test(input.trim()) ? `${input.trim().length * 4}` : "n/a", mono: true },
    ],
    next: { label: "Hash and compare files", href: "/tools/hash" },
  };
}

/* ───────────────────────── IP addresses ───────────────────────── */

const V4_RANGES: [string, number, string, string][] = [
  ["0.0.0.0", 8, "“This network”", "Not routable. Often means 'any address'."],
  ["10.0.0.0", 8, "Private network", "Used inside homes, colleges and companies. Not reachable from the internet."],
  ["100.64.0.0", 10, "Carrier-grade NAT", "Shared by your ISP among many customers."],
  ["127.0.0.0", 8, "Loopback", "Always means 'this device'."],
  ["169.254.0.0", 16, "Link-local", "Self-assigned when DHCP fails. Also the cloud metadata range."],
  ["172.16.0.0", 12, "Private network", "Used inside private networks. Not reachable from the internet."],
  ["192.0.2.0", 24, "Documentation", "Reserved for examples (TEST-NET-1)."],
  ["192.168.0.0", 16, "Private network", "Typical home Wi-Fi range. Not reachable from the internet."],
  ["198.18.0.0", 15, "Benchmarking", "Reserved for network testing."],
  ["198.51.100.0", 24, "Documentation", "Reserved for examples (TEST-NET-2)."],
  ["203.0.113.0", 24, "Documentation", "Reserved for examples (TEST-NET-3)."],
  ["224.0.0.0", 4, "Multicast", "One-to-many traffic, not a single host."],
  ["240.0.0.0", 4, "Reserved", "Reserved for future use."],
];

function v4ToInt(ip: string) {
  return ip.split(".").reduce((acc, o) => (acc << 8) + parseInt(o, 10), 0) >>> 0;
}

export function isValidIPv4(ip: string) {
  const parts = ip.split(".");
  return parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255 && (p === "0" || !p.startsWith("0")));
}

export function isValidIPv6(ip: string) {
  if (!/^[0-9a-f:.]+$/i.test(ip) || !ip.includes(":")) return false;
  if ((ip.match(/::/g) ?? []).length > 1) return false;
  const groups = ip.split(":");
  return groups.length >= 3 && groups.length <= 8 && groups.every((g) => g === "" || /^[0-9a-f]{1,4}$/i.test(g) || isValidIPv4(g));
}

export function classifyIp(ip: string): { range: string; note: string; isPublic: boolean } {
  if (isValidIPv4(ip)) {
    if (ip === "255.255.255.255") return { range: "Broadcast", note: "Every device on the local network.", isPublic: false };
    const n = v4ToInt(ip);
    for (const [base, bits, range, note] of V4_RANGES) {
      const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
      if ((n & mask) === (v4ToInt(base) & mask)) return { range, note, isPublic: false };
    }
    return { range: "Public internet", note: "Globally routable. It belongs to an ISP, cloud or organisation.", isPublic: true };
  }
  const v6 = ip.toLowerCase();
  if (v6 === "::1") return { range: "Loopback", note: "Always means 'this device'.", isPublic: false };
  if (v6 === "::") return { range: "Unspecified", note: "Means 'no address'.", isPublic: false };
  if (/^fe[89ab]/.test(v6)) return { range: "Link-local", note: "Only valid on the local network segment.", isPublic: false };
  if (/^f[cd]/.test(v6)) return { range: "Unique local", note: "IPv6's private range.", isPublic: false };
  if (/^ff/.test(v6)) return { range: "Multicast", note: "One-to-many traffic.", isPublic: false };
  if (/^2001:0?db8:/.test(v6)) return { range: "Documentation", note: "Reserved for examples.", isPublic: false };
  return { range: "Public internet", note: "Globally routable IPv6 address.", isPublic: true };
}

export function analyzeIp(ip: string): Verdict {
  const { range, note, isPublic } = classifyIp(ip.trim());
  const version = isValidIPv4(ip.trim()) ? "IPv4" : "IPv6";
  return {
    kind: "ip",
    level: "info",
    headline: range,
    summary: note,
    findings: [
      isPublic
        ? { level: "info", title: "Reachable from the internet", detail: "Public IPs reveal an approximate location (city/ISP), not a home address." }
        : { level: "safe", title: "Not reachable from the internet", detail: "Sharing it reveals little about you." },
    ],
    facts: [
      { label: "Version", value: version, mono: true },
      { label: "Range", value: range },
    ],
  };
}

/* ───────────────────────── Email addresses ───────────────────────── */

const DISPOSABLE = new Set([
  "mailinator.com", "10minutemail.com", "guerrillamail.com", "tempmail.com", "temp-mail.org", "yopmail.com",
  "trashmail.com", "getnada.com", "sharklasers.com", "dispostable.com", "maildrop.cc", "fakeinbox.com",
  "throwawaymail.com", "mintemail.com", "emailondeck.com", "tempail.com", "moakt.com", "mohmal.com",
]);
const FREE = new Set(["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "live.com", "icloud.com", "proton.me", "protonmail.com", "rediffmail.com", "yahoo.co.in", "aol.com", "zoho.com"]);

export function analyzeEmail(email: string): Verdict {
  const addr = email.trim().toLowerCase();
  const domain = addr.split("@")[1] ?? "";
  const reg = registrableDomain(domain);
  const findings: Finding[] = [];
  let risk = 0;

  if (DISPOSABLE.has(reg)) {
    risk += 40;
    findings.push({ level: "danger", title: "Disposable inbox", detail: "Throwaway addresses are common for fake accounts and scams." });
  } else if (FREE.has(reg)) {
    findings.push({ level: "info", title: "Free email provider", detail: "Fine for people. Suspicious if it claims to be a bank, college or company." });
  }

  const asLink = analyzeLink(`https://${domain}`);
  for (const f of asLink.findings) {
    if (f.level === "danger" && /Look-alike|isn't theirs|international/.test(f.title)) {
      risk += 45;
      findings.push({ ...f, title: `Sender domain: ${f.title}` });
    }
  }
  const official = asLink.findings.find((f) => f.title.startsWith("Official"));
  if (official) findings.push({ ...official, detail: `${official.detail} Display names can still be faked, so check the full address.` });

  findings.push({
    level: "info",
    title: "Check if it appeared in a breach",
    detail: "Have I Been Pwned lists the breaches an address appears in. Look it up at haveibeenpwned.com.",
  });

  risk = Math.min(100, risk);
  const level = risk >= 50 ? "danger" : risk >= 20 ? "warn" : "safe";
  return {
    kind: "email",
    risk,
    level,
    headline: level === "danger" ? "Suspicious sender address" : level === "warn" ? "Be careful with this sender" : "Address looks ordinary",
    summary: "Nemesis checks the domain for look-alikes and throwaway providers. It doesn't contact the mailbox.",
    findings,
    facts: [
      { label: "Domain", value: domain, mono: true },
      { label: "Provider type", value: DISPOSABLE.has(reg) ? "Disposable" : FREE.has(reg) ? "Free webmail" : "Custom / organisation" },
    ],
  };
}

/* ───────────────────────── Base64 ───────────────────────── */

export function tryBase64(input: string): string | null {
  const s = input.trim();
  if (s.length < 12 || !/^[A-Za-z0-9+/_-]+={0,2}$/.test(s)) return null;
  try {
    const normal = s.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normal + "=".repeat((4 - (normal.length % 4)) % 4);
    const bin = atob(padded);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const printable = [...text].filter((c) => /[\x20-\x7E\n\r\t]|[^\x00-\x7F]/.test(c)).length;
    if (text.length < 4 || printable / text.length < 0.95) return null;
    // Real words or punctuation make it believable; random letters decoding to text is rare
    if (!/[\s{}:/.,"=]|[a-z]{3,}/i.test(text)) return null;
    return text;
  } catch {
    return null;
  }
}

export function analyzeBase64(input: string): Verdict {
  const decoded = tryBase64(input) ?? "";
  const findings: Finding[] = [];
  let risk = 0;
  const linkMatch = decoded.match(/https?:\/\/[^\s"']+/);
  if (linkMatch) {
    const v = analyzeLink(linkMatch[0]);
    risk = v.risk ?? 0;
    findings.push({
      level: v.level === "safe" ? "info" : v.level,
      title: "Hides a link",
      detail: `${linkMatch[0]} — ${v.headline.toLowerCase()}. Encoding links is a common filter-evasion trick.`,
    });
  }
  if (/powershell|cmd\.exe|eval\(|<script|frombase64string|invoke-expression/i.test(decoded)) {
    risk = Math.max(risk, 70);
    findings.push({ level: "danger", title: "Contains script or command code", detail: "Encoded commands are how many malware droppers hide their payload." });
  }
  if (/NEMESIS\{/.test(decoded)) {
    findings.push({ level: "safe", title: "That's a Nemesis flag", detail: "Submit it in the Arena." });
  }
  return {
    kind: "base64",
    risk,
    level: risk >= 50 ? "danger" : risk >= 20 ? "warn" : "info",
    headline: "Decoded Base64",
    summary: decoded.length > 160 ? `${decoded.slice(0, 160)}…` : decoded,
    findings,
    facts: [
      { label: "Encoded length", value: String(input.trim().length), mono: true },
      { label: "Decoded length", value: String(decoded.length), mono: true },
    ],
    next: { label: "Open in Encoder", href: "/tools/encode" },
  };
}

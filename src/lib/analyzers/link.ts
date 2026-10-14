import { type Finding, type Verdict, levelFromRisk } from "./types";

const MULTI_PART_SUFFIXES = new Set([
  "co.in", "net.in", "org.in", "ac.in", "edu.in", "gov.in", "res.in", "firm.in", "gen.in", "ind.in", "nic.in",
  "co.uk", "org.uk", "ac.uk", "gov.uk", "me.uk",
  "com.au", "net.au", "org.au", "edu.au", "gov.au",
  "co.nz", "com.br", "com.cn", "com.sg", "com.my", "co.jp", "co.za", "com.mx", "com.tr",
  "com.pk", "com.bd", "com.np", "com.lk", "com.ng", "co.id", "com.ph", "com.vn",
]);

/** Brand keyword → domains the brand really owns (registrable form). */
const BRANDS: Record<string, string[]> = {
  google: ["google.com", "google.co.in", "youtube.com", "gmail.com", "goo.gl", "g.co", "googleusercontent.com", "withgoogle.com"],
  youtube: ["youtube.com", "youtu.be"],
  gmail: ["gmail.com", "google.com"],
  paypal: ["paypal.com", "paypal.me"],
  microsoft: ["microsoft.com", "live.com", "office.com", "outlook.com", "microsoftonline.com", "office365.com", "bing.com", "azure.com", "msn.com"],
  outlook: ["outlook.com", "live.com", "microsoft.com", "office.com"],
  office: ["office.com", "microsoft.com", "office365.com", "microsoftonline.com"],
  apple: ["apple.com", "icloud.com"],
  icloud: ["icloud.com", "apple.com"],
  amazon: ["amazon.com", "amazon.in", "amazonaws.com", "amzn.to", "a.co", "amazon.co.uk"],
  netflix: ["netflix.com"],
  facebook: ["facebook.com", "fb.com", "fb.me", "meta.com"],
  instagram: ["instagram.com"],
  whatsapp: ["whatsapp.com", "wa.me", "whatsapp.net"],
  linkedin: ["linkedin.com", "lnkd.in"],
  github: ["github.com", "github.io", "githubusercontent.com"],
  sbi: ["sbi.co.in", "onlinesbi.sbi", "sbicard.com", "sbi"],
  hdfc: ["hdfcbank.com", "hdfc.com", "hdfclife.com"],
  icici: ["icicibank.com", "icicidirect.com"],
  axis: ["axisbank.com"],
  kotak: ["kotak.com"],
  paytm: ["paytm.com", "paytm.in", "paytmbank.com"],
  phonepe: ["phonepe.com"],
  flipkart: ["flipkart.com"],
  myntra: ["myntra.com"],
  dropbox: ["dropbox.com"],
  adobe: ["adobe.com"],
  binance: ["binance.com"],
  irctc: ["irctc.co.in"],
  incometax: ["incometax.gov.in"],
  uidai: ["uidai.gov.in"],
  aadhaar: ["uidai.gov.in"],
  steam: ["steampowered.com", "steamcommunity.com"],
  discord: ["discord.com", "discord.gg", "discordapp.com"],
  telegram: ["telegram.org", "t.me"],
};

const SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "ow.ly", "buff.ly", "rebrand.ly", "cutt.ly",
  "shorturl.at", "rb.gy", "tiny.cc", "s.id", "v.gd", "t.ly", "bit.do", "shorte.st", "adf.ly", "tr.im",
]);

const RISKY_TLDS = new Set([
  "zip", "mov", "xyz", "top", "click", "tk", "ml", "ga", "cf", "gq", "icu", "cam", "rest", "buzz",
  "monster", "sbs", "cfd", "cyou", "lol", "quest", "bond", "work", "country", "kim", "loan", "racing", "win", "download",
]);

const LURE_WORDS = [
  "login", "log-in", "signin", "sign-in", "verify", "verification", "update", "secure", "account", "banking",
  "kyc", "wallet", "reward", "bonus", "gift", "free", "prize", "claim", "unlock", "suspend", "confirm", "password", "otp", "refund",
];

/** Brands whose names are also everyday words: only exact tokens count. */
const EXACT_ONLY = new Set(["office", "apple", "steam", "outlook", "amazon", "discord", "telegram", "adobe"]);

const RISKY_EXTENSIONS = /\.(exe|scr|bat|cmd|msi|apk|jar|vbs|ps1|hta|iso|dmg|pkg|lnk)(\?|#|$)/i;

const HOMOGLYPHS: [RegExp, string][] = [
  [/rn/g, "m"], [/vv/g, "w"], [/0/g, "o"], [/1/g, "l"], [/3/g, "e"], [/4/g, "a"], [/5/g, "s"], [/7/g, "t"], [/8/g, "b"], [/\$/g, "s"], [/@/g, "a"],
];

export function registrableDomain(host: string): string {
  const parts = host.split(".").filter(Boolean);
  if (parts.length <= 2) return parts.join(".");
  const lastTwo = parts.slice(-2).join(".");
  if (MULTI_PART_SUFFIXES.has(lastTwo)) return parts.slice(-3).join(".");
  return lastTwo;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

function deHomoglyph(s: string): string {
  return HOMOGLYPHS.reduce((acc, [re, to]) => acc.replace(re, to), s);
}

function isIPv4(host: string) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
}

export function parseLink(raw: string): URL | null {
  const input = raw.trim();
  if (!input) return null;
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(input);
  try {
    return new URL(hasScheme ? input : `http://${input}`);
  } catch {
    return null;
  }
}

function ownerOf(registrable: string): string | null {
  for (const [brand, domains] of Object.entries(BRANDS)) {
    if (domains.includes(registrable)) return brand;
  }
  return null;
}

function prettyBrand(brand: string) {
  const special: Record<string, string> = {
    sbi: "SBI", hdfc: "HDFC Bank", icici: "ICICI Bank", irctc: "IRCTC", uidai: "UIDAI (Aadhaar)", aadhaar: "Aadhaar (UIDAI)",
    paypal: "PayPal", github: "GitHub", linkedin: "LinkedIn", youtube: "YouTube", whatsapp: "WhatsApp", phonepe: "PhonePe",
    incometax: "Income Tax Dept.", icloud: "iCloud",
  };
  return special[brand] ?? brand.charAt(0).toUpperCase() + brand.slice(1);
}

export function analyzeLink(raw: string): Verdict {
  const url = parseLink(raw);
  if (!url) {
    return {
      kind: "link",
      level: "info",
      headline: "That doesn't parse as a link",
      summary: "Check for stray spaces or missing parts, then paste the full address.",
      findings: [],
    };
  }

  const findings: Finding[] = [];
  let risk = 0;
  const add = (points: number, f: Finding) => {
    risk += points;
    findings.push(f);
  };

  const scheme = url.protocol.replace(":", "");
  if (scheme === "javascript" || scheme === "data" || scheme === "vbscript") {
    add(70, {
      level: "danger",
      title: `Runs code instead of opening a page (${scheme}:)`,
      detail: "Links like this execute script or embed content directly. Legitimate sites never send them.",
    });
    return {
      kind: "link",
      risk: Math.min(100, risk),
      level: "danger",
      headline: "Likely malicious",
      summary: "This isn't a web address. It's code wearing a link's clothes.",
      findings,
      facts: [{ label: "Scheme", value: `${scheme}:`, mono: true }],
    };
  }

  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  const bareHost = host.replace(/^\[|\]$/g, "");
  const ipHost = isIPv4(bareHost) || host.startsWith("[");
  const registrable = ipHost ? bareHost : registrableDomain(host);
  const labels = host.split(".");
  const tld = labels[labels.length - 1];
  const owner = ipHost ? null : ownerOf(registrable);
  const full = url.href;

  if (scheme === "http") {
    add(15, { level: "warn", title: "No encryption (http, not https)", detail: "Anything you type here can be read or changed in transit." });
  } else if (scheme === "https") {
    findings.push({ level: "safe", title: "Uses HTTPS", detail: "The connection is encrypted. That says nothing about who owns the site." });
  } else {
    add(10, { level: "warn", title: `Unusual scheme: ${scheme}:` });
  }

  if (url.username || url.password || /^[^/]*@/.test(raw.replace(/^[a-z]+:\/\//i, ""))) {
    add(35, {
      level: "danger",
      title: "Real destination hidden after an @",
      detail: `Browsers ignore everything before the @. This actually goes to ${host}.`,
    });
  }

  if (ipHost) {
    add(30, { level: "danger", title: "Points to a raw IP address", detail: "Real services use names. Phishing kits often skip buying a domain." });
  }

  if (host.split(".").some((l) => l.startsWith("xn--"))) {
    add(25, {
      level: "danger",
      title: "Uses look-alike international characters",
      detail: `The name is encoded as ${host}. Letters from other alphabets can mimic Latin ones (а vs a).`,
    });
  }

  if (SHORTENERS.has(registrable) || SHORTENERS.has(host)) {
    add(15, { level: "warn", title: "Shortened link", detail: "The real destination is hidden until you click. Expand it with a preview service first." });
  }

  if (!ipHost && RISKY_TLDS.has(tld)) {
    add(15, { level: "warn", title: `High-abuse ending (.${tld})`, detail: "Cheap domain endings like this one are heavily used for throwaway scam sites." });
  }

  if (owner) {
    findings.push({ level: "safe", title: `Official ${prettyBrand(owner)} domain`, detail: `${registrable} is owned by ${prettyBrand(owner)}.` });
  } else if (!ipHost) {
    const tokens = host.split(/[.-]/).filter(Boolean);
    const registrableLabel = registrable.split(".")[0];
    let impersonated: string | null = null;

    for (const brand of Object.keys(BRANDS)) {
      const matchesToken = tokens.some((t) =>
        brand.length <= 4 || EXACT_ONLY.has(brand) ? t === brand : t === brand || t.startsWith(brand) || t.endsWith(brand),
      );
      if (matchesToken) {
        impersonated = brand;
        add(35, {
          level: "danger",
          title: `Mentions ${prettyBrand(brand)}, but isn't theirs`,
          detail: `The address is really ${registrable}. ${prettyBrand(brand)} doesn't own it.`,
        });
        break;
      }
    }

    if (!impersonated) {
      const normalized = deHomoglyph(registrableLabel);
      for (const brand of Object.keys(BRANDS)) {
        if (brand.length < 5) continue;
        const swapped = normalized === brand && registrableLabel !== brand;
        const close = !EXACT_ONLY.has(brand) && levenshtein(registrableLabel, brand) === 1;
        if (swapped || close) {
          add(40, {
            level: "danger",
            title: `Look-alike of ${prettyBrand(brand)}`,
            detail: `“${registrableLabel}” is one character off “${brand}”. A classic typosquat.`,
          });
          break;
        }
      }
    }

    const subdomainDepth = labels.length - registrable.split(".").length;
    if (subdomainDepth >= 3) {
      add(10, { level: "warn", title: `Deep subdomain chain (${subdomainDepth} levels)`, detail: "Long chains push the real domain off-screen on phones." });
    }
    if ((registrable.match(/-/g) ?? []).length >= 2) {
      add(10, { level: "warn", title: "Hyphen-heavy domain", detail: "Names like secure-login-update are typical of disposable phishing domains." });
    }
  }

  const pathAndQuery = (url.pathname + url.search).toLowerCase();
  const hostTokens = host.split(/[.-]/);
  const lure = LURE_WORDS.find((w) => pathAndQuery.includes(w) || hostTokens.includes(w));
  if (lure && !owner) {
    add(10, { level: "warn", title: `Bait word in the address (“${lure}”)`, detail: "Pressure words in the URL are common on credential-harvesting pages." });
  }

  if (RISKY_EXTENSIONS.test(url.pathname)) {
    const ext = url.pathname.match(RISKY_EXTENSIONS)?.[1];
    add(25, { level: "danger", title: `Downloads an executable (.${ext})`, detail: "Opening this file can install software on your device." });
  }

  if (url.port && !["80", "443"].includes(url.port)) {
    add(10, { level: "warn", title: `Non-standard port :${url.port}`, detail: "Public websites rarely need a custom port." });
  }

  if (full.length > 120) {
    add(5, { level: "warn", title: `Very long address (${full.length} characters)`, detail: "Length is often used to bury the real domain." });
  }

  if ((full.match(/%[0-9a-f]{2}/gi) ?? []).length > 6) {
    add(5, { level: "warn", title: "Heavily encoded characters", detail: "Percent-encoding can disguise what the link contains." });
  }

  if (/(redirect|url|next|target|dest|continue)=https?/i.test(url.search)) {
    add(10, { level: "warn", title: "Contains a second link (open redirect)", detail: "Trusted sites can be abused to bounce you somewhere else." });
  }

  risk = Math.min(100, risk);
  if (owner) risk = Math.min(risk, 15);
  const level = levelFromRisk(risk);

  const headline = level === "danger" ? "Likely malicious" : level === "warn" ? "Be careful with this one" : "No red flags found";
  const summary =
    level === "danger"
      ? "Several signs point to phishing or malware. Don't open it, and don't sign in through it."
      : level === "warn"
        ? "Nothing conclusive, but there are signals worth a second look before you click."
        : owner
          ? `This goes to ${prettyBrand(owner)}'s real domain.`
          : "The structure looks normal. Nemesis reads the address only; it doesn't visit the page.";

  findings.sort((a, b) => rank(b.level) - rank(a.level));

  return {
    kind: "link",
    risk,
    level,
    headline,
    summary,
    findings,
    facts: [
      { label: "Real domain", value: registrable || host, mono: true },
      { label: "Host", value: host, mono: true },
      { label: "Scheme", value: scheme, mono: true },
      ...(url.pathname && url.pathname !== "/" ? [{ label: "Path", value: decodeSafe(url.pathname).slice(0, 80), mono: true }] : []),
    ],
    next: { label: "Scan this site's security headers", href: `/tools/headers?url=${encodeURIComponent(url.origin)}` },
  };
}

function decodeSafe(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export function rank(level: Finding["level"]) {
  return { danger: 3, warn: 2, info: 1, safe: 0 }[level];
}

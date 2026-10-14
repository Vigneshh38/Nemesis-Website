import { analyzeLink } from "./link";
import { type Finding, type Verdict, levelFromRisk } from "./types";

type Rule = { re: RegExp; points: number; level: Finding["level"]; title: string; detail: string };

const RULES: Rule[] = [
  {
    re: /\b(urgent(ly)?|immediately|within \d+ ?(hours?|hrs?|minutes?|mins?)|today only|last (chance|warning|reminder)|act now|expires? (today|soon|tonight)|final notice)\b/i,
    points: 15, level: "warn", title: "Creates urgency",
    detail: "Deadlines rush you past the moment where you'd normally double-check.",
  },
  {
    re: /\b(suspend(ed)?|block(ed)?|deactivat(e|ed)|disabled?|frozen|locked|terminated?|will be closed)\b/i,
    points: 15, level: "warn", title: "Threatens your account",
    detail: "Banks and apps don't announce a block through a random message with a link.",
  },
  {
    re: /\b(otp|one[- ]time password|pin|cvv|password|passcode|net ?banking|card (number|details)|upi pin|mpin)\b/i,
    points: 25, level: "danger", title: "Asks about OTP, PIN or password",
    detail: "No real bank, college or company will ever ask you to share these. Ever.",
  },
  {
    re: /\b(kyc|aadhaa?r|pan card|update your (details|account|kyc)|verify your (account|identity|details))\b/i,
    points: 20, level: "danger", title: "KYC or identity verification bait",
    detail: "Fake KYC updates are among the most common scams in India.",
  },
  {
    re: /\b(won|winner|lottery|lucky draw|jackpot|prize|cash ?back|reward points?|gift (card|voucher)|free (iphone|recharge|gift))\b/i,
    points: 20, level: "danger", title: "Promises a prize or reward",
    detail: "If you didn't enter, you didn't win. Prize scams always end in a 'processing fee'.",
  },
  {
    re: /(₹|rs\.?|inr)\s?[\d,]{3,}|\b\d{1,3}(,\d{3})+\s?(rs|rupees|inr)\b|\$\s?\d{3,}/i,
    points: 5, level: "info", title: "Mentions a sum of money",
    detail: "Money amounts are used to make the offer or threat feel concrete.",
  },
  {
    re: /\b(work from home|part[- ]time job|daily (earn|income|payout)|earn ₹?\d+|like (and|&) earn|youtube likes|telegram task|prepaid task)\b/i,
    points: 25, level: "danger", title: "Task or job scam pattern",
    detail: "Paid 'tasks' that ask you to deposit money first are a well-known fraud.",
  },
  {
    re: /\b(collect request|scan (this|the) qr|approve the request|receive money.*(pin|scan))\b/i,
    points: 25, level: "danger", title: "UPI collect or QR trick",
    detail: "You never need to scan a QR or enter a PIN to receive money. Only to send it.",
  },
  {
    re: /\b(police|cyber ?cell|arrest(ed)?|legal action|court|fir|customs|parcel (seized|held)|narcotics|digital arrest|cbi|ed officer)\b/i,
    points: 25, level: "danger", title: "Impersonates police or authorities",
    detail: "'Digital arrest' calls and seized-parcel threats are scams. Agencies don't arrest over chat.",
  },
  {
    re: /\b(dear (customer|user|sir\/madam|valued)|dear account holder)\b/i,
    points: 5, level: "warn", title: "Generic greeting",
    detail: "Services that know you use your name.",
  },
  {
    re: /\b(click (here|below|the link)|tap (here|the link)|open the link|download (the )?(app|apk))\b/i,
    points: 10, level: "warn", title: "Pushes you to click or install",
    detail: "Especially risky when combined with a deadline or an unknown sender.",
  },
  {
    re: /\b(gift ?cards?|crypto|bitcoin|usdt|western union|money ?gram|wire transfer)\b/i,
    points: 15, level: "warn", title: "Asks for hard-to-trace payment",
    detail: "Gift cards and crypto can't be reversed. That's why scammers want them.",
  },
  {
    re: /\b(don'?t (tell|share)|keep (this )?(secret|confidential)|between us)\b/i,
    points: 15, level: "warn", title: "Asks you to keep it secret",
    detail: "Isolation is a manipulation tactic. Talk to someone you trust.",
  },
];

const URL_RE = /\b((?:https?:\/\/|www\.)[^\s<>"')]+|[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|in|net|org|xyz|top|info|ly|co|me|io|app|link|site|online|click|live|shop|store|icu|cam|tk|ml|ga|cf|gq|buzz|cc|biz)(?:\/[^\s<>"')]*)?)/gi;

export function extractLinks(text: string): string[] {
  return [...new Set((text.match(URL_RE) ?? []).map((u) => u.replace(/[.,;:!?]+$/, "")))].slice(0, 5);
}

export function analyzeMessage(text: string): Verdict {
  const findings: Finding[] = [];
  let risk = 0;

  for (const rule of RULES) {
    const hit = text.match(rule.re);
    if (hit) {
      risk += rule.points;
      findings.push({ level: rule.level, title: rule.title, detail: `“${hit[0].trim()}” — ${rule.detail}` });
    }
  }

  const links = extractLinks(text);
  let worstLink: { url: string; risk: number; headline: string } | null = null;
  for (const link of links) {
    const v = analyzeLink(link);
    const r = v.risk ?? 0;
    if (!worstLink || r > worstLink.risk) worstLink = { url: link, risk: r, headline: v.headline };
  }
  if (worstLink) {
    if (worstLink.risk >= 50) {
      risk += 35;
      findings.unshift({ level: "danger", title: "Contains a dangerous link", detail: `${worstLink.url} — ${worstLink.headline.toLowerCase()}.` });
    } else if (worstLink.risk >= 20) {
      risk += 15;
      findings.unshift({ level: "warn", title: "Contains a suspicious link", detail: worstLink.url });
    } else {
      risk += 5;
      findings.push({ level: "info", title: `Contains ${links.length === 1 ? "a link" : `${links.length} links`}`, detail: links.join("  ·  ") });
    }
  }

  const letters = text.replace(/[^a-z]/gi, "");
  const caps = text.replace(/[^A-Z]/g, "").length;
  if (letters.length > 30 && caps / letters.length > 0.45) {
    risk += 5;
    findings.push({ level: "warn", title: "Shouting in capitals", detail: "Heavy caps are used to create alarm." });
  }

  risk = Math.min(100, risk);
  const level = levelFromRisk(risk);
  findings.sort((a, b) => ({ danger: 3, warn: 2, info: 1, safe: 0 })[b.level] - ({ danger: 3, warn: 2, info: 1, safe: 0 })[a.level]);

  if (!findings.length) {
    findings.push({ level: "safe", title: "No common scam patterns", detail: "Still unsure? Contact the sender through a number or app you already trust." });
  }

  return {
    kind: "message",
    risk,
    level,
    headline: level === "danger" ? "This looks like a scam" : level === "warn" ? "Some scam signals" : "No scam patterns found",
    summary:
      level === "danger"
        ? "Don't reply, click or pay. Report it, then delete it."
        : level === "warn"
          ? "Verify with the sender through a channel you already trust before acting."
          : "Nothing matched known scam scripts. Pattern checks can't confirm who sent it.",
    findings,
    facts: [
      { label: "Signals matched", value: String(findings.filter((f) => f.level !== "safe" && f.level !== "info").length) },
      { label: "Links found", value: String(links.length) },
    ],
    next: level !== "safe" ? { label: "Report this scam", href: "/report" } : undefined,
  };
}

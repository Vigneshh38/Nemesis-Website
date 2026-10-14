export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function relativeTime(date: Date | string | number, now = Date.now()) {
  const d = new Date(date).getTime();
  const diff = Math.round((d - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(diff, "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 2592000) return rtf.format(Math.round(diff / 86400), "day");
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export const REPORT_TYPE_LABEL: Record<string, string> = {
  phishing: "Phishing link or email",
  "upi-fraud": "UPI / payment fraud",
  "job-scam": "Fake job or task scam",
  "account-takeover": "Hacked account",
  malware: "Malware or suspicious app",
  harassment: "Online harassment",
  other: "Something else",
};

export const STATUS_LABEL: Record<string, string> = {
  received: "Received",
  investigating: "Investigating",
  resolved: "Resolved",
  dismissed: "Closed",
};

export type Level = "safe" | "warn" | "danger" | "info";

export type InputKind =
  | "link"
  | "password"
  | "message"
  | "jwt"
  | "hash"
  | "ip"
  | "email"
  | "base64";

export type Finding = {
  level: Level;
  title: string;
  detail?: string;
};

export type Fact = {
  label: string;
  value: string;
  mono?: boolean;
};

export type Verdict = {
  kind: InputKind;
  /** 0 (harmless) – 100 (almost certainly malicious). Omitted when risk doesn't apply. */
  risk?: number;
  level: Level;
  headline: string;
  summary: string;
  findings: Finding[];
  facts?: Fact[];
  next?: { label: string; href: string };
};

export const KIND_LABEL: Record<InputKind, string> = {
  link: "Link",
  password: "Password",
  message: "Message",
  jwt: "JWT",
  hash: "Hash",
  ip: "IP address",
  email: "Email address",
  base64: "Base64",
};

export function levelFromRisk(risk: number): Level {
  if (risk >= 50) return "danger";
  if (risk >= 20) return "warn";
  return "safe";
}

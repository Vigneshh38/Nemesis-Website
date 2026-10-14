export type ToolMeta = {
  slug: "link" | "password" | "headers" | "jwt" | "hash" | "encode";
  name: string;
  tagline: string;
  description: string;
  tone: "brand" | "safe" | "warn" | "danger" | "violet";
  runsOn: "browser" | "server";
};

export const TOOLS: ToolMeta[] = [
  {
    slug: "link",
    name: "Link Inspector",
    tagline: "Is this link what it claims to be?",
    description: "Spots look-alike domains, hidden destinations, risky downloads and brand impersonation before you click.",
    tone: "danger",
    runsOn: "browser",
  },
  {
    slug: "password",
    name: "Password Lab",
    tagline: "How long would it survive an attack?",
    description: "Finds the patterns attackers try first, estimates crack time, and checks 900M+ breached passwords privately.",
    tone: "safe",
    runsOn: "browser",
  },
  {
    slug: "headers",
    name: "Header Scanner",
    tagline: "Grade any website's defences.",
    description: "Fetches a site's HTTP response and grades HSTS, CSP, clickjacking and leak protection from A+ to F.",
    tone: "brand",
    runsOn: "server",
  },
  {
    slug: "jwt",
    name: "JWT Workbench",
    tagline: "Read what your tokens reveal.",
    description: "Decodes JSON Web Tokens, flags secrets in payloads, missing expiry and the alg:none trap.",
    tone: "violet",
    runsOn: "browser",
  },
  {
    slug: "hash",
    name: "Hash Lab",
    tagline: "Verify a download hasn't been tampered with.",
    description: "Hashes files and text with SHA-256/384/512 or SHA-1, compares checksums and identifies unknown hashes.",
    tone: "warn",
    runsOn: "browser",
  },
  {
    slug: "encode",
    name: "Encoder",
    tagline: "Base64, hex, URL, ROT13 and more.",
    description: "Encode and decode the formats attackers use to hide payloads. Chain steps like a mini CyberChef.",
    tone: "brand",
    runsOn: "browser",
  },
];

export function getTool(slug: string) {
  return TOOLS.find((t) => t.slug === slug);
}

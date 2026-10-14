/** Public challenge catalogue. Safe to ship to the browser: no flags in here. */

export type Category = "Encoding" | "Crypto" | "Web" | "Forensics";
export type Difficulty = "Warm-up" | "Easy" | "Medium" | "Hard";

export type Challenge = {
  id: string;
  title: string;
  category: Category;
  difficulty: Difficulty;
  points: number;
  brief: string;
  /** Where the puzzle lives. Either inline data (rendered server-side) or a lab page. */
  lab?: { href: string; label: string };
  hint: string;
  tool?: { href: string; label: string };
  learn: string;
};

export const FLAG_FORMAT = "NEMESIS{...}";

export const CHALLENGES: Challenge[] = [
  {
    id: "base-jump",
    title: "Base Jump",
    category: "Encoding",
    difficulty: "Warm-up",
    points: 50,
    brief: "An intercepted note. It isn't encrypted, just dressed up. Undress it.",
    hint: "Letters, digits, + and /, and maybe an = at the end. That's a well-known 64-character alphabet.",
    tool: { href: "/tools/encode", label: "Open Encoder" },
    learn: "Encoding isn't encryption. Base64 hides nothing from anyone who looks.",
  },
  {
    id: "salad-days",
    title: "Salad Days",
    category: "Crypto",
    difficulty: "Easy",
    points: 100,
    brief: "Julius left a message for the team. Only the letters moved.",
    hint: "Each letter is shifted the same distance along the alphabet. Thirteen is a popular choice.",
    tool: { href: "/tools/encode", label: "Try ROT13" },
    learn: "Substitution ciphers fall to frequency analysis in seconds. Never roll your own crypto.",
  },
  {
    id: "hex-marks",
    title: "Hex Marks the Spot",
    category: "Forensics",
    difficulty: "Easy",
    points: 100,
    brief: "A memory dump from a compromised kiosk. The ASCII column was scrubbed, but the bytes weren't.",
    hint: "Two hex characters make one byte. Paste the bytes into a hex decoder.",
    tool: { href: "/tools/encode", label: "Decode hex" },
    learn: "Investigators read raw bytes because data often survives where the UI hides it.",
  },
  {
    id: "read-the-source",
    title: "Read the Source",
    category: "Web",
    difficulty: "Easy",
    points: 150,
    brief: "The dev team swears this page has nothing interesting. Developers leave notes, though.",
    lab: { href: "/arena/lab/source", label: "Open the page" },
    hint: "Right-click → View Page Source, or press Ctrl+U. Look for comments.",
    learn: "Anything sent to the browser is public, including comments, hidden fields and JS bundles.",
  },
  {
    id: "robots-know",
    title: "Robots Know",
    category: "Web",
    difficulty: "Medium",
    points: 150,
    brief: "Some pages ask search engines not to look. That request is public too.",
    hint: "Every site can publish rules for crawlers at a well-known path at its root.",
    learn: "robots.txt is a courtesy, not access control. Attackers read it first.",
  },
  {
    id: "header-hunter",
    title: "Header Hunter",
    category: "Web",
    difficulty: "Medium",
    points: 200,
    brief: "A beacon answers every ping with a shrug. The body says nothing. The envelope says more.",
    lab: { href: "/arena/lab/beacon", label: "Ping the beacon" },
    hint: "Open DevTools → Network, ping again, and inspect the response headers.",
    learn: "HTTP headers leak versions, frameworks and sometimes secrets. Review what you send.",
  },
  {
    id: "cookie-clearance",
    title: "Cookie Clearance",
    category: "Web",
    difficulty: "Medium",
    points: 250,
    brief: "The restricted archive checks your clearance level. It trusts whatever your browser tells it.",
    lab: { href: "/arena/lab/clearance", label: "Enter the archive" },
    hint: "DevTools → Application → Cookies. What if your clearance were higher?",
    learn: "Never trust client-side state for authorization. Sign it, or keep it on the server.",
  },
  {
    id: "none-shall-pass",
    title: "None Shall Pass",
    category: "Crypto",
    difficulty: "Hard",
    points: 300,
    brief: "The admin gate checks a signed token. You're an intern. Become the admin.",
    lab: { href: "/arena/lab/gate", label: "Approach the gate" },
    hint: "Decode the token. Some servers accept tokens that claim to need no signature at all.",
    tool: { href: "/tools/jwt", label: "Open JWT Workbench" },
    learn: "The alg:none attack. Servers must pin the algorithm and reject unsigned tokens.",
  },
];

export const TOTAL_POINTS = CHALLENGES.reduce((sum, c) => sum + c.points, 0);

export function getChallenge(id: string) {
  return CHALLENGES.find((c) => c.id === id);
}

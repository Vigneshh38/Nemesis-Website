import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/** Each flag = a readable phrase + an HMAC tag only the server can compute. */
const PHRASES: Record<string, string> = {
  "base-jump": "b4s3_is_n0t_crypt0",
  "salad-days": "et_tu_rot13",
  "hex-marks": "bytes_d0nt_lie",
  "read-the-source": "c0mments_ship_t00",
  "robots-know": "robots_are_snitches",
  "header-hunter": "read_the_envelope",
  "cookie-clearance": "never_trust_the_client",
  "none-shall-pass": "alg_none_is_a_trap",
};

function secret() {
  return process.env.ARENA_SECRET || "nemesis-local-dev-secret";
}

export function flagFor(id: string): string {
  const phrase = PHRASES[id];
  if (!phrase) throw new Error(`Unknown challenge: ${id}`);
  const tag = createHmac("sha256", secret()).update(`flag:${id}`).digest("hex").slice(0, 8);
  return `NEMESIS{${phrase}_${tag}}`;
}

export function checkFlag(id: string, submitted: string): boolean {
  if (!PHRASES[id]) return false;
  const a = createHash("sha256").update(submitted.trim()).digest();
  const b = createHash("sha256").update(flagFor(id)).digest();
  return timingSafeEqual(a, b);
}

/* ───────── Puzzle material, generated from the live flag ───────── */

export function rot13(s: string) {
  return s.replace(/[a-z]/gi, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

export function baseJumpCipher() {
  return Buffer.from(`Intercepted at 02:14 IST. Payload: ${flagFor("base-jump")}`).toString("base64");
}

export function saladDaysCipher() {
  return rot13(`Meet at the old forum at noon. The drop password is ${flagFor("salad-days")}`);
}

export function hexMarksDump(): string {
  const seed = createHmac("sha256", secret()).update("hexdump").digest();
  const junk = (n: number, offset: number) =>
    Buffer.from(Array.from({ length: n }, (_, i) => (seed[(i + offset) % seed.length] ^ (i * 37)) & 0xff));
  const bytes = Buffer.concat([
    junk(21, 0),
    Buffer.from(`kiosk=K-03;session=${flagFor("hex-marks")};ttl=900`),
    junk(27, 9),
  ]);
  const lines: string[] = [];
  for (let off = 0; off < bytes.length; off += 16) {
    const row = bytes.subarray(off, off + 16);
    const hex = Array.from(row, (b) => b.toString(16).padStart(2, "0"))
      .join("")
      .replace(/(.{4})/g, "$1 ")
      .trim()
      .padEnd(39, " ");
    lines.push(`${off.toString(16).padStart(8, "0")}: ${hex}  ${".".repeat(row.length)}`);
  }
  return lines.join("\n");
}

/* ───────── JWT gate (intentionally vulnerable to alg:none) ───────── */

const b64url = (input: Buffer | string) => Buffer.from(input).toString("base64url");

function gateKey() {
  return createHmac("sha256", secret()).update("jwt-gate-key").digest();
}

export function issueInternToken(): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify({ sub: "intern-0427", name: "Arena Intern", role: "intern", iat: 1767225600 }));
  const sig = createHmac("sha256", gateKey()).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

export type GateResult =
  | { ok: true; role: string; flag?: string; message: string }
  | { ok: false; message: string };

export function checkGateToken(token: string): GateResult {
  const parts = token.trim().split(".");
  if (parts.length !== 3) return { ok: false, message: "That isn't a JWT. Expected header.payload.signature." };
  let header: { alg?: unknown };
  let payload: { role?: unknown };
  try {
    header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return { ok: false, message: "Couldn't decode the header or payload as JSON." };
  }
  const alg = String(header.alg ?? "");

  // ⚠ Deliberate vulnerability for the challenge: trusting the token's own alg claim.
  if (alg.toLowerCase() === "none") {
    // accepted without verification
  } else if (alg === "HS256") {
    const expected = createHmac("sha256", gateKey()).update(`${parts[0]}.${parts[1]}`).digest();
    const given = Buffer.from(parts[2], "base64url");
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
      return { ok: false, message: "Signature check failed. The gate knows this token was tampered with." };
    }
  } else {
    return { ok: false, message: `Unsupported algorithm “${alg || "missing"}”.` };
  }

  const role = String(payload.role ?? "none");
  if (role === "admin") {
    return { ok: true, role, flag: flagFor("none-shall-pass"), message: "Welcome, administrator." };
  }
  return { ok: true, role, message: `Access denied. Role “${role}” can't open the admin gate.` };
}

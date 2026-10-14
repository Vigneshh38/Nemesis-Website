import { z } from "zod";
import { ScanError, scanHeaders } from "@/lib/header-scan";

const Body = z.object({ url: z.string().min(3).max(2048) });

// Tiny in-memory throttle: 12 scans per minute per client IP.
const hits = new Map<string, number[]>();
function throttled(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 12;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (throttled(ip)) return Response.json({ error: "Slow down a little: 12 scans a minute is the limit." }, { status: 429 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter a website address to scan." }, { status: 400 });

  try {
    const scan = await scanHeaders(parsed.data.url);
    return Response.json(scan, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof ScanError) return Response.json({ error: err.message }, { status: 422 });
    console.error("header scan failed", err);
    return Response.json({ error: "The scan failed unexpectedly. Try again." }, { status: 500 });
  }
}

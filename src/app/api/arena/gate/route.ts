import { z } from "zod";
import { checkGateToken } from "@/lib/arena/flags";

const Body = z.object({ token: z.string().min(1).max(4000) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false, message: "Paste a token first." }, { status: 400 });
  const result = checkGateToken(parsed.data.token);
  return Response.json(result, { status: result.ok ? 200 : 401, headers: { "Cache-Control": "no-store" } });
}

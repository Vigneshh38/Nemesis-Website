import { connection } from "next/server";
import { flagFor } from "@/lib/arena/flags";

export async function GET() {
  await connection();
  return Response.json(
    { beacon: "online", message: "Ping received. Nothing in the body for you." },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Beacon-Region": "ap-south-1",
        "X-Nemesis-Flag": flagFor("header-hunter"),
      },
    },
  );
}

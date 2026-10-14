import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { baseUrl, getViewer } from "@/lib/auth";
import { connectDb, isDbConfigured } from "@/lib/db";
import { statusUpdateEmail } from "@/lib/emails";
import { REPORT_STATUSES, Report } from "@/lib/models";
import { sendMail } from "@/lib/services";

const Body = z.object({
  status: z.enum(REPORT_STATUSES),
  note: z.string().trim().max(1000).optional().default(""),
  notify: z.boolean().optional().default(true),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) return Response.json({ error: "Sign in first." }, { status: 401 });
  if (!viewer.isAdmin) return Response.json({ error: "Only admins can update cases." }, { status: 403 });
  if (!isDbConfigured()) return Response.json({ error: "Database isn't connected." }, { status: 503 });

  const { id } = await params;
  if (!isValidObjectId(id)) return Response.json({ error: "Unknown case." }, { status: 404 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Pick a valid status." }, { status: 400 });

  await connectDb();
  const report = await Report.findByIdAndUpdate(
    id,
    { $set: { status: parsed.data.status, adminNote: parsed.data.note } },
    { returnDocument: "after" },
  );
  if (!report) return Response.json({ error: "Unknown case." }, { status: 404 });

  let emailed = false;
  if (parsed.data.notify && report.reporterEmail) {
    const mail = statusUpdateEmail({
      name: report.reporterName,
      caseId: report.caseId,
      title: report.title,
      status: report.status,
      note: report.adminNote ?? "",
      baseUrl: await baseUrl(),
    });
    emailed = (await sendMail(report.reporterEmail, mail.subject, mail.html, mail.text)).sent;
  }

  return Response.json({ ok: true, status: report.status, emailed });
}

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { analyzeLink } from "@/lib/analyzers/link";
import { analyzeMessage } from "@/lib/analyzers/message";
import { baseUrl, getViewer } from "@/lib/auth";
import { connectDb, isDbConfigured } from "@/lib/db";
import { adminAlertEmail, reportReceivedEmail } from "@/lib/emails";
import { REPORT_TYPES, Report } from "@/lib/models";
import { adminEmails, isCloudinaryConfigured, sendMail, uploadEvidence } from "@/lib/services";
import { REPORT_TYPE_LABEL } from "@/lib/utils";

const MAX_FILES = 3;
const MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/heic"]);

const Fields = z.object({
  type: z.enum(REPORT_TYPES),
  title: z.string().trim().min(4, "Give the report a short title (4+ characters).").max(140),
  description: z.string().trim().min(20, "Describe what happened in at least 20 characters.").max(4000),
  suspectUrl: z.string().trim().max(2048).optional().default(""),
  amountLost: z.coerce.number().min(0).max(1e9).optional().default(0),
  occurredOn: z.coerce.date().refine((d) => d.getTime() <= Date.now() + 86_400_000, "The date can't be in the future."),
});

function newCaseId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  return "NMS-" + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer) return Response.json({ error: "Sign in to file a report." }, { status: 401 });
  if (!isDbConfigured()) return Response.json({ error: "Reports are offline: the database isn't connected yet." }, { status: 503 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "The form couldn't be read. Try again." }, { status: 400 });
  }

  const parsed = Fields.safeParse({
    type: form.get("type"),
    title: form.get("title"),
    description: form.get("description"),
    suspectUrl: form.get("suspectUrl") ?? "",
    amountLost: form.get("amountLost") || 0,
    occurredOn: form.get("occurredOn"),
  });
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Check the form and try again." }, { status: 400 });
  }
  const data = parsed.data;

  const files = form.getAll("evidence").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_FILES) return Response.json({ error: `Attach up to ${MAX_FILES} screenshots.` }, { status: 400 });
  for (const f of files) {
    if (!IMAGE_TYPES.has(f.type)) return Response.json({ error: `“${f.name}” isn't an image. Use PNG, JPG, WebP or GIF.` }, { status: 400 });
    if (f.size > MAX_BYTES) return Response.json({ error: `“${f.name}” is over 5 MB.` }, { status: 400 });
  }
  if (files.length && !isCloudinaryConfigured()) {
    return Response.json({ error: "Evidence uploads are offline right now. Submit without screenshots." }, { status: 503 });
  }

  await connectDb();
  const caseId = newCaseId();

  let evidence: { url: string; publicId: string; width: number; height: number; format: string; bytes: number }[] = [];
  try {
    const uploads = await Promise.all(files.map((f) => uploadEvidence(f, `nemesis/reports/${caseId}`)));
    evidence = uploads.map((u) => ({
      url: u.secure_url,
      publicId: u.public_id,
      width: u.width,
      height: u.height,
      format: u.format,
      bytes: u.bytes,
    }));
  } catch (err) {
    console.error("evidence upload failed", err);
    return Response.json({ error: "A screenshot failed to upload. Try a smaller image or submit without it." }, { status: 502 });
  }

  const scan = data.suspectUrl ? analyzeLink(data.suspectUrl) : analyzeMessage(`${data.title} ${data.description}`);

  const report = await Report.create({
    caseId,
    userId: viewer.id,
    reporterName: viewer.name,
    reporterEmail: viewer.email,
    type: data.type,
    title: data.title,
    description: data.description,
    suspectUrl: data.suspectUrl,
    amountLost: data.amountLost,
    occurredOn: data.occurredOn,
    evidence,
    autoScan: { risk: scan.risk ?? null, headline: scan.headline },
  });

  const origin = await baseUrl();
  const typeLabel = REPORT_TYPE_LABEL[data.type] ?? data.type;
  const confirm = reportReceivedEmail({ name: viewer.name, caseId, title: data.title, type: typeLabel, baseUrl: origin });
  const alert = adminAlertEmail({ caseId, title: data.title, type: typeLabel, reporter: viewer.email, risk: scan.risk ?? null, baseUrl: origin });

  const [confirmResult] = await Promise.all([
    viewer.email ? sendMail(viewer.email, confirm.subject, confirm.html, confirm.text) : Promise.resolve({ sent: false as const, reason: "No email on account" }),
    adminEmails().length ? sendMail(adminEmails(), alert.subject, alert.html, alert.text) : Promise.resolve({ sent: false as const, reason: "No admins" }),
  ]);

  return Response.json(
    {
      caseId: report.caseId,
      emailed: confirmResult.sent,
      scan: { risk: scan.risk ?? null, headline: scan.headline },
    },
    { status: 201 },
  );
}

import "server-only";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { Resend } from "resend";

/* ───────── Cloudinary ───────── */

let cloudinaryReady = false;
function ensureCloudinary() {
  if (cloudinaryReady) return true;
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return false;
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
  cloudinaryReady = true;
  return true;
}

export function isCloudinaryConfigured() {
  return ensureCloudinary();
}

export async function uploadEvidence(file: File, folder: string): Promise<UploadApiResponse> {
  if (!ensureCloudinary()) throw new Error("Cloudinary is not configured");
  const buffer = Buffer.from(await file.arrayBuffer());
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        // Re-encoding on upload strips EXIF/GPS metadata, so reporters don't leak their location
        transformation: [{ width: 2400, height: 2400, crop: "limit" }],
        allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "heic"],
      },
      (error, result) => {
        if (error || !result) reject(error ?? new Error("Upload failed"));
        else resolve(result);
      },
    );
    stream.end(buffer);
  });
}

/* ───────── Resend ───────── */

let resend: Resend | null = null;
function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  resend ??= new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export type MailResult = { sent: true } | { sent: false; reason: string };

export async function sendMail(to: string | string[], subject: string, html: string, text: string): Promise<MailResult> {
  const client = getResend();
  if (!client) return { sent: false, reason: "Email isn't configured" };
  try {
    const { error } = await client.emails.send({
      from: process.env.RESEND_FROM || "Nemesis <onboarding@resend.dev>",
      to,
      subject,
      html,
      text,
    });
    if (error) return { sent: false, reason: error.message };
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : "Unknown email error" };
  }
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

import "server-only";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Report } from "@/lib/models";

export type ReportRow = {
  id: string;
  caseId: string;
  type: string;
  title: string;
  description: string;
  suspectUrl: string;
  amountLost: number;
  status: string;
  adminNote: string;
  reporterName: string;
  reporterEmail: string;
  risk: number | null;
  evidence: { url: string }[];
  createdAt: string;
  updatedAt: string;
};

export async function listReports(filter: { userId?: string }, limit = 100): Promise<ReportRow[] | null> {
  if (!isDbConfigured()) return null;
  try {
    await connectDb();
    const docs = await Report.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    return docs.map((d) => ({
      id: String(d._id),
      caseId: d.caseId,
      type: d.type,
      title: d.title,
      description: d.description,
      suspectUrl: d.suspectUrl ?? "",
      amountLost: d.amountLost ?? 0,
      status: d.status,
      adminNote: d.adminNote ?? "",
      reporterName: d.reporterName,
      reporterEmail: d.reporterEmail,
      risk: d.autoScan?.risk ?? null,
      evidence: (d.evidence ?? []).map((e) => ({ url: e.url })),
      createdAt: new Date(d.createdAt).toISOString(),
      updatedAt: new Date(d.updatedAt).toISOString(),
    }));
  } catch (err) {
    console.error("listReports failed", err);
    return null;
  }
}

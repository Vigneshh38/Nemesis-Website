import type { Metadata } from "next";
import { connection } from "next/server";
import { LabFrame } from "@/components/arena/lab-frame";
import { flagFor } from "@/lib/arena/flags";

export const metadata: Metadata = { title: "Lab · Read the Source", robots: { index: false } };

export default async function SourceLab() {
  await connection();
  return (
    <LabFrame code="lab://dev-portal/status" title="Dev portal status">
      <p>All systems operational. Nothing to see here.</p>
      <p className="text-sm text-ink-3">Last deploy: Friday 6:42 PM. Deployed by: intern.</p>
      <div hidden dangerouslySetInnerHTML={{ __html: `<!-- TODO(intern): remove before launch. staging flag: ${flagFor("read-the-source")} -->` }} />
    </LabFrame>
  );
}

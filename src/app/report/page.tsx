import type { Metadata } from "next";
import { SideNote } from "@/components/tool-shell";
import { ReportForm } from "@/components/report/report-form";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Report a scam", description: "Report phishing, UPI fraud, fake jobs and hacked accounts." };

export default function ReportPage() {
  return (
    <>
      <PageHeader eyebrow="Report" title="Report a scam." lede="Tell us what happened. You'll get a case ID, an email confirmation, and updates as it's reviewed." />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_320px]">
        <ReportForm />
        <aside className="space-y-4">
          <SideNote title="Lost money? Act now" tone="brand">
            <p>Call <strong>1930</strong> (national cybercrime helpline) or file at cybercrime.gov.in within hours. Banks can freeze funds only if reported fast.</p>
          </SideNote>
          <SideNote title="Then secure yourself">
            <p>Change the password of any account you entered details into, sign out other sessions, and turn on 2-step verification.</p>
          </SideNote>
          <SideNote title="Privacy">
            <p>Only you and the review team can see your report.</p>
          </SideNote>
        </aside>
      </div>
    </>
  );
}

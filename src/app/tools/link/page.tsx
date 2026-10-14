import type { Metadata } from "next";
import { SideNote, ToolShell } from "@/components/tool-shell";
import { LinkInspector } from "@/components/tools/link-inspector";

export const metadata: Metadata = { title: "Link Inspector", description: "Check whether a link is phishing before you click." };

export default function Page() {
  return (
    <ToolShell slug="link" aside={
        <>
          <SideNote title="What it checks" tone="brand"><p>Look-alike and typo domains, brand names in subdomains, raw IPs, @ tricks, shorteners, risky endings, executable downloads and open redirects.</p></SideNote>
          <SideNote title="What it can't do"><p>It reads the address only and never visits it. A clean result means no structural red flags, not a guarantee.</p></SideNote>
        </>
      }>
      <LinkInspector />
    </ToolShell>
  );
}

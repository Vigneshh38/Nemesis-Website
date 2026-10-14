import type { Metadata } from "next";
import { Suspense } from "react";
import { SideNote, ToolShell } from "@/components/tool-shell";
import { HeaderScanner } from "@/components/tools/header-scanner";

export const metadata: Metadata = { title: "Header Scanner", description: "Grade a website's HTTP security headers." };

export default function Page() {
  return (
    <ToolShell slug="headers" aside={
        <>
          <SideNote title="How grading works" tone="brand"><p>HTTPS, HSTS, CSP, clickjacking, MIME sniffing, referrer, permissions and COOP add up to 100. Each software-version leak costs 5.</p></SideNote>
          <SideNote title="Safe to use"><p>Nemesis fetches only the response headers and refuses private or internal addresses.</p></SideNote>
        </>
      }>
      <Suspense>
        <HeaderScanner />
      </Suspense>
    </ToolShell>
  );
}

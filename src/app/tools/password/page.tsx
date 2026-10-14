import type { Metadata } from "next";
import { SideNote, ToolShell } from "@/components/tool-shell";
import { PasswordLab } from "@/components/tools/password-lab";

export const metadata: Metadata = { title: "Password Lab", description: "Estimate password strength and check breaches privately." };

export default function Page() {
  return (
    <ToolShell slug="password" aside={
        <>
          <SideNote title="Private by design" tone="brand"><p>Analysis runs in your browser. The breach check uses k-anonymity: only the first 5 characters of a SHA-1 hash are sent to Have I Been Pwned.</p></SideNote>
          <SideNote title="The 2026 advice"><p>Length beats symbols. Use a passphrase of 4–6 random words, a password manager, and passkeys wherever offered.</p></SideNote>
        </>
      }>
      <PasswordLab />
    </ToolShell>
  );
}

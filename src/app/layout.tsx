import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Google_Sans_Code, Google_Sans_Flex } from "next/font/google";
import { MotionProvider } from "@/components/motion-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { THEME_SCRIPT } from "@/components/theme-toggle";
import "./globals.css";

const sans = Google_Sans_Flex({
  variable: "--font-google-sans",
  subsets: ["latin"],
  axes: ["ROND", "wdth", "opsz"],
  display: "swap",
});

const code = Google_Sans_Code({
  variable: "--font-google-code",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Nemesis — Check anything before you trust it",
    template: "%s · Nemesis",
  },
  description:
    "Nemesis is a cybersecurity toolkit and training ground for students: inspect links, passwords, scam messages and tokens, play a capture-the-flag arena, and report scams.",
  applicationName: "Nemesis",
  keywords: ["cybersecurity", "phishing checker", "password strength", "CTF", "scam report", "JWT decoder", "security headers"],
  openGraph: {
    title: "Nemesis — Check anything before you trust it",
    description: "Inspect links, passwords and scam messages. Train in the CTF arena. Report what slips through.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0e17" },
  ],
};

const clerkAppearance = {
  variables: {
    colorPrimary: "var(--brand)",
    colorPrimaryForeground: "var(--brand-ink)",
    colorDanger: "var(--danger)",
    colorSuccess: "var(--safe)",
    colorBackground: "var(--raised)",
    colorForeground: "var(--ink)",
    colorMutedForeground: "var(--ink-2)",
    colorNeutral: "var(--ink)",
    colorInput: "var(--surface)",
    colorInputForeground: "var(--ink)",
    colorBorder: "var(--line-strong)",
    borderRadius: "14px",
    fontFamily: "var(--font-google-sans), system-ui, sans-serif",
  },
  elements: {
    card: { boxShadow: "var(--shadow-3)" },
    formButtonPrimary: { borderRadius: "999px", fontWeight: 600, textTransform: "none" as const },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning className={`${sans.variable} ${code.variable} antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <ClerkProvider appearance={clerkAppearance}>
          <MotionProvider>
            <a
              href="#main"
              className="sr-only z-[60] rounded-full bg-brand px-4 py-2 text-brand-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
            >
              Skip to content
            </a>
            <SiteHeader />
            <main id="main" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </MotionProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

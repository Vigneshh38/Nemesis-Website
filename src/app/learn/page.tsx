import type { Metadata } from "next";
import { PhishQuiz } from "@/components/learn/phish-quiz";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Phish or Legit?", description: "Eight real-world emails and texts. Can you spot the scams?" };

export default function LearnPage() {
  return (
    <>
      <PageHeader eyebrow="Game" title="Phish or Legit?" lede="Eight messages modelled on real campaigns hitting students in India. Make the call, then see the tells." />
      <section className="mx-auto max-w-2xl px-4 sm:px-6">
        <PhishQuiz />
      </section>
    </>
  );
}

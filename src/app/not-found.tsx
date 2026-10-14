import { NemesisMark } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-28 text-center">
      <NemesisMark size={64} scanning />
      <p className="eyebrow mt-8 text-brand">404</p>
      <h1 className="display mt-3 text-5xl font-medium text-ink">Nothing at this address.</h1>
      <p className="mt-4 text-lg text-ink-2">The link may be mistyped, or the page moved. Suspicious? Inspect it before trying again.</p>
      <ButtonLink href="/" className="mt-8">Back to Nemesis</ButtonLink>
    </div>
  );
}

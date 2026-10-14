"use client";

import { Radio } from "lucide-react";
import { useState } from "react";
import { LabFrame } from "@/components/arena/lab-frame";

export default function BeaconLab() {
  const [body, setBody] = useState<string | null>(null);
  return (
    <LabFrame code="lab://beacon/ap-south-1" title="Beacon">
      <p>The beacon answers every ping. Open your browser&apos;s DevTools before you press the button.</p>
      <button
        type="button"
        onClick={async () => {
          const res = await fetch("/api/arena/beacon", { cache: "no-store" });
          setBody(JSON.stringify(await res.json(), null, 2));
        }}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-6 font-semibold text-brand-ink hover:bg-brand-hover"
      >
        <Radio className="size-4" /> Ping beacon
      </button>
      {body && <pre className="rounded-2xl bg-ink p-4 font-mono text-sm text-bg">{body}</pre>}
    </LabFrame>
  );
}

"use client";

import { Check, Copy, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FindingRow } from "@/components/lens/verdict-card";
import { inputClass } from "@/components/ui";
import { analyzeJwt, base64UrlEncode, decodeJwt, forgeUnsigned } from "@/lib/analyzers/jwt";
import { cn } from "@/lib/utils";

function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" onClick={async () => { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); }} className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-raised px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface">
      {ok ? <Check className="size-3.5 text-safe" /> : <Copy className="size-3.5" />} {ok ? "Copied" : "Copy"}
    </button>
  );
}

async function hmacVerify(token: string, secret: string) {
  const [h, p, s] = token.split(".");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${h}.${p}`)));
  let bin = "";
  sig.forEach((b) => (bin += String.fromCharCode(b)));
  const expected = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return expected === s;
}

export function JwtWorkbench() {
  const [token, setToken] = useState("");
  const [payloadText, setPayloadText] = useState("");
  const [secret, setSecret] = useState("");
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const fromHash = decodeURIComponent(window.location.hash.slice(1));
    if (fromHash) setToken(fromHash);
  }, []);

  const decoded = useMemo(() => decodeJwt(token), [token]);
  const verdict = useMemo(() => (token.trim() ? analyzeJwt(token) : null), [token]);

  useEffect(() => {
    if (decoded) setPayloadText(JSON.stringify(decoded.payload, null, 2));
    setVerified(null);
  }, [decoded]);

  const forged = useMemo(() => {
    try {
      return forgeUnsigned(JSON.parse(payloadText), decoded?.header ?? {});
    } catch {
      return null;
    }
  }, [payloadText, decoded]);

  const parts = token.trim().split(".");
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="jwt" className="text-sm font-semibold text-ink">Encoded token</label>
          <textarea id="jwt" value={token} onChange={(e) => setToken(e.target.value.trim())} rows={8} spellCheck={false} placeholder="eyJhbGciOi…" className={cn(inputClass, "font-mono text-sm break-all")} />
          {parts.length === 3 && (
            <p className="rounded-2xl bg-surface p-4 font-mono text-xs leading-relaxed break-all">
              <span className="text-danger">{parts[0]}</span>.<span className="text-violet">{parts[1]}</span>.<span className="text-brand">{parts[2] || "(no signature)"}</span>
            </p>
          )}
        </div>
        <div className="space-y-4">
          {decoded ? (
            <>
              <div>
                <p className="eyebrow text-danger">Header</p>
                <pre className="mt-2 overflow-auto rounded-2xl border border-line bg-raised p-4 font-mono text-sm text-ink">{JSON.stringify(decoded.header, null, 2)}</pre>
              </div>
              <div>
                <p className="eyebrow text-violet">Payload</p>
                <pre className="mt-2 overflow-auto rounded-2xl border border-line bg-raised p-4 font-mono text-sm text-ink">{JSON.stringify(decoded.payload, null, 2)}</pre>
              </div>
            </>
          ) : (
            <div className="grid h-full min-h-48 place-items-center rounded-[28px] border border-dashed border-line-strong p-8 text-center text-sm text-ink-3">
              {token ? "That doesn't decode as a JWT." : "Paste a token to decode it. Nothing leaves your browser."}
            </div>
          )}
        </div>
      </div>

      {verdict && decoded && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] border border-line bg-raised p-6">
            <h2 className="font-semibold text-ink">{verdict.headline}</h2>
            <ul className="mt-1 divide-y divide-line">
              {verdict.findings.map((f, i) => <FindingRow key={f.title} f={f} index={i} />)}
            </ul>
          </div>
          <div className="space-y-6">
            {/^HS256$/i.test(String(decoded.header.alg)) && (
              <div className="rounded-[28px] border border-line bg-raised p-6">
                <h2 className="flex items-center gap-2 font-semibold text-ink"><ShieldCheck className="size-5 text-brand" /> Verify HS256 signature</h2>
                <div className="mt-3 flex gap-2">
                  <input value={secret} onChange={(e) => { setSecret(e.target.value); setVerified(null); }} placeholder="Shared secret" className={cn(inputClass, "py-2 font-mono text-sm")} />
                  <button type="button" disabled={!secret} onClick={async () => setVerified(await hmacVerify(token, secret))} className="rounded-full bg-brand px-5 text-sm font-semibold text-brand-ink disabled:opacity-50">Verify</button>
                </div>
                {verified !== null && (
                  <p className={cn("mt-3 text-sm font-semibold", verified ? "text-safe" : "text-danger")}>{verified ? "Signature valid for this secret." : "Signature does not match this secret."}</p>
                )}
              </div>
            )}
            <div className="rounded-[28px] border border-line bg-surface p-6">
              <h2 className="font-semibold text-ink">Tamper lab: the alg:none attack</h2>
              <p className="mt-1 text-sm text-ink-2">Edit the payload. Nemesis re-encodes it with <code className="font-mono">alg: &quot;none&quot;</code> and no signature. A vulnerable server would accept it.</p>
              <textarea value={payloadText} onChange={(e) => setPayloadText(e.target.value)} rows={6} spellCheck={false} className={cn(inputClass, "mt-3 font-mono text-sm")} aria-label="Payload JSON" />
              {forged ? (
                <div className="mt-3 space-y-2">
                  <p className="rounded-2xl bg-raised p-3 font-mono text-xs break-all text-ink">{forged}</p>
                  <CopyButton text={forged} />
                </div>
              ) : (
                <p className="mt-2 text-sm text-danger">Payload isn&apos;t valid JSON.</p>
              )}
            </div>
          </div>
        </div>
      )}
      {!token && (
        <button type="button" onClick={() => setToken(`${base64UrlEncode('{"alg":"HS256","typ":"JWT"}')}.${base64UrlEncode('{"sub":"21CS042","role":"student","iat":1760400000}')}.c2lnbmF0dXJl`)} className="text-sm font-semibold text-brand">
          Load a sample token
        </button>
      )}
    </div>
  );
}

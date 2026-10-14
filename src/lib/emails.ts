import "server-only";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

function shell(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4f6fb;font-family:'Google Sans',Roboto,Arial,sans-serif;color:#0f1729">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #dfe5ef;border-radius:20px;overflow:hidden">
<tr><td style="padding:28px 32px 8px">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="width:28px;height:28px;background:linear-gradient(135deg,#2d5bff,#7b5cff);border-radius:8px;color:#fff;font-weight:700;font-size:15px;text-align:center;vertical-align:middle">N</td>
    <td style="padding-left:10px;font-size:17px;font-weight:600;letter-spacing:-0.01em">Nemesis</td>
  </tr></table>
</td></tr>
<tr><td style="padding:12px 32px 4px"><h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:600">${esc(title)}</h1></td></tr>
<tr><td style="padding:8px 32px 28px;font-size:15px;line-height:1.6;color:#4a546b">${body}</td></tr>
<tr><td style="padding:16px 32px;background:#f4f6fb;font-size:12px;color:#7a8499">You're receiving this because of activity on your Nemesis account. Nemesis will never ask for your password or OTP.</td></tr>
</table></td></tr></table></body></html>`;
}

const STATUS_COPY: Record<string, string> = {
  received: "Received. We'll review it shortly.",
  investigating: "Investigating. A reviewer is looking into it.",
  resolved: "Resolved. Thanks for helping keep campus safe.",
  dismissed: "Closed. After review, no further action is needed.",
};

export function reportReceivedEmail(p: { name: string; caseId: string; title: string; type: string; baseUrl: string }) {
  const html = shell(
    `We've logged case ${p.caseId}`,
    `<p style="margin:0 0 12px">Hi ${esc(p.name)}, thanks for reporting <strong style="color:#0f1729">“${esc(p.title)}”</strong>.</p>
     <p style="margin:0 0 12px">Category: ${esc(p.type)}<br/>Status: Received</p>
     <p style="margin:0 0 20px">If money was involved, also call the national cybercrime helpline <strong style="color:#0f1729">1930</strong> or file at cybercrime.gov.in. Speed matters for freezing funds.</p>
     <a href="${esc(p.baseUrl)}/dashboard" style="display:inline-block;background:#2d5bff;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">Track your case</a>`,
  );
  const text = `We've logged case ${p.caseId}: "${p.title}" (${p.type}). Status: Received. If money was involved, call 1930 or visit cybercrime.gov.in. Track it at ${p.baseUrl}/dashboard`;
  return { subject: `Case ${p.caseId} received — Nemesis`, html, text };
}

export function adminAlertEmail(p: { caseId: string; title: string; type: string; reporter: string; risk: number | null; baseUrl: string }) {
  const html = shell(
    `New report: ${p.caseId}`,
    `<p style="margin:0 0 12px"><strong style="color:#0f1729">${esc(p.title)}</strong><br/>${esc(p.type)} · from ${esc(p.reporter)}${
      p.risk !== null ? ` · auto-scan risk ${p.risk}/100` : ""
    }</p>
     <a href="${esc(p.baseUrl)}/admin" style="display:inline-block;background:#2d5bff;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">Open triage</a>`,
  );
  return { subject: `[Nemesis] New ${p.type} report ${p.caseId}`, html, text: `New report ${p.caseId}: ${p.title} (${p.type}) from ${p.reporter}. ${p.baseUrl}/admin` };
}

const STATUS_TITLE: Record<string, string> = { received: "Received", investigating: "Investigating", resolved: "Resolved", dismissed: "Closed" };

export function statusUpdateEmail(p: { name: string; caseId: string; title: string; status: string; note: string; baseUrl: string }) {
  const label = STATUS_TITLE[p.status] ?? p.status;
  const html = shell(
    `Case ${p.caseId}: ${label}`,
    `<p style="margin:0 0 12px">Hi ${esc(p.name)}, there's an update on <strong style="color:#0f1729">“${esc(p.title)}”</strong>.</p>
     <p style="margin:0 0 12px">${esc(STATUS_COPY[p.status] ?? p.status)}</p>
     ${p.note ? `<p style="margin:0 0 20px;padding:12px 16px;background:#f4f6fb;border-radius:12px">${esc(p.note)}</p>` : ""}
     <a href="${esc(p.baseUrl)}/dashboard" style="display:inline-block;background:#2d5bff;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">View case</a>`,
  );
  return {
    subject: `Case ${p.caseId} is now ${label.toLowerCase()} — Nemesis`,
    html,
    text: `Case ${p.caseId} ("${p.title}") is now ${label.toLowerCase()}. ${p.note} ${p.baseUrl}/dashboard`,
  };
}

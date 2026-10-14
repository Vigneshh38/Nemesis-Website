import { analyzeLink } from "../../src/lib/analyzers/link";
import type { Verdict } from "../../src/lib/analyzers/types";

const SKIP = /^(chrome|chrome-extension|edge|about|devtools|view-source|file|brave|data|blob):/i;
const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\//i;

const BADGE: Record<string, { text: string; color: string }> = {
  danger: { text: "!", color: "#D92D3A" },
  warn: { text: "?", color: "#E8A100" },
  safe: { text: "✓", color: "#10935A" },
};

type Stored = { url: string; verdict: Verdict };

async function checkTab(tabId: number, url: string) {
  if (SKIP.test(url) || LOCAL.test(url)) {
    await chrome.action.setBadgeText({ tabId, text: "" });
    await chrome.storage.session.remove(`tab:${tabId}`);
    return;
  }
  const verdict = analyzeLink(url);
  const badge = BADGE[verdict.level] ?? BADGE.safe;
  await chrome.action.setBadgeText({ tabId, text: badge.text });
  await chrome.action.setBadgeBackgroundColor({ tabId, color: badge.color });
  await chrome.action.setBadgeTextColor?.({ tabId, color: "#FFFFFF" });
  await chrome.storage.session.set({ [`tab:${tabId}`]: { url, verdict } satisfies Stored });

  if (verdict.level === "danger") {
    const host = new URL(url).hostname;
    const { allowed = [] } = (await chrome.storage.local.get("allowed")) as { allowed?: string[] };
    if (allowed.includes(host)) return;
    await inject(tabId, {
      mode: "banner",
      title: "This page looks like phishing",
      body: verdict.findings.filter((f) => f.level === "danger").slice(0, 3).map((f) => f.title),
      host,
      risk: verdict.risk ?? 0,
    });
  }
}

type Notice = { mode: "banner" | "toast"; title: string; body: string[]; host: string; risk: number; level?: string };

async function inject(tabId: number, notice: Notice) {
  try {
    await chrome.scripting.executeScript({ target: { tabId }, func: showNotice, args: [notice] });
  } catch {
    // Pages like the Chrome Web Store can't be scripted. The badge still warns.
  }
}

/** Runs inside the page. Must be self-contained: it's serialised by chrome.scripting. */
function showNotice(n: Notice) {
  const ID = "nemesis-guard-notice";
  document.getElementById(ID)?.remove();
  const host = document.createElement("div");
  host.id = ID;
  host.style.cssText = "all:initial;position:fixed;z-index:2147483647;" + (n.mode === "banner" ? "top:16px;left:50%;transform:translateX(-50%);width:min(560px,calc(100vw - 32px));" : "bottom:20px;right:20px;width:min(380px,calc(100vw - 40px));");
  const root = host.attachShadow({ mode: "closed" });
  const tone = n.mode === "banner" || n.level === "danger" ? "#D92D3A" : n.level === "warn" ? "#B97800" : "#10935A";
  const style = document.createElement("style");
  style.textContent = `
    .card{font:14px/1.45 "Google Sans",Roboto,system-ui,sans-serif;background:#fff;color:#0f1729;border-radius:20px;box-shadow:0 12px 40px rgba(15,23,41,.28);border-top:5px solid ${tone};padding:16px 18px;animation:in .45s cubic-bezier(.16,1,.3,1)}
    @keyframes in{from{opacity:0;transform:translateY(${n.mode === "banner" ? "-12px" : "12px"})}to{opacity:1;transform:none}}
    .row{display:flex;gap:12px;align-items:flex-start}
    .score{flex:none;width:44px;height:44px;border-radius:14px;background:${tone};color:#fff;display:grid;place-items:center;font-weight:700;font-size:16px}
    h2{margin:0;font-size:16px;font-weight:700;color:${tone}}
    .host{margin-top:2px;font:12px ui-monospace,monospace;color:#4a546b;word-break:break-all}
    ul{margin:10px 0 0;padding-left:18px;color:#4a546b}
    .btns{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}
    button{font:600 13px system-ui,sans-serif;border:0;border-radius:999px;padding:8px 14px;cursor:pointer}
    .primary{background:#2d5bff;color:#fff}.ghost{background:#eef1f7;color:#0f1729}
    .brand{margin-top:10px;font-size:11px;color:#7a8499}`;
  const card = document.createElement("div");
  card.className = "card";
  const row = document.createElement("div");
  row.className = "row";
  const score = document.createElement("div");
  score.className = "score";
  score.textContent = String(n.risk);
  const text = document.createElement("div");
  const h2 = document.createElement("h2");
  h2.textContent = n.title;
  const hostLine = document.createElement("div");
  hostLine.className = "host";
  hostLine.textContent = n.host;
  text.append(h2, hostLine);
  if (n.body.length) {
    const ul = document.createElement("ul");
    for (const b of n.body) {
      const li = document.createElement("li");
      li.textContent = b;
      ul.append(li);
    }
    text.append(ul);
  }
  row.append(score, text);
  const btns = document.createElement("div");
  btns.className = "btns";
  const close = () => host.remove();
  if (n.mode === "banner") {
    const back = document.createElement("button");
    back.className = "primary";
    back.textContent = "Get me out of here";
    back.onclick = () => (history.length > 1 ? history.back() : (location.href = "about:blank"));
    const stay = document.createElement("button");
    stay.className = "ghost";
    stay.textContent = "I trust this site";
    stay.onclick = () => {
      chrome.runtime.sendMessage({ type: "allow-host", host: n.host });
      close();
    };
    btns.append(stay, back);
  } else {
    const ok = document.createElement("button");
    ok.className = "ghost";
    ok.textContent = "Close";
    ok.onclick = close;
    btns.append(ok);
    setTimeout(close, 12000);
  }
  const brand = document.createElement("div");
  brand.className = "brand";
  brand.textContent = "Nemesis Guard · checked on your device";
  card.append(row, btns, brand);
  root.append(style, card);
  document.documentElement.append(host);
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: "nemesis-check-link", title: "Check this link with Nemesis", contexts: ["link"] });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "nemesis-check-link" || !info.linkUrl || !tab?.id) return;
  const v = analyzeLink(info.linkUrl);
  let host = info.linkUrl;
  try {
    host = new URL(info.linkUrl).hostname;
  } catch {}
  await inject(tab.id, {
    mode: "toast",
    level: v.level,
    title: v.headline,
    body: v.findings.filter((f) => f.level === "danger" || f.level === "warn").slice(0, 3).map((f) => f.title),
    host,
    risk: v.risk ?? 0,
  });
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "allow-host" && typeof msg.host === "string") {
    chrome.storage.local.get("allowed").then(({ allowed = [] }) => {
      const list = allowed as string[];
      if (!list.includes(msg.host)) chrome.storage.local.set({ allowed: [...list, msg.host] });
    });
  }
});

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status === "complete" && tab.url) checkTab(tabId, tab.url);
});

chrome.tabs.onRemoved.addListener((tabId) => chrome.storage.session.remove(`tab:${tabId}`));

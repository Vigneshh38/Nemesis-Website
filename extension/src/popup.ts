import { analyze, KIND_LABEL, type Verdict } from "../../src/lib/analyzers";
import { SITE_URL } from "./config";

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

function h(tag: string, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderVerdict(v: Verdict, max = 4) {
  const wrap = h("div");
  const top = h("div", "verdict");
  const score = h("div", `score ${v.level}`, typeof v.risk === "number" ? String(v.risk) : "i");
  const text = h("div");
  text.append(h("p", `headline ${v.level}`, v.headline), h("p", "sub", v.summary));
  top.append(score, text);
  wrap.append(top);
  const list = h("ul", "findings");
  for (const f of v.findings.slice(0, max)) {
    const li = h("li");
    li.append(h("span", `dot ${f.level}`), h("span", undefined, f.title));
    list.append(li);
  }
  if (v.findings.length) wrap.append(list);
  return wrap;
}

async function showCurrentPage() {
  const body = el<HTMLDivElement>("page-body");
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url || !/^https?:/i.test(tab.url)) {
    body.textContent = "Open a website to check it. Browser pages aren't scanned.";
    return;
  }
  const key = `tab:${tab.id}`;
  const stored = (await chrome.storage.session.get(key))[key] as { verdict: Verdict } | undefined;
  const verdict = stored?.verdict ?? analyze(tab.url, "link");
  body.className = "";
  body.replaceChildren(verdict ? renderVerdict(verdict, 3) : document.createTextNode("Nothing to check here."));
}

function setupLens() {
  const input = el<HTMLTextAreaElement>("lens");
  const out = el<HTMLDivElement>("lens-result");
  let t: ReturnType<typeof setTimeout> | undefined;
  input.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const v = input.value.trim() ? analyze(input.value) : null;
      out.replaceChildren();
      if (!v) return;
      const node = renderVerdict(v);
      node.prepend(h("span", "kind", KIND_LABEL[v.kind]));
      (node.firstChild as HTMLElement).style.marginBottom = "10px";
      out.append(node);
    }, 250);
  });
  input.focus();
}

el<HTMLAnchorElement>("site").href = SITE_URL;
showCurrentPage();
setupLens();

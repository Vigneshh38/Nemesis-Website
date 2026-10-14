# Nemesis — Check anything before you trust it

A cybersecurity toolkit and training ground for students.

- **Lens** — one box that auto-detects what you paste (link, SMS/email text, password, JWT, hash, IP, email address, Base64) and returns a plain-language verdict with a risk score. Runs entirely in the browser.
- **Tools** — Link Inspector (URL anatomy + phishing heuristics), Password Lab (crack-time estimates, private breach check via HIBP k-anonymity, passphrase generator), Header Scanner (A+–F grading, SSRF-safe), JWT Workbench (decode, HS256 verify, alg:none tamper lab), Hash Lab (file/text SHA hashes, checksum compare, hash identification), Encoder (chainable Base64/hex/URL/ROT13/binary).
- **Arena** — 8 capture-the-flag challenges with a live leaderboard. Flags are derived from `ARENA_SECRET` with HMAC, so they can't be read from this repo.
- **Phish or Legit?** — 8-round quiz built on real scam patterns.
- **Report** — incident reports with screenshot evidence (Cloudinary, metadata stripped), email confirmations (Resend), case tracking on the dashboard and an admin triage view.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Motion · Clerk · MongoDB/Mongoose · Cloudinary · Resend · Google Sans Flex.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in the keys
npm run dev
```

## Deploy (Vercel)

Import the repo, add every variable from `.env.example` in Project Settings → Environment Variables, deploy. In MongoDB Atlas → Network Access, allow `0.0.0.0/0` (Vercel uses dynamic IPs).

## Chrome extension — Nemesis Guard

Lives in `extension/`. It reuses the website's analyzers and runs locally.

- A badge on every tab: green ✓, amber ?, or red ! for the page you're on.
- A warning banner on pages that look like phishing, with "Get me out of here".
- Right-click any link → **Check this link with Nemesis**.
- A popup with the Lens: paste a link, SMS, password, token or hash.

Install: download `/nemesis-guard.zip` from the site (or use the `extension/` folder), unzip, open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and pick the folder.

Rebuild after changing analyzers: `npm run build:extension`. Set the site address in `extension/src/config.ts` after deploying.

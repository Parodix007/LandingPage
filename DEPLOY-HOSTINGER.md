# Deploy to Hostinger — calm_soft (calmsoft.pro)

Two separately-deployed apps, both built for **Node 22** and Hostinger's serving model:

| App | What | Where | Runs |
|---|---|---|---|
| **Frontend** `calm_soft_web` | Next.js 16 **static export** | `public_html/` of **calmsoft.pro** (apex + www) | Apache/LiteSpeed serves files — no Node on host |
| **Backend** `calm_soft_api` | Fastify (stack unchanged) | **Node.js Web App** on subdomain **api.calmsoft.pro** (same account, same IP `46.202.142.128`) | Node 22 + Passenger/LiteSpeed |

They are joined by CORS (`CORS_ORIGINS` on the API = the front's origins) and the front's CSP
`connect-src` (= `https://api.calmsoft.pro`). Both must stay in exact agreement.

**Confirmed topology (subdomain):** frontend static on `calmsoft.pro`, API on the `api.calmsoft.pro`
subdomain of the **same** account/IP. **No code change to either app** — the tech stack stays Next.js static +
Fastify. The API already registers CORS for `calmsoft.pro` + `www`, and the frontend build already targets
`https://api.calmsoft.pro`, so **the bundles below are correct as-is — nothing needs rebuilding.**

**Ready-to-upload bundles** (already built and verified — in `_deploy/`):
- `_deploy/calm_soft_web_out.zip` — the static site (42 entries incl. `.htaccess`).
- `_deploy/calm_soft_api_deploy.zip` — `dist/` + `package.json` + `package-lock.json`.

---

## 1) Frontend — static site → `public_html`

Baked into this build (build-time env, inlined — changing any of these requires a rebuild):
`NEXT_PUBLIC_API_BASE_URL=https://api.calmsoft.pro`, `NEXT_PUBLIC_SITE_URL=https://calmsoft.pro`,
`NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAADyHDjAP-riXdsY9`, `NEXT_PUBLIC_CONTACT_EMAIL=team@calmsoft.pro`.

Steps:
1. In hPanel, make sure **calmsoft.pro** points at this hosting and `www` resolves to the same site.
2. Extract **`calm_soft_web_out.zip`** and upload **its contents** into `public_html/` at the **domain root**
   (no subfolder — there is no `basePath`). Include the dotfile **`.htaccess`** (some FTP clients hide it;
   File Manager → "Show hidden files").
3. The `.htaccess` supplies CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, and an http→https 301.
   Confirm Hostinger honors `.htaccess` (Apache/LiteSpeed do) and that HTTPS/SSL is active for the domain.
4. Smoke: open `https://calmsoft.pro` → page loads; `http://…` redirects to `https://…`; check response headers
   include the CSP; the contact form renders the Turnstile widget.

To rebuild later (e.g. env or copy change), on a Node 22 machine in `calm_soft_web/`:
```
$env:NEXT_PUBLIC_API_BASE_URL="https://api.calmsoft.pro"
$env:NEXT_PUBLIC_SITE_URL="https://calmsoft.pro"
$env:NEXT_PUBLIC_TURNSTILE_SITE_KEY="0x4AAAAAADyHDjAP-riXdsY9"
npm ci ; npm run build      # prebuild env-guard → next build → postbuild writes out/.htaccess
```
Then re-zip and re-upload `out/`. Never weaken `scripts/assert-env.mjs` or add `.env*` files to force a build.

---

## 2) Backend — hPanel Node.js app → `api.calmsoft.pro`

**Build model:** `dist/` is built locally (in the bundle), so the host needs **no TypeScript toolchain** — it
only installs the pure-JS runtime deps and starts `dist/server.js`.

Steps (hPanel — you confirmed your plan has **Subdomains** + **Node.js Web App**):
1. **Create the subdomain:** hPanel → **Domains → Subdomains** → create **`api`** under `calmsoft.pro` →
   `api.calmsoft.pro`. With your full DNS access, make sure it resolves to the hosting IP **`46.202.142.128`**
   (for a subdomain on the same account hPanel normally adds the record automatically).
2. **Create the Node.js Web App** attached to **`api.calmsoft.pro`** (hPanel → **Websites → Add Website →
   Node.js Web App**; Fastify is officially supported):
   - **Node.js version:** `22.x` (≥ 22.13 → `node:sqlite` flag-free; never 22.0–22.12).
   - **Deployment source:** upload **`calm_soft_api_deploy.zip`** (or point at a Git repo). Its contents
     (`dist/`, `package.json`, `package-lock.json`) become the app root — kept **outside** `public_html`, so
     `.env`/`data/outbox.db` are never web-served.
   - **Framework:** `Other` / Node; **Entry / startup file:** `dist/server.js`.
3. **Set environment variables** in the app's env UI (see §3) — including `NODE_ENV=production`.
4. **Install deps:** the pipeline runs `npm install` (from `package-lock.json`; with `NODE_ENV=production`,
   devDeps are skipped). All runtime deps are pure-JS → no native build on the host.
5. **Issue SSL** for `api.calmsoft.pro` (hPanel → SSL; free Let's Encrypt), then **Start / Restart** the app.
6. The API creates `data/outbox.db` (WAL SQLite) on first boot under the app root; the worker drains it.

**No code change anywhere:** the stack stays Next.js static + Fastify. The API sits at the subdomain root and
its routes already begin with `/api`, so `POST /api/contact`, `GET /api/contact/token`, `/health`, `/ready` all
work verbatim; the browser calls them cross-origin from `calmsoft.pro`, which the API's existing `CORS_ORIGINS`
already allows.

**Passenger note (important):** Passenger routes traffic through its own socket, but the app's env validation
**requires `PORT`** and fails fast if it's missing. Set `PORT` (e.g. `3000`) in the env vars so boot passes —
the value doesn't affect routing under Passenger.

---

## 2-ALT) Backend via the newer **Web Apps / build-from-files** pipeline (host compiles from source)

Use this variant when the hPanel deploy screen shows a **framework preset (Fastify) + Node version selector +
overridable "build & output settings" + an env-vars panel** (Hostinger's newer LiteSpeed-proxied Web-Apps model),
rather than the classic "Setup Node.js App" entry-file form above. Here the host **injects `$PORT`** and the app
binds it — this is a different runtime model from the Passenger note above, so **do not hardcode `PORT`**. Full
rationale: [calm_soft_api/docs/superpowers/specs/2026-07-09-hostinger-source-build-deploy-design.md](calm_soft_api/docs/superpowers/specs/2026-07-09-hostinger-source-build-deploy-design.md).

**Bundle:** upload **`_deploy/calm_soft_api_src.zip`** (full source, not the prebuilt `dist` zip). Build it with
**`git archive`** so entries use **forward slashes** — PowerShell `Compress-Archive` writes backslash paths that
some Linux extractors flatten (`src\app.ts` → no `src/` → `tsc` fails):
```
# from calm_soft_api/ (git repo root is the parent LandingPage; source must be committed)
git archive --format=zip -o ../_deploy/calm_soft_api_src.zip HEAD -- \
  src scripts package.json package-lock.json tsconfig.json .nvmrc
# verify: unzip -l shows src/app.ts (forward slash), 27 entries, no .env/data/dist/node_modules/test
```
Contents: all of `src/` (incl. **both** `src/emails/*.hbs`), `scripts/copy-templates.mjs`, `package.json`,
`package-lock.json`, `tsconfig.json`, `.nvmrc`. Fallback for uncommitted changes: 7-Zip or Git-Bash `zip -r`.

**Build settings.** In practice this panel exposes **only the Build command (`npm run build`)** — it runs an
implicit **production-only** install first (devDeps pruned → `sh: tsc: command not found`), then your Build
command. Confirmed by the first deploy log (`added 76 packages` before the build). So the dev-dependency install
is **baked into the `build` script itself** ([package.json](calm_soft_api/package.json)):
`"build": "npm ci --include=dev && tsc && node scripts/copy-templates.mjs"`. Verified end-to-end by reproducing
Hostinger's sequence locally — a prod-only `npm ci` (76 pkgs, no `tsc`) followed by `npm run build` self-installs
the 127-package dev set, compiles, and emits `dist/server.js`.
- **Node:** `22.x` (≥ 22.13 for flag-free `node:sqlite`).
- **Build:** `npm run build` — leave as the panel default; the `--include=dev` now lives inside the script, so
  no separate Install field is needed (the panel doesn't expose/honor one).
- **Start:** `npm start` (`node dist/server.js`) if the panel exposes it; otherwise the preset auto-runs the
  `start` script. Never leave the Fastify preset's `fastify start … app.js` default — there is no `app.js` here.
- **Root:** `./`  ·  **Output dir:** blank.
- *Why it works:* npm CLI `--include=dev` overrides env/`.npmrc` `--omit` (so it beats `NODE_ENV=production`); no
  `.npmrc` in the repo fights it; `npm ci` inside the script can't recurse (the package defines no
  `prepare`/`install` lifecycle scripts). Cross-platform-safe: the lockfile records `@esbuild/linux-x64` and the
  build path needs only pure-JS `typescript` (never tsx/esbuild).
- *Fallback on lockfile drift:* change the script to `npm install --include=dev && tsc && node scripts/copy-templates.mjs`.

**Env vars (§3):** set all required vars in the panel (it supports `.env` import). **Do NOT add `PORT`** — let the
platform inject it; add it manually only if first boot logs `Missing required env var: PORT` (then match whatever
port the proxy targets; if that 502s, remove it). Set **`OUTBOX_DB_PATH` to an absolute path outside the deploy
tree** (e.g. `/home/<user>/calm_soft_data/outbox.db`) so a redeploy can't wipe still-`pending` leads.

**First-boot checks (Runtime logs / `stderr.log`):** (1) `process.version` ≥ 22.13 with no `node:sqlite` flag
error; (2) app logs the bound port and `GET /health` → 200 with **no 502** (port alignment — the likeliest
first-boot failure); (3) `GET /ready` → 200; (4) outbox DB created and surviving a redeploy. Then run the §4
go-live checks.

---

## 3) API environment variables (set in hPanel — never shipped in a file)

Validated fail-fast at boot ([config.ts](calm_soft_api/src/config.ts)); a missing one aborts startup with a
clear message. Secrets marked 🔒 — set them only in hPanel and rotate if ever exposed.

| Var | Value / note |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | e.g. `3000` (required by validation; Passenger routes regardless) |
| `TRUST_PROXY_HOPS` | fixed hop count for Hostinger's proxy — **never `true`**; keep your tested value |
| `SMTP_HOST` / `SMTP_PORT` | `smtp.hostinger.com` / `465` |
| `SMTP_USER` | dedicated SMTP mailbox (not the whole-domain account) |
| `SMTP_PASS` 🔒 | SMTP password |
| `MAIL_FROM` | e.g. `team@calmsoft.pro` (always the From; submitter goes only in Reply-To) |
| `MAIL_TEAM_TO` | internal recipient of inquiries |
| `CORS_ORIGINS` | `https://calmsoft.pro,https://www.calmsoft.pro` |
| `SITE_DOMAIN` | `calmsoft.pro` |
| `FORM_TOKEN_SECRET` 🔒 | ≥ 32 chars |
| `FORM_TOKEN_TTL_MS` | e.g. `600000` |
| `TURNSTILE_SECRET` 🔒 | Cloudflare secret **paired with** the baked site key `0x4AAAAAADyHDjAP-riXdsY9` |
| `SMTP_SEND_CAP_HOURLY` / `SMTP_SEND_CAP_DAILY` | under Hostinger's SMTP limits |
| `OUTBOX_MAX_ATTEMPTS` | e.g. `5` |
| `LOG_PRETTY` | `false` (structured NDJSON in prod) |

Optional: `LOG_LEVEL` (default `info`), `HOST` (default `0.0.0.0`), `OUTBOX_DB_PATH`
(default `data/outbox.db`; set an absolute path outside the docroot if you prefer belt-and-suspenders).

---

## 4) Go-live checklist (do these before/at launch)

- **DNS/email:** publish **SPF** (include Hostinger's send hosts) + **DKIM** + **DMARC** for `calmsoft.pro`.
- **Turnstile:** register `calmsoft.pro` in the Cloudflare Turnstile widget; confirm the site key baked into the
  frontend (`0x4AAAAAADyHDjAP-riXdsY9`) and the API's `TURNSTILE_SECRET` are the **matched pair** for that widget.
- **trustProxy linchpin:** after deploy, send a request with a forged `X-Forwarded-For` and confirm `request.ip`
  does **not** change (i.e. `TRUST_PROXY_HOPS` is correct) — every IP-keyed control depends on this.
- **Secrets not served** (from api.calmsoft.pro): `GET /.env` → 404, `GET /data/outbox.db` → 404.
- **Origin gate:** a `POST /api/contact` with no/disallowed `Origin` (or wrong `Content-Type`) → 403/415.
- **Health vs ready:** point uptime monitoring at `GET /ready` (runs `transporter.verify()`), not `GET /health`.
  Alert on `503`s and on approaching the send cap — via a channel **other than** Hostinger SMTP.
- **End-to-end:** submit the live form once → confirm the internal notification email arrives and the row in the
  outbox flips to `sent`.

Depth references: [calm_soft_api/CLAUDE.md](calm_soft_api/CLAUDE.md) (deploy checklist + constraints),
[calm_soft_api/docs/integration/frontend-integration.md](calm_soft_api/docs/integration/frontend-integration.md)
(CSP block + external smoke curls), [calm_soft_web/CLAUDE.md](calm_soft_web/CLAUDE.md) (static-export rules).

---

## Notes

- **Git:** nothing here is committed for you — the changed source files and these artifacts are yours to commit.
  `_deploy/` and the built `dist/`/`out/` are gitignored build output.
- **Node version:** the only reason the API needs Node 22 (not 24) is the built-in `node:sqlite`, unflagged in
  the 22 LTS line at **v22.13.0**. Selecting Hostinger "Node 22.x" satisfies this with no code change.

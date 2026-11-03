# Deploy to Hostinger — calm_soft (calmsoft.pro)

Two separately-deployed apps, both built for **Node 22** and Hostinger's serving model:

| App | What | Where | Runs |
|---|---|---|---|
| **Frontend** `calm_soft_web` | Next.js 16 **static export** | `public_html/` of **calmsoft.pro** (apex + www) | Apache/LiteSpeed serves files — no Node on host |
| **Backend** `calm_soft_api` | Fastify (stack unchanged) | **Node.js Web App** on subdomain **api.calmsoft.pro** (same account, same IP `46.202.142.128`) | Node 22 + Passenger/LiteSpeed |

They are joined by CORS (`CORS_ORIGINS` on the API = the front's origins) and the front's CSP
`connect-src` (= `https://api.calmsoft.pro`). Both must stay in exact agreement.

**Confirmed topology (subdomain):** frontend static on `calmsoft.pro`, API on the `api.calmsoft.pro`
subdomain of the **same** account/IP. The tech stack stays Next.js static + Fastify; CORS and the frontend's API
base URL are already aligned. ~~The bundles below are correct as-is — nothing needs rebuilding.~~
**[Superseded — 2026-07-09 sync-send migration: the API code HAS changed (outbox removed, synchronous send,
`[DIAG]` env dump removed). Both API bundles in `_deploy/` predate this and must NOT be uploaded — they ship the
outbox build that silently never sends on lsnode, and `calm_soft_api_src.zip` additionally still contains the
`[DIAG]` dump that prints `SMTP_PASS` in cleartext on every boot. Required order: commit the migration → rebuild
`calm_soft_api_src.zip` (§2-ALT `git archive` command — it archives `HEAD`, so it picks up the changes only after
the commit) → deploy → **only then** rotate `SMTP_PASS` (rotating while the old DIAG build is still live would
re-leak the new password on the next boot). The web bundle (`calm_soft_web_out.zip`) is unaffected.]**

**Ready-to-upload bundles** (in `_deploy/`):
- `_deploy/calm_soft_web_out.zip` — the static site (42 entries incl. `.htaccess`).
- `_deploy/calm_soft_api_src.zip` — **rebuilt 2026-07-09 22:04 from the working tree** (changes were still
  uncommitted, so the §2-ALT `git archive HEAD` command would have packaged the stale outbox build; used the
  documented fallback — bsdtar, forward-slash entries verified). Contains sync-send + the logger level split,
  no `[DIAG]`, no outbox. **Commit the source before/at deploy so HEAD matches what's live.**
- `_deploy/calm_soft_api_deploy.zip` — **STALE, do not upload** (prebuilt `dist/` from the outbox era).

**[2026-07-22 — contact v2: BOTH bundles above are stale again.]** The working tree carries the 3-field-form +
`POST /api/contact/details` rework (see the 2026-07-22 addendum at the end of this file). Required order:
commit → rebuild `calm_soft_api_src.zip` (§2-ALT) → deploy **API first** → rebuild + redeploy the front
(`NEXT_PUBLIC_GA_ID` baked in) → after a few days of cache rotation, the v2.1 cleanup deploy. Do not upload the
2026-07-09 bundles.

---

## 1) Frontend — static site → `public_html`

Baked into this build (build-time env, inlined — changing any of these requires a rebuild):
`NEXT_PUBLIC_API_BASE_URL=https://api.calmsoft.pro`, `NEXT_PUBLIC_SITE_URL=https://calmsoft.pro`,
`NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAADyHDjAP-riXdsY9`, `NEXT_PUBLIC_CONTACT_EMAIL=team@calmsoft.pro`,
`NEXT_PUBLIC_GA_ID=G-ZJR3EJ2Q6F`.

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
$env:NEXT_PUBLIC_GA_ID="G-ZJR3EJ2Q6F"
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
   - **Node.js version:** `22.x` (≥ 22.13 → `node:sqlite` flag-free; never 22.0–22.12). **[Superseded — 2026-07-09]**
     `node:sqlite` is no longer used (see addendum); still use `22.x` for consistency with `package.json` `engines`.
   - **Deployment source:** upload **`calm_soft_api_deploy.zip`** (or point at a Git repo). Its contents
     (`dist/`, `package.json`, `package-lock.json`) become the app root — kept **outside** `public_html`, so
     `.env` is never web-served. ~~`/data/outbox.db`~~ **[Superseded — 2026-07-09]** no outbox file exists anymore.
   - **Framework:** `Other` / Node; **Entry / startup file:** `dist/server.js`.
3. **Set environment variables** in the app's env UI (see §3) — including `NODE_ENV=production`.
4. **Install deps:** the pipeline runs `npm install` (from `package-lock.json`; with `NODE_ENV=production`,
   devDeps are skipped). All runtime deps are pure-JS → no native build on the host.
5. **Issue SSL** for `api.calmsoft.pro` (hPanel → SSL; free Let's Encrypt), then **Start / Restart** the app.
6. The API creates `data/outbox.db` (WAL SQLite) on first boot under the app root; the worker drains it.
   **[Superseded — 2026-07-09]** The outbox/worker subsystem has been removed — see the addendum near the end of
   this file. The API now sends the internal notification email synchronously inside the request instead.

**No code change anywhere:** the stack stays Next.js static + Fastify. The API sits at the subdomain root and
its routes already begin with `/api`, so `POST /api/contact`, `POST /api/contact/details`,
`GET /api/contact/token`, `/health`, `/ready` all work verbatim; the browser calls them cross-origin from `calmsoft.pro`, which the API's existing `CORS_ORIGINS`
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
# verify: unzip -l shows src/app.ts (forward slash), 26 entries (24 pre-v2 + 2 inquiry-details templates), no .env/data/dist/node_modules/test
```
Contents: all of `src/` (incl. **all four** `src/emails/*.hbs` — `inquiry-internal.*` and the `inquiry-details.*`
pair added 2026-07-22), `scripts/copy-templates.mjs`, `package.json`, `package-lock.json`, `tsconfig.json`,
`.nvmrc`. **`git archive` packages `HEAD`, not the working tree — the v2 changes (incl. the brand-new, until-now
untracked `src/emails/inquiry-details.hbs/.txt.hbs`) reach the zip only AFTER they are committed.** Fallback for
uncommitted changes: 7-Zip or Git-Bash `zip -r`.

**Build settings.** In practice this panel exposes **only the Build command (`npm run build`)** — it runs an
implicit **production-only** install first (devDeps pruned → `sh: tsc: command not found`), then your Build
command. Confirmed by the first deploy log (`added 76 packages` before the build). So the dev-dependency install
is **baked into the `build` script itself** ([package.json](calm_soft_api/package.json)):
`"build": "npm ci --include=dev && tsc && node scripts/copy-templates.mjs"`. Verified end-to-end by reproducing
Hostinger's sequence locally — a prod-only `npm ci` (76 pkgs, no `tsc`) followed by `npm run build` self-installs
the 127-package dev set, compiles, and emits `dist/server.js`.
- **Node:** `22.x` (≥ 22.13 for flag-free `node:sqlite`). **[Superseded — 2026-07-09]** `node:sqlite` is no longer
  used (see addendum); keep `22.x` anyway for consistency with `package.json` `engines`.
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
port the proxy targets; if that 502s, remove it). ~~Set **`OUTBOX_DB_PATH` to an absolute path outside the deploy
tree** (e.g. `/home/<user>/calm_soft_data/outbox.db`) so a redeploy can't wipe still-`pending` leads.~~
**[Superseded — 2026-07-09]** `OUTBOX_DB_PATH` is no longer read by the app — see the addendum near the end of
this file; do not set it.

**First-boot checks (Runtime logs / `stderr.log`):** `info`/`debug`/`trace` lines land in **Runtime logs** (stdout);
`warn`/`error`/`fatal` land in **`stderr.log`**. (1) `process.version` ≥ 22.13 with no `node:sqlite` flag
error **[Superseded — 2026-07-09: `node:sqlite` is no longer used, so there is nothing to check here]**; (2) app
logs the bound port and `GET /health` → 200 with **no 502** (port alignment — the likeliest first-boot failure);
(3) `GET /ready` → 200; (4) ~~outbox DB created and surviving a redeploy~~ **[Superseded — 2026-07-09]** submit
one live form and confirm the internal notification email arrives (see the addendum — this is now the only
end-to-end proof that sending works); since 2026-07-22 also complete step 2 (area/budget/phone) and confirm the
second `Inquiry details — {name} ({email})` mail arrives. Then run the §4 go-live checks.

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
| ~~`OUTBOX_MAX_ATTEMPTS`~~ | **[Superseded — 2026-07-09]** no longer read by the app; delete from hPanel if set |
| `LOG_PRETTY` | `false` (structured NDJSON in prod) |

Optional: `LOG_LEVEL` (default `info`), `HOST` (default `0.0.0.0`). ~~`OUTBOX_DB_PATH`
(default `data/outbox.db`; set an absolute path outside the docroot if you prefer belt-and-suspenders).~~
**[Superseded — 2026-07-09]** `OUTBOX_DB_PATH` is no longer read by the app; delete it from hPanel if set, and the
`data/outbox.db` file (if present on the host) can be removed — **but inspect it first**: rows with
`status='pending'` are real submissions that were 200-acked and never mailed during the broken period (payload is
plain JSON). In this deployment the only pending row is the known 2026-07-09 test submission, so nothing real is
lost. See the addendum near the end of this file.

---

## 4) Go-live checklist (do these before/at launch)

- **DNS/email:** publish **SPF** (include Hostinger's send hosts) + **DKIM** + **DMARC** for `calmsoft.pro`.
- **Turnstile:** register `calmsoft.pro` in the Cloudflare Turnstile widget; confirm the site key baked into the
  frontend (`0x4AAAAAADyHDjAP-riXdsY9`) and the API's `TURNSTILE_SECRET` are the **matched pair** for that widget.
- **trustProxy linchpin:** after deploy, send a request with a forged `X-Forwarded-For` and confirm `request.ip`
  does **not** change (i.e. `TRUST_PROXY_HOPS` is correct) — every IP-keyed control depends on this.
- **Secrets not served** (from api.calmsoft.pro): `GET /.env` → 404. ~~`GET /data/outbox.db` → 404.~~
  **[Superseded — 2026-07-09]** the outbox no longer exists, so there is no `data/outbox.db` to check.
- **Origin gate:** a `POST /api/contact` — and, since 2026-07-22, a `POST /api/contact/details` — with
  no/disallowed `Origin` (or wrong `Content-Type`) → 403/415.
- **Health vs ready:** point uptime monitoring at `GET /ready` (runs a live `transporter.verify()` **per probe**,
  bounded by the transport timeouts — a boot-time flag would always lose the race on lsnode's
  cold-process-per-request lifecycle), not `GET /health`. Alert on `503`s from both contact POSTs and on
  `mail send failed` log lines — via a channel **other than** Hostinger SMTP. (The in-memory send-cap counter
  resets per boot on lsnode; a cap-approach alert cannot fire outside a sustained flood.)
- **End-to-end (REQUIRED, not optional):** submit the live form once → confirm the internal notification email
  actually arrives at `MAIL_TEAM_TO`; since 2026-07-22 also complete step 2 → confirm the second
  `Inquiry details — {name} ({email})` mail. ~~and the row in the outbox flips to `sent`.~~ **[Superseded — 2026-07-09]**
  there is no outbox row anymore — this live-submission test is now the *only* proof that mail delivery works, since
  the send happens synchronously in the request with no durable trail. See the addendum below for why this became
  mandatory.
- **Rotate `SMTP_PASS`.** **[New — 2026-07-09]** It was printed in cleartext by a since-removed `[DIAG]` startup
  log dump and must be treated as leaked into captured logs. **Order matters:** rotate only AFTER the DIAG-free
  build is deployed and confirmed live — the currently-deployed build still dumps the env on every boot, so
  rotating first would immediately re-leak the new password.

Depth references: [calm_soft_api/CLAUDE.md](calm_soft_api/CLAUDE.md) (deploy checklist + constraints),
[calm_soft_api/docs/integration/frontend-integration.md](calm_soft_api/docs/integration/frontend-integration.md)
(CSP block + external smoke curls), [calm_soft_web/CLAUDE.md](calm_soft_web/CLAUDE.md) (static-export rules).

---

## Notes

- **Git:** nothing here is committed for you — the changed source files and these artifacts are yours to commit.
  `_deploy/` and the built `dist/`/`out/` are gitignored build output.
- **Node version:** ~~the only reason the API needs Node 22 (not 24) is the built-in `node:sqlite`, unflagged in
  the 22 LTS line at **v22.13.0**.~~ **[Superseded — 2026-07-09]** `node:sqlite` (and the outbox that used it) has
  been removed — see the addendum below. The `engines: >=22.13.0` pin in `package.json` stays regardless, so keep
  selecting Hostinger "Node 22.x".

---

## Addendum — 2026-07-09: outbox removed, internal email now sent synchronously

**Why:** in production, Hostinger's `lsnode` runtime was found to `SIGTERM` the API's Node process roughly **1
second after every HTTP response** — the process is not long-running, it lives only for the duration of a request.
The old design wrote each submission to a durable SQLite outbox (`data/outbox.db`), answered `200` immediately, and
relied on a background worker ticking every 5 seconds to actually send the mail. That worker's first tick could
never arrive before the process was killed, so submissions were accepted but the internal notification email was
**silently never sent**. Full technical write-up:
[calm_soft_api/docs/superpowers/specs/2026-07-09-hostinger-source-build-deploy-design.md](calm_soft_api/docs/superpowers/specs/2026-07-09-hostinger-source-build-deploy-design.md)
(see its own "Addendum — production finding" section) and
[calm_soft_api/CLAUDE.md](calm_soft_api/CLAUDE.md) ("Architecture" and "Non-obvious constraints").

**What changed:**
- The outbox/worker subsystem (and `node:sqlite`) has been **removed entirely**. `POST /api/contact` now `await`s
  the SMTP send **synchronously**, inside the request, before responding.
- **A submission either mails immediately or the visitor gets a `503`.** On successful send: form token consumed,
  `200` returned. On SMTP failure: send budget released, form token left **unconsumed**, and the API responds
  `503` + `Retry-After: 30`. The visitor's retry needs a **fresh Turnstile token** (single-use — the widget
  re-issues one; the formToken stays valid), per `docs/integration/frontend-integration.md` §4. SMTP timeouts:
  `connectionTimeout` 5s / `greetingTimeout` 5s / `socketTimeout` 10s / `dnsTimeout` 5s — typical failure detection
  ≤5s, but not a hard bound (`socketTimeout` is per-inactivity; a degraded-but-alive session can exceed 10s, past
  the frontend's 10s abort — the send may still complete server-side, so a manual retry can duplicate the internal
  mail; accepted). There is no background retry and no durable queue anymore — the human hitting "retry" is the
  only retry mechanism.
- **No env vars needed for the outbox.** `OUTBOX_DB_PATH` and `OUTBOX_MAX_ATTEMPTS` are no longer read by the app.
  Delete them from the hPanel environment-variables panel if still set, and remove any leftover `data/outbox.db`
  file from the host — neither does anything anymore. **Before deleting the db file, check it for
  `status='pending'` rows** (real leads 200-acked but never mailed during the broken period; payload column is
  plain JSON). In this deployment the only pending row is the known 2026-07-09 test submission.
- **The send-budget hourly/daily cap is in-memory and per-process.** Since `lsnode` boots a fresh process per
  request, this cap effectively resets every boot rather than persisting across a real window — a known, accepted
  limitation. Cloudflare Turnstile remains the primary anti-automation tier, not the send cap.
- A `[DIAG] rawEnv` / `[DIAG] config` startup log dump that printed the full parsed env (including `SMTP_PASS` in
  cleartext) to captured logs has been removed from `src/server.ts`. **`SMTP_PASS` must be rotated in hPanel** —
  treat the old value as leaked.

**Required post-deploy checklist addition:** submitting the live contact form end-to-end and confirming the
internal notification email arrives at `MAIL_TEAM_TO` is now a **required** step, not optional — with no outbox
left to inspect afterward, a live send is the only way to prove delivery actually works. See the updated §4
go-live checklist above.

---

## Addendum — 2026-07-22: contact v2 — 3-field form + `POST /api/contact/details`

The landing moved to a **3-field form** (name / e-mail / message) with an optional post-success **step 2**
(area / budget / phone). The API changed in lockstep: `POST /api/contact` slimmed to
`{name, email, message, website, formToken, turnstileToken}` with the legacy 9-field keys transitionally
tolerated-and-ignored, plus a new `POST /api/contact/details` endpoint (same security chain, own 5/15-min
rate bucket, no DB — correlation via the step-2 mail subject). Contract of record:
[calm_soft_api/docs/integration/frontend-integration.md](calm_soft_api/docs/integration/frontend-integration.md);
rationale: `calm_soft_web/docs/superpowers/specs/2026-07-22-pl-first-person-rework-design.md` §6.

**Rollout order (matters):**
1. **Commit everything first.** The whole v2 change set sits in the working tree, and the two new
   `src/emails/inquiry-details.hbs/.txt.hbs` templates are **untracked** until committed — the §2-ALT
   `git archive HEAD` command would silently omit them. Then rebuild `_deploy/calm_soft_api_src.zip` (§2-ALT;
   expect **26 entries**) and the web bundle.
2. **API v2 first** (hPanel: rebuild + restart). Fully backward compatible — the old 9-field payload still
   validates (legacy keys tolerated and ignored), so cached front bundles hit no `400` window.
3. **Then the front** (new build with the 3-field form; `NEXT_PUBLIC_GA_ID=G-ZJR3EJ2Q6F` is baked in at build
   time — §1; front-only, the API is untouched by it).
4. **After a few days** (static-front caches rotated): **API v2.1 cleanup deploy** — remove the transitional
   legacy keys from the `/api/contact` schema and the legacy-tolerance test. This is the only open code follow-up.

**Not in this rollout:** no new API env vars, no migrations (no DB), no CORS or rate-limit changes; `/health`
and `/ready` unchanged. The `SMTP_PASS` rotation (2026-07-09 item above) still applies if not yet done.

**Post-deploy smoke (extends §4):** `GET /api/contact/token` → `POST /api/contact` with a minimal v2 payload →
`200` + `New inquiry — {name}` mail; then `POST /api/contact/details` (fresh formToken + fresh Turnstile) →
`200` + a second `Inquiry details — {name} ({email})` mail; for the transitional window, an old full 9-field
payload → also `200` (one mail, legacy fields absent from it).

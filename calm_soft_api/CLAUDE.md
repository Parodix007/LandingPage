# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`calm_soft_api` — the contact-form backend for the **calm_soft** software-house landing page (domain **calmsoft.pro**). A single anonymous, public endpoint that validates a form submission, runs it through several anti-abuse gates, and hands off an internal notification email to the team. Deliberately **no JWT / no auth** — the security model is built around hardening an anonymous public API without adding user friction.

Stack: **Node.js + Fastify 5 + TypeScript (strict)**. Email via **nodemailer** over Hostinger SMTP. Deployed as a long-running Node process on **Hostinger web-app hosting**, behind Hostinger's proxy. The frontend (`../calm_soft_web`) is hosted separately as static files.

The full design rationale — including the adversarial security evaluation that shaped it — lives in [docs/superpowers/specs/2026-07-08-calm-soft-api-design.md](docs/superpowers/specs/2026-07-08-calm-soft-api-design.md). Read it before making architectural changes.

## Working principle: AI collaboration model

This project uses a **two-model split**, deliberately:

- **Analysis, evaluation, design review, and verification → Fable, run as multi-agent dynamic workflows.** Any non-trivial analysis (evaluating a design, reviewing a solution, threat-modeling, comparing approaches, verifying that a change is correct/secure) is done with the **Workflow tool**, using the adversarial patterns: **multi-perspective review → skeptics (adversarial refutation) → judge panel → completeness critics → synthesis**. Do not settle an analysis or verification from a single pass — fan out and adversarially verify. This is how the current security design was produced.
- **Implementation → Sonnet 5.** Writing and editing code is delegated to Sonnet 5 (e.g. via subagents with `model: 'sonnet'`, or by switching the session model for the build phase).

Practically: reach for a dynamic workflow whenever the task is *thinking* (analyze/verify/design), and use Sonnet 5 when the task is *building* (scaffold/write/edit). Verify implementation output with a Fable workflow before declaring it done.

## Architecture (the big picture)

`buildApp()` in `src/app.ts` is a **testable factory** — it wires plugins and routes and returns a Fastify instance without opening a port. `src/server.ts` only calls `listen()` and installs graceful-shutdown handlers. Tests exercise the app via `app.inject()`, never a real socket.

The **request path never awaits SMTP**. `POST /api/contact` validates, passes anti-abuse gates, writes the submission to a **file-based SQLite outbox** (`data/outbox.db`, WAL mode, on disk, outside the served docroot), responds `200`, and returns. A separate **worker** (`src/outbox/worker.ts`) drains `pending` rows, sends via nodemailer with retry + dead-letter, and marks rows `sent`/`dead`. Because rows are durable on disk, a process restart (Hostinger recycles on every deploy) re-drains unsent rows — no lead is lost, and the outbox doubles as an audit trail.

The anti-abuse gates are layered (cheapest first) and live under `src/security/`. Each is defense-in-depth; **none alone is sufficient**:
1. **Origin/Referer allowlist + `Content-Type: application/json`** (`origin-guard.ts`) — CORS is *not* an access control (curl ignores it); this server-side check is what actually blocks direct scripts and drive-by CSRF.
2. **HMAC form token** (`form-token.ts`) — issued by `GET /api/contact/token`, echoed on POST, verified for signature + expiry + one-time use; binds a submission to a real page load.
3. **Cloudflare Turnstile** (`turnstile.ts`) — invisible mode, mandatory server-side `siteverify`, **fail-closed**. This is the real no-JWT anti-automation tier; the honeypot and per-IP rate limit are courtesy layers only.
4. **Global outbound-email circuit breaker** (`send-budget.ts`) — a process-wide hourly/daily send cap under Hostinger's SMTP limit; on exceed it returns `200` and stops sending rather than letting a flood get the account suspended.

## Non-obvious constraints (do not regress these)

- **`trustProxy` must be a fixed hop count or Hostinger's proxy CIDR — never `true`.** `trustProxy: true` lets an attacker forge `X-Forwarded-For` and get a fresh `request.ip` per request, nullifying every IP-keyed control. This is the linchpin — verify a bogus `X-Forwarded-For` does not change `request.ip` before shipping.
- **`format: "email"` is a silent no-op in Fastify 5 unless `ajv-formats` is registered** on the Ajv instance. Keep it wired, and keep the `pattern` rejecting CR/LF/`<>`/commas in `email` and `name` (prevents SMTP header/CRLF injection). The `email` `pattern` also enforces a dotted TLD on top of `format:'email'` (which in fast mode does not require one), and `phone` uses a dedicated pattern requiring 7–15 digits (lenient international) — neither should be reverted to the loose `noCrlfLoose`/no-TLD form.
- **The submitter address goes only in `Reply-To`, as a structured nodemailer address object.** `From` is always `MAIL_FROM`. Never interpolate `name`/`email`/`company`/`phone` into any header string (Subject/From/To/Reply-To).
- **No client-confirmation email.** Sending to an unverified attacker-supplied address turns the SMTP account into a mailbomb/backscatter amplifier and gets it blocklisted. Only `MAIL_TEAM_TO` is ever an unconditional recipient. The frontend shows on-page confirmation.
- **SMTP failure returns `503` + `Retry-After`, not `502`** — Hostinger's proxy emits its own `502` for origin-down, so `502` would be ambiguous during incidents.
- **Full request body (incl. PII) is logged by design.** Per an explicit product decision, `POST /api/contact` logs the complete incoming body — `name`, `email`, `phone`, `company`, `message` — at `info` in every environment, so application logs now contain personal data (RODO/GDPR: they are a personal-data store subject to retention limits, access control, and erasure). Redaction in `src/logger.ts` (`REDACT_PATHS`) is deliberately narrowed to credential headers only (`authorization`, `cookie`). Do NOT re-add body/PII redaction without a product sign-off. Still strip CR/LF from any free text placed in a log **message string** (structured pino fields are already injection-safe). `LOG_LEVEL` env var (default `info`, validated) controls verbosity; pretty output is gated by the `LOG_PRETTY` env flag (default: on in `development`, off elsewhere so production emits structured NDJSON for log shipping/alerting); `pino-pretty` remains a production dependency so the flag can enable it in any environment.
- **`.env` and `data/outbox.db` live outside the served docroot.** A deploy check must confirm `GET /.env` and `GET /data/outbox.db` return `404`.
- **Env is validated fail-fast at startup**, and also in CI/pre-boot so a bad `.env` can't cause a restart-loop. The failure log names the missing var but never prints its value.

## Commands

> **Node 22 required** (`engines: >=22.13.0`; `.nvmrc` = `22`). The outbox uses Node's **built-in `node:sqlite`** (`DatabaseSync`), not a native module — this removes the former `better-sqlite3` dependency, which failed to install on Hostinger's toolchain-less build sandbox (no prebuilt binary reachable → `node-gyp` fell back to compiling → no Python). `node:sqlite` loads **without `--experimental-sqlite` since Node 22.13.0** (the LTS backport; also ≥ 23.4.0) — it stays "experimental" (may emit a non-fatal `ExperimentalWarning`) but runs — so the deploy host's Node Selector must be set to **22.x** (any current 22.x is ≥ 22.13). Do **not** select a Node 22.0–22.12 build: there `node:sqlite` still needs the flag and boot would throw at `src/outbox/store.ts`. It is loaded via `createRequire` in `src/outbox/store.ts` so the Vitest bundler doesn't mis-resolve the builtin — do not convert it back to a static `import ... from 'node:sqlite'`. `nodemailer` is `^9` (the `6.x` line has unpatched SMTP/CRLF-injection advisories). Keep this section in sync:

- Install: `npm ci`
- Dev (watch): `npm run dev` (e.g. `tsx watch src/server.ts`)
- Build: `npm run build` (`tsc`) — also **precompiles Handlebars templates** so no template compilation touches request data at runtime
- Start (prod): `npm start` (`node dist/server.js`)
- Typecheck: `npm run typecheck` (`tsc --noEmit`)
- Test (all): `npm test` (Vitest)
- Test (single file): `npx vitest run test/contact.test.ts`
- Test (single case): `npx vitest run -t "rejects malformed email"`
- Security audit (CI merge gate): `npm audit --production` (note: `pino-pretty` is now a production dependency, not dev-only)

## Testing

Vitest, driven through `app.inject()` — no port, mailer/worker mocked. Treat the tests as **executable specifications of the security controls**, run as a CI merge gate (the `ajv-formats` no-op bug proves these regress silently on dependency bumps). Each control has an assertion: malformed email → `400`, extra property → `400`, `>32 KB` → `413`, filled honeypot → fake `200` with zero send calls, 6th request in window → `429`, disallowed Origin → `403`, missing/invalid HMAC token → `403`, missing/invalid Turnstile → `403`, `\r\nBcc:` payload → exactly one recipient.

## Related directories (siblings, separate deploys)

- `../calm_soft_web` — the static landing-page frontend. Must send `Content-Type: application/json`, an allowlisted `Origin`, the HMAC token, and the Turnstile token.
- `../email_templates_calm_soft` — source of the Handlebars email templates. Only `inquiry-internal` is used by this API; copy it into `src/emails/` (templates must ship with the app). The `confirmation-client` template is intentionally unused.
- `../logo_calm_soft` — brand assets (not used by the API).

## Deploy checklist (Hostinger)

Publish **SPF (incl. Hostinger's send hosts) + DKIM + DMARC** for `calmsoft.pro` before relying on delivery. Use a dedicated, minimally-scoped SMTP account (not the whole-domain mailbox). Point uptime monitoring at `GET /ready` (runs `transporter.verify()`), not `GET /health` — `/health` stays green even when SMTP is dead. Alert on `503`s and on approaching the send cap, via a channel **other than** Hostinger SMTP.

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { checkOrigin } from '../security/origin-guard.js';
import type { FormTokenService } from '../security/form-token.js';
import type { TurnstileVerifier } from '../security/turnstile.js';
import type { SendBudget } from '../security/send-budget.js';
import type { Submission, DetailsSubmission } from '../mailer/mailer.js';

export interface ContactDeps {
  allowedOrigins: string[];
  formToken: FormTokenService;
  turnstile: TurnstileVerifier;
  sendBudget: SendBudget;
  sendMail: (s: Submission) => Promise<void>;
  sendDetailsMail: (s: DetailsSubmission) => Promise<void>;
}

const noCrlfLoose = '^[^\\r\\n]*$';  // free text (company/phone/honeypot): only bar CR/LF
const namePattern = '^[^\\r\\n]+$';  // name: allow commas/brackets ("Doe, Jane"), bar only CR/LF

// email: exactly one @, dotted TLD (>=2 chars); bars CR/LF, spaces, < > and commas (SMTP header safety).
// Layered on top of Ajv's format:'email' (fast mode), which does NOT require a TLD.
const emailPattern = '^[^\\s@<>,]+@[^\\s@<>,]+\\.[^\\s@<>,]{2,}$';
// phone (optional field): empty string OR a real-looking number — 7-15 digits total, lenient international
// (optional leading +, digits, spaces, parens, dot, slash, hyphen). No letters/<>/,/CR-LF.
const phonePattern = '^(?:|(?=(?:\\D*\\d){7,15}\\D*$)\\+?[0-9 ()./-]+)$';

// Strip C0/C1 control chars so terminal-escape sequences can't reach the email or the
// logs verbatim. For the message body keep newlines; header-bound fields strip all.
const stripControls = (v: string, keepNewlines = false) =>
  keepNewlines
    ? v.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    : v.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

// Step 1 (name/email/message) — the public site's form shrank from 9 fields to 3.
// The transitional keys below are NOT read by the handler: they only exist so that
// old cached frontend bundles (which may still POST the legacy 9-field payload for
// days after deploy) keep getting a 200 instead of a 400 from additionalProperties:false.
const bodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'email', 'message', 'formToken', 'turnstileToken'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 120, pattern: namePattern },
    email: { type: 'string', format: 'email', maxLength: 254, pattern: emailPattern },
    message: { type: 'string', minLength: 1, maxLength: 5000 },
    website: { type: 'string', maxLength: 160, pattern: noCrlfLoose },
    formToken: { type: 'string', maxLength: 512 },
    turnstileToken: { type: 'string', maxLength: 4096 },
    // transitional — old cached bundles; remove in cleanup deploy
    company: { type: 'string', maxLength: 160 },
    phone: { type: 'string', maxLength: 40 },
    service: { type: 'string', maxLength: 40 },
    meeting: { type: 'string', maxLength: 20 },
    discover: { type: 'boolean' },
    handover: { type: 'boolean' },
  },
} as const;

// Step 2 (optional post-submit detail capture: area/budget/phone), posted separately
// once the visitor has already completed step 1.
const detailsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'email', 'formToken', 'turnstileToken'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 120, pattern: namePattern },
    email: { type: 'string', format: 'email', maxLength: 254, pattern: emailPattern },
    area: { type: 'string', enum: ['core', 'automation', 'rescue', 'web', 'not-sure'] },
    budget: { type: 'string', enum: ['under-10k', '10-30k', '30-80k', '80k-plus', 'no-idea'] },
    phone: { type: 'string', maxLength: 40, pattern: phonePattern },
    website: { type: 'string', maxLength: 160, pattern: noCrlfLoose },
    formToken: { type: 'string', maxLength: 512 },
    turnstileToken: { type: 'string', maxLength: 4096 },
  },
} as const;

// Shared preValidation chain (logging + origin gate) for both /api/contact and
// /api/contact/details — identical wiring, factored so the two routes can't drift.
// Origin/Referer + Content-Type gate runs before Ajv validation (parsing ->
// preValidation -> validation); a non-JSON body would otherwise 400 before 415/403 could fire.
function contactPreValidation(deps: ContactDeps) {
  return [
    async (req: FastifyRequest) => {
      req.log.info({ ip: req.ip, body: req.body }, 'contact request received');
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const g = checkOrigin(
        { origin: req.headers.origin, referer: req.headers.referer, contentType: req.headers['content-type'] },
        deps.allowedOrigins,
      );
      if (!g.ok) {
        req.log.warn({ ip: req.ip, status: g.status, reason: g.message }, 'contact request rejected at origin gate');
        return reply.code(g.status).send({ error: g.message });
      }
    },
  ];
}

type GuardOutcome =
  | { kind: 'honeypot' }
  | { kind: 'token-invalid' }
  | { kind: 'turnstile-invalid' }
  | { kind: 'budget-exceeded' }
  | { kind: 'ok'; nonce: string };

// Shared anti-abuse gate sequence for both handlers, in the exact order the original
// /api/contact handler ran them: honeypot -> formToken -> Turnstile -> send budget.
async function runAntiAbuseGuards(
  req: FastifyRequest,
  b: Record<string, unknown>,
  deps: ContactDeps,
): Promise<GuardOutcome> {
  // Honeypot: indistinguishable fake success, send nothing.
  if (typeof b.website === 'string' && b.website.length > 0) {
    req.log.warn({ ip: req.ip }, 'honeypot triggered');
    return { kind: 'honeypot' };
  }

  // check() is non-mutating; the token is consumed only after a successful send below,
  // so a fail-closed Turnstile timeout or send failure doesn't burn the user's token on their retry.
  const ft = deps.formToken.check(String(b.formToken));
  // Identical 403 body for token AND turnstile failure — no gate oracle.
  if (!ft.ok) {
    req.log.warn({ ip: req.ip, reason: ft.reason }, 'form token rejected');
    return { kind: 'token-invalid' };
  }

  const ts = await deps.turnstile.verify(String(b.turnstileToken), req.ip);
  if (!ts.ok) {
    req.log.warn({ ip: req.ip, reason: ts.reason }, 'turnstile verification failed');
    return { kind: 'turnstile-invalid' };
  }

  const budget = deps.sendBudget.tryConsume();
  if (!budget.ok) {
    req.log.warn({ ip: req.ip, reason: budget.reason }, 'send budget exceeded');
    return { kind: 'budget-exceeded' };
  }

  return { kind: 'ok', nonce: ft.nonce };
}

export async function contactRoutes(app: FastifyInstance, deps: ContactDeps) {
  // Generous per-IP limit on token minting (a user may reload the page a few times).
  app.get(
    '/api/contact/token',
    { config: { rateLimit: { max: 30, timeWindow: '15 minutes' } } },
    async (req) => { req.log.info({ ip: req.ip }, 'form token issued'); return { token: deps.formToken.issue() }; },
  );

  app.post(
    '/api/contact',
    {
      schema: { body: bodySchema },
      // Strict per-IP limit ONLY on the submit route. /health and /ready stay exempt
      // (rate-limit is registered global:false), so uptime probes never self-429.
      config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
      preValidation: contactPreValidation(deps),
    },
    async (req, reply) => {
      const b = req.body as Record<string, unknown>;

      const guard = await runAntiAbuseGuards(req, b, deps);
      if (guard.kind === 'honeypot' || guard.kind === 'budget-exceeded') {
        return reply.code(200).send({ ok: true });
      }
      if (guard.kind === 'token-invalid' || guard.kind === 'turnstile-invalid') {
        return reply.code(403).send({ error: 'Verification failed' });
      }

      // Transitional legacy keys (company/phone/service/meeting/discover/handover) are
      // deliberately never read here — old cached bundles may still send them, but the
      // v2 Submission built below only carries name/email/message.
      const submission: Submission = {
        name: stripControls(String(b.name)).trim(),
        email: stripControls(String(b.email)).trim(),
        message: stripControls(String(b.message), true).trim(),
        submittedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        source: `${deps.allowedOrigins[0]}/#contact`,
      };
      try {
        await deps.sendMail(submission);
        deps.formToken.consume(guard.nonce);
        req.log.info({ ip: req.ip }, 'mail sent');
      } catch (err) {
        deps.sendBudget.release();
        req.log.error({ err: err instanceof Error ? err : String(err), ip: req.ip }, 'mail send failed');
        return reply.code(503).header('retry-after', '30').send({ error: 'Temporarily unavailable' });
      }
      return reply.code(200).send({ ok: true });
    },
  );

  app.post(
    '/api/contact/details',
    {
      schema: { body: detailsSchema },
      // Same strict per-IP limit as the main submit route.
      config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
      preValidation: contactPreValidation(deps),
    },
    async (req, reply) => {
      const b = req.body as Record<string, unknown>;

      const guard = await runAntiAbuseGuards(req, b, deps);
      if (guard.kind === 'honeypot' || guard.kind === 'budget-exceeded') {
        return reply.code(200).send({ ok: true });
      }
      if (guard.kind === 'token-invalid' || guard.kind === 'turnstile-invalid') {
        return reply.code(403).send({ error: 'Verification failed' });
      }

      const submission: DetailsSubmission = {
        name: stripControls(String(b.name)).trim(),
        email: stripControls(String(b.email)).trim(),
        area: typeof b.area === 'string' ? b.area : '',
        budget: typeof b.budget === 'string' ? b.budget : '',
        phone: stripControls(String(b.phone ?? '')).trim(),
        submittedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        source: `${deps.allowedOrigins[0]}/#contact-details`,
      };
      try {
        await deps.sendDetailsMail(submission);
        deps.formToken.consume(guard.nonce);
        req.log.info({ ip: req.ip }, 'details mail sent');
      } catch (err) {
        deps.sendBudget.release();
        req.log.error({ err: err instanceof Error ? err : String(err), ip: req.ip }, 'details mail send failed');
        return reply.code(503).header('retry-after', '30').send({ error: 'Temporarily unavailable' });
      }
      return reply.code(200).send({ ok: true });
    },
  );
}

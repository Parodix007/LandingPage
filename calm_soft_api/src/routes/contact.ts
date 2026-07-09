import type { FastifyInstance } from 'fastify';
import { checkOrigin } from '../security/origin-guard.js';
import type { FormTokenService } from '../security/form-token.js';
import type { TurnstileVerifier } from '../security/turnstile.js';
import type { SendBudget } from '../security/send-budget.js';
import type { Submission } from '../outbox/store.js';

export interface ContactDeps {
  allowedOrigins: string[];
  formToken: FormTokenService;
  turnstile: TurnstileVerifier;
  sendBudget: SendBudget;
  enqueue: (s: Submission) => { id: number };
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
// SQLite outbox verbatim. For the message body keep newlines; header-bound fields strip all.
const stripControls = (v: string, keepNewlines = false) =>
  keepNewlines
    ? v.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    : v.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

const bodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'email', 'service', 'meeting', 'message', 'formToken', 'turnstileToken'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 120, pattern: namePattern },
    email: { type: 'string', format: 'email', maxLength: 254, pattern: emailPattern },
    company: { type: 'string', maxLength: 160, pattern: noCrlfLoose },
    phone: { type: 'string', maxLength: 40, pattern: phonePattern },
    service: { type: 'string', enum: ['web', 'automation', 'core', 'refactor'] },
    meeting: { type: 'string', enum: ['online', 'onsite'] },
    discover: { type: 'boolean' },
    handover: { type: 'boolean' },
    message: { type: 'string', minLength: 1, maxLength: 5000 },
    website: { type: 'string', maxLength: 160, pattern: noCrlfLoose },
    formToken: { type: 'string', maxLength: 512 },
    turnstileToken: { type: 'string', maxLength: 4096 },
  },
} as const;

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
      // Origin/Referer + Content-Type gate runs before Ajv validation (parsing ->
      // preValidation -> validation); a non-JSON body would otherwise 400 before 415/403 could fire.
      preValidation: [
        async (req) => { req.log.info({ ip: req.ip, body: req.body }, 'contact request received'); },
        async (req, reply) => {
          const g = checkOrigin(
            { origin: req.headers.origin, referer: req.headers.referer, contentType: req.headers['content-type'] },
            deps.allowedOrigins,
          );
          if (!g.ok) { req.log.warn({ ip: req.ip, status: g.status, reason: g.message }, 'contact request rejected at origin gate'); return reply.code(g.status).send({ error: g.message }); }
        },
      ],
    },
    async (req, reply) => {
      const b = req.body as Record<string, unknown>;

      // Honeypot: indistinguishable fake success, send nothing.
      if (typeof b.website === 'string' && b.website.length > 0) { req.log.warn({ ip: req.ip }, 'honeypot triggered'); return reply.code(200).send({ ok: true }); }

      // check() is non-mutating; the token is consumed only after a successful enqueue below,
      // so a fail-closed Turnstile timeout doesn't burn the user's token on their retry.
      const ft = deps.formToken.check(String(b.formToken));
      // Identical 403 body for token AND turnstile failure — no gate oracle.
      if (!ft.ok) { req.log.warn({ ip: req.ip, reason: ft.reason }, 'form token rejected'); return reply.code(403).send({ error: 'Verification failed' }); }

      const ts = await deps.turnstile.verify(String(b.turnstileToken), req.ip);
      if (!ts.ok) { req.log.warn({ ip: req.ip, reason: ts.reason }, 'turnstile verification failed'); return reply.code(403).send({ error: 'Verification failed' }); }

      const budget = deps.sendBudget.tryConsume();
      if (!budget.ok) { req.log.warn({ ip: req.ip, reason: budget.reason }, 'send budget exceeded'); return reply.code(200).send({ ok: true }); }

      const submission: Submission = {
        name: stripControls(String(b.name)).trim(),
        email: stripControls(String(b.email)).trim(),
        company: stripControls(String(b.company ?? '')).trim(),
        phone: stripControls(String(b.phone ?? '')).trim(),
        service: String(b.service), meeting: b.meeting as 'online' | 'onsite',
        discover: Boolean(b.discover), handover: Boolean(b.handover),
        message: stripControls(String(b.message), true).trim(),
        submittedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        source: `${deps.allowedOrigins[0]}/#contact`,
      };
      try {
        const { id } = deps.enqueue(submission);
        deps.formToken.consume(ft.nonce);
        req.log.info({ ip: req.ip, outboxId: id }, 'submission enqueued');
      } catch (err) {
        deps.sendBudget.release();
        req.log.error({ err: err instanceof Error ? err : String(err), ip: req.ip }, 'enqueue failed');
        return reply.code(503).header('retry-after', '30').send({ error: 'Temporarily unavailable' });
      }
      return reply.code(200).send({ ok: true });
    },
  );
}

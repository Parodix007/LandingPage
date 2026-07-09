import Fastify, { type FastifyInstance, type FastifyError, type FastifyBaseLogger } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import ajvFormatsPlugin from 'ajv-formats';
import type { Logger } from 'pino';
import type { Config } from './config.js';
import type { FormTokenService } from './security/form-token.js';
import type { TurnstileVerifier } from './security/turnstile.js';
import type { SendBudget } from './security/send-budget.js';
import type { Submission } from './mailer/mailer.js';
import { contactRoutes } from './routes/contact.js';
import { healthRoutes } from './routes/health.js';

export interface AppDeps {
  config: Config; logger?: Logger;
  formToken: FormTokenService; turnstile: TurnstileVerifier; sendBudget: SendBudget;
  sendMail: (s: Submission) => Promise<void>;
  readiness: () => Promise<{ ok: boolean }>;
}

// ajv-formats ships a `.d.ts` written with `export default`, but the package has no
// "type": "module" field, so under this project's `moduleResolution: NodeNext` TypeScript
// resolves the default import as the whole CJS module-namespace type instead of the plugin
// function it actually is at runtime (`module.exports = formatsPlugin`). This is a type-level
// resolution quirk only — the runtime value is unaffected — so we widen the type here rather
// than disabling the check at every call site.
const ajvFormats = ajvFormatsPlugin as any;

export async function buildApp(deps: AppDeps): Promise<FastifyInstance> {
  const { config } = deps;
  // Typed as the widened `FastifyBaseLogger` interface (which a pino `Logger` always
  // satisfies) rather than left as `pino.Logger` — otherwise Fastify's generic inference
  // specializes `FastifyInstance`'s Logger type param to `pino.Logger`, which then fails
  // to structurally match this function's declared `Promise<FastifyInstance>` return type.
  const loggerInstance: FastifyBaseLogger | undefined = deps.logger;
  const app = Fastify({
    // Fastify 5 splits the `logger` option: a plain config object (or boolean)
    // goes to `logger`, but a pre-built Pino instance must go to `loggerInstance`
    // — passing an instance via `logger` throws FST_ERR_LOG_INVALID_LOGGER_CONFIG.
    ...(loggerInstance ? { loggerInstance } : { logger: false }),
    trustProxy: config.TRUST_PROXY_HOPS,
    bodyLimit: 32 * 1024,
    // `removeAdditional: false` overrides @fastify/ajv-compiler's default (`removeAdditional:
    // true`), which otherwise silently strips properties not listed in `additionalProperties:
    // false` schemas instead of rejecting the request — defeating the "extra property -> 400"
    // control the contact schema relies on.
    ajv: { plugins: [ajvFormats], customOptions: { removeAdditional: false } },
  });

  await app.register(helmet);
  await app.register(cors, { origin: config.CORS_ORIGINS, methods: ['GET', 'POST'] });
  await app.register(rateLimit, {
    global: false,
    keyGenerator: (req) => req.ip,
    onExceeded: (req, key: string) => { req.log.warn({ ip: req.ip, key }, 'rate limit exceeded'); },
  });

  // Explicit `<FastifyError>` generic: `setErrorHandler`'s `TError` defaults to `unknown` and
  // can't be inferred from an unannotated callback parameter, so without this the handler body
  // below (`err.statusCode`) would fail to typecheck.
  app.setErrorHandler<FastifyError>((err, req, reply) => {
    const status = err.statusCode ?? 500;
    if (status !== 429) {
      if (status >= 500) req.log.error({ err, ip: req.ip, body: req.body }, 'request failed');
      else req.log.warn({ err: err.message, validation: err.validation, ip: req.ip, body: req.body }, 'request rejected');
    }
    reply.code(status).send({ error: status >= 500 ? 'Internal Server Error' : 'Invalid request' });
  });

  app.setNotFoundHandler((req, reply) => {
    req.log.warn({ ip: req.ip, method: req.method, url: req.url }, 'route not found');
    reply.code(404).send({ error: 'Not found' });
  });

  await app.register(healthRoutes, { readiness: deps.readiness });
  await app.register(contactRoutes, {
    allowedOrigins: config.CORS_ORIGINS,
    formToken: deps.formToken, turnstile: deps.turnstile,
    sendBudget: deps.sendBudget, sendMail: deps.sendMail,
  });
  return app;
}

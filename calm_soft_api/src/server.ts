import 'dotenv/config';
import nodemailer from 'nodemailer';
import { loadConfig } from './config.js';
import { buildLogger } from './logger.js';
import { buildApp } from './app.js';
import { createFormTokenService } from './security/form-token.js';
import { createTurnstileVerifier } from './security/turnstile.js';
import { createSendBudget } from './security/send-budget.js';
import { createMailer } from './mailer/mailer.js';

async function main() {
  // Boot heartbeat on the guaranteed-captured path (console.error → process.stderr.write).
  // Proves the deployed bundle is live even before config/logger init. See src/logger.ts.
  console.error(`[boot] calm_soft_api starting — node ${process.version} pid ${process.pid}`);
  const config = loadConfig(process.env);
  const logger = buildLogger(config.NODE_ENV, config.LOG_LEVEL, config.LOG_PRETTY);
  logger.info(
    {
      nodeEnv: config.NODE_ENV, host: config.HOST, port: config.PORT,
      corsOrigins: config.CORS_ORIGINS, smtpHost: config.SMTP_HOST, logLevel: config.LOG_LEVEL,
      logPretty: config.LOG_PRETTY,
    },
    'config loaded',
  );

  const transport = nodemailer.createTransport({
    host: config.SMTP_HOST, port: config.SMTP_PORT, secure: config.SMTP_PORT === 465,
    auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
    pool: true, maxConnections: 3,
    // dnsTimeout matters: nodemailer's default is 30s and the lookup runs BEFORE
    // connectionTimeout is armed — on lsnode every request is a cold process (no DNS cache).
    connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 10000, dnsTimeout: 5000,
  });

  const mailer = createMailer({ transport, from: config.MAIL_FROM, teamTo: config.MAIL_TEAM_TO, logger });

  const app = await buildApp({
    config, logger,
    formToken: createFormTokenService({ secret: config.FORM_TOKEN_SECRET, ttlMs: config.FORM_TOKEN_TTL_MS }),
    turnstile: createTurnstileVerifier({ secret: config.TURNSTILE_SECRET }),
    sendBudget: createSendBudget({ hourlyCap: config.SMTP_SEND_CAP_HOURLY, dailyCap: config.SMTP_SEND_CAP_DAILY }),
    sendMail: (s) => mailer.sendInternal(s),
    sendDetailsMail: (s) => mailer.sendDetails(s),
    // On-demand SMTP check, not a boot-time flag: on lsnode every probe is a cold process,
    // so a fire-and-forget verify() would ALWAYS lose the race and /ready would sit at 503.
    // verify() is bounded by the transport timeouts above (~5s typical failure detection).
    readiness: async () => {
      try {
        await transport.verify();
        return { ok: true };
      } catch (e) {
        logger.warn({ err: e, smtpHost: config.SMTP_HOST }, 'smtp verify failed');
        return { ok: false };
      }
    },
  });

  await app.listen({ host: config.HOST, port: config.PORT });
  logger.info({ port: config.PORT }, 'calm_soft_api listening');

  const shutdown = async (sig: string) => {
    logger.info({ sig }, 'shutting down');
    try {
      await app.close();
      logger.info('http server closed');
      transport.close();
      logger.info('smtp transport closed');
    } finally {
      await new Promise<void>((resolve) => logger.flush(() => resolve()));
      process.exit(0);
    }
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => { console.error('fatal:', err instanceof Error ? err.message : err); process.exit(1); });

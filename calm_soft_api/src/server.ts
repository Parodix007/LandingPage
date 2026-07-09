import 'dotenv/config';
import nodemailer from 'nodemailer';
import { loadConfig } from './config.js';
import { buildLogger } from './logger.js';
import { buildApp } from './app.js';
import { createFormTokenService } from './security/form-token.js';
import { createTurnstileVerifier } from './security/turnstile.js';
import { createSendBudget } from './security/send-budget.js';
import { createOutbox } from './outbox/store.js';
import { createMailer } from './mailer/mailer.js';
import { createOutboxWorker } from './outbox/worker.js';

async function main() {
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
    connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 10000,
  });

  const outbox = createOutbox(config.OUTBOX_DB_PATH);
  const mailer = createMailer({ transport, from: config.MAIL_FROM, teamTo: config.MAIL_TEAM_TO, logger });
  const outboxIntervalMs = 5000;
  const worker = createOutboxWorker({ outbox, mailer, maxAttempts: config.OUTBOX_MAX_ATTEMPTS, intervalMs: outboxIntervalMs, logger });

  let smtpReady = false;
  transport.verify()
    .then(() => { smtpReady = true; logger.info({ smtpHost: config.SMTP_HOST }, 'smtp verify ok'); })
    .catch((e) => logger.error({ err: e }, 'smtp verify failed'));

  const app = await buildApp({
    config, logger,
    formToken: createFormTokenService({ secret: config.FORM_TOKEN_SECRET, ttlMs: config.FORM_TOKEN_TTL_MS }),
    turnstile: createTurnstileVerifier({ secret: config.TURNSTILE_SECRET }),
    sendBudget: createSendBudget({ hourlyCap: config.SMTP_SEND_CAP_HOURLY, dailyCap: config.SMTP_SEND_CAP_DAILY }),
    enqueue: (s) => outbox.enqueue(s),
    readiness: async () => ({ ok: smtpReady }),
  });

  worker.start();
  logger.info({ intervalMs: outboxIntervalMs }, 'outbox worker started');
  await app.listen({ host: config.HOST, port: config.PORT });
  logger.info({ port: config.PORT }, 'calm_soft_api listening');

  const shutdown = async (sig: string) => {
    logger.info({ sig }, 'shutting down');
    try {
      await app.close();
      logger.info('http server closed');
      await worker.stop();
      logger.info('outbox worker stopped');
      transport.close();
      logger.info('smtp transport closed');
      outbox.close();
      logger.info('outbox closed');
    } finally {
      await new Promise<void>((resolve) => logger.flush(() => resolve()));
      process.exit(0);
    }
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => { console.error('fatal:', err instanceof Error ? err.message : err); process.exit(1); });

import { pino, stdSerializers, destination, type Logger } from 'pino';

export const REDACT_PATHS = ['req.headers.authorization', 'req.headers.cookie'];

export function buildLogger(nodeEnv: string, level: string = 'info', pretty: boolean = false): Logger {
  const resolved = nodeEnv === 'test' ? 'silent' : level;
  const base = {
    level: resolved,
    redact: { paths: REDACT_PATHS, censor: '[redacted]' },
    serializers: { err: stdSerializers.err },
  };
  // All real logging goes to stderr (fd 2): Hostinger's runtime log panel surfaces
  // stderr, not stdout, so app logs are only visible there. Non-pretty emits structured
  // NDJSON (machine-parseable for shipping/alerting); pino-pretty (worker-thread
  // transport) only when explicitly enabled. The silent/test path stays a plain logger
  // — no fd handle and no pino-pretty worker thread to dangle in Vitest.
  if (resolved === 'silent') return pino(base);
  if (!pretty) return pino(base, destination({ dest: 2, sync: false }));
  return pino({
    ...base,
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname', destination: 2 },
    },
  });
}

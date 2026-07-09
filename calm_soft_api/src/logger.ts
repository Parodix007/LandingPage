import { pino, stdSerializers, type Logger } from 'pino';

export const REDACT_PATHS = ['req.headers.authorization', 'req.headers.cookie'];

export function buildLogger(nodeEnv: string, level: string = 'info', pretty: boolean = false): Logger {
  const resolved = nodeEnv === 'test' ? 'silent' : level;
  const base = {
    level: resolved,
    redact: { paths: REDACT_PATHS, censor: '[redacted]' },
    serializers: { err: stdSerializers.err },
  };
  // Structured NDJSON by default (machine-parseable for log shipping/alerting).
  // pino-pretty (worker-thread transport) only when explicitly enabled — never on the
  // silent/test path, whose transport would dangle a worker thread in Vitest.
  if (resolved === 'silent' || !pretty) return pino(base);
  return pino({
    ...base,
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
    },
  });
}

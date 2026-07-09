import { pino, multistream, stdSerializers, type Logger } from 'pino';
import pretty from 'pino-pretty';

export const REDACT_PATHS = ['req.headers.authorization', 'req.headers.cookie'];

export function buildLogger(nodeEnv: string, level: string = 'info', usePretty: boolean = false): Logger {
  const resolved = nodeEnv === 'test' ? 'silent' : level;
  const base = {
    level: resolved,
    redact: { paths: REDACT_PATHS, censor: '[redacted]' },
    serializers: { err: stdSerializers.err },
  };
  if (resolved === 'silent') return pino(base);

  // Pretty (dev only): one chronological stream in the terminal.
  if (usePretty) {
    const stream = pretty({
      colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname',
      destination: process.stdout, sync: true,
    });
    return pino(base, stream);
  }

  // Prod NDJSON: info/debug/trace -> stdout ("Runtime logs" / Info in Hostinger's panel),
  // warn/error/fatal -> stderr ("stderr.log" / Error). Synchronous JS-level stream writes
  // flush before Hostinger recycles the process on each deploy -- that sync flush (not the
  // stream choice) is what makes lines appear; the old "only stderr is captured" note was a
  // misdiagnosis (real cause: pino's async sonic-boom buffer dropped on recycle + reading the
  // wrong sink). Hostinger captures BOTH stdout and stderr as separate severity buckets.
  return pino(base, multistream([
    { level: 'trace', stream: process.stdout },
    { level: 'warn', stream: process.stderr },
  ], { dedupe: true }));
}

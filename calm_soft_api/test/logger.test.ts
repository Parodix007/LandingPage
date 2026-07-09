import { describe, it, expect } from 'vitest';
import { pino } from 'pino';
import { buildLogger, REDACT_PATHS } from '../src/logger.js';

describe('logger redaction', () => {
  it('redacts credential headers only', () => {
    for (const p of ['req.headers.authorization', 'req.headers.cookie'])
      expect(REDACT_PATHS).toContain(p);
  });

  it('does NOT redact the body / PII (logged by design)', () => {
    expect(REDACT_PATHS).not.toContain('req.body');
    expect(REDACT_PATHS).not.toContain('req.headers["x-forwarded-for"]');
  });

  it('builds a logger', () => {
    expect(typeof buildLogger('test').info).toBe('function');
  });

  it('ignores pretty=true on the test/silent path (no worker thread)', () => {
    expect(typeof buildLogger('test', 'info', true).info).toBe('function');
  });

  it('redacts credential headers but NOT the body (PII logged by design)', () => {
    const lines: string[] = [];
    const stream = { write: (s: string) => { lines.push(s); } };
    const log = pino({ redact: { paths: REDACT_PATHS, censor: '[redacted]' } }, stream as any);
    log.info(
      { req: { headers: { authorization: 'Bearer secret', cookie: 'sid=abc' }, body: { email: 'a@b.pl', message: 'hi' } } },
      'x',
    );
    const out = JSON.parse(lines[0]!);
    expect(out.req.headers.authorization).toBe('[redacted]');
    expect(out.req.headers.cookie).toBe('[redacted]');
    expect(out.req.body.email).toBe('a@b.pl');
    expect(out.req.body.message).toBe('hi');
  });
});

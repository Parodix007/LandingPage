import { describe, it, expect } from 'vitest';
import { createFormTokenService } from '../src/security/form-token.js';

describe('form token', () => {
  it('checks ok and is single-use only after consume', () => {
    const svc = createFormTokenService({ secret: 'x'.repeat(32), ttlMs: 60000 });
    const t = svc.issue();
    const r = svc.check(t);
    expect(r.ok).toBe(true);
    if (r.ok) svc.consume(r.nonce);
    expect(svc.check(t)).toEqual({ ok: false, reason: 'reused' });
  });
  it('check is non-mutating: repeated check without consume stays ok', () => {
    const svc = createFormTokenService({ secret: 'x'.repeat(32), ttlMs: 60000 });
    const t = svc.issue();
    expect(svc.check(t).ok).toBe(true);
    expect(svc.check(t).ok).toBe(true);
  });
  it('rejects a tampered token', () => {
    const svc = createFormTokenService({ secret: 'x'.repeat(32), ttlMs: 60000 });
    const t = svc.issue();
    expect(svc.check(t.slice(0, -2) + 'ab').ok).toBe(false);
  });
  it('rejects an expired token', () => {
    let now = 1000;
    const svc = createFormTokenService({ secret: 'x'.repeat(32), ttlMs: 100, now: () => now });
    const t = svc.issue();
    now = 2000;
    expect(svc.check(t)).toEqual({ ok: false, reason: 'expired' });
  });
  it('rejects malformed input', () => {
    const svc = createFormTokenService({ secret: 'x'.repeat(32), ttlMs: 60000 });
    expect(svc.check('garbage').ok).toBe(false);
  });
});

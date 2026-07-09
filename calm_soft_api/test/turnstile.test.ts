import { describe, it, expect, vi } from 'vitest';
import { createTurnstileVerifier } from '../src/security/turnstile.js';

const okFetch = async () => ({ ok: true, json: async () => ({ success: true }) }) as any;
const badFetch = async () => ({ ok: true, json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }) }) as any;

describe('turnstile verifier (fail-closed)', () => {
  it('passes on success:true', async () => {
    const v = createTurnstileVerifier({ secret: 's', fetchImpl: okFetch });
    expect(await v.verify('tok', '1.2.3.4')).toEqual({ ok: true });
  });
  it('fails on success:false', async () => {
    const v = createTurnstileVerifier({ secret: 's', fetchImpl: badFetch });
    expect((await v.verify('tok')).ok).toBe(false);
  });
  it('fails closed on network error', async () => {
    const v = createTurnstileVerifier({ secret: 's', fetchImpl: async () => { throw new Error('net'); } });
    expect(await v.verify('tok')).toMatchObject({ ok: false, reason: 'verify-error' });
  });
  it('fails closed on empty token without calling fetch', async () => {
    const spy = vi.fn();
    const v = createTurnstileVerifier({ secret: 's', fetchImpl: spy as any });
    expect((await v.verify('')).ok).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });
});

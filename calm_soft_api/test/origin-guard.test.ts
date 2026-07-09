import { describe, it, expect } from 'vitest';
import { checkOrigin } from '../src/security/origin-guard.js';

const allowed = ['https://calmsoft.pro', 'https://www.calmsoft.pro'];

describe('checkOrigin', () => {
  it('accepts an allowlisted Origin with JSON content-type', () => {
    expect(checkOrigin({ origin: 'https://calmsoft.pro', contentType: 'application/json' }, allowed))
      .toEqual({ ok: true, status: 200, message: 'ok' });
  });
  it('accepts application/json with charset', () => {
    expect(checkOrigin({ origin: 'https://calmsoft.pro', contentType: 'application/json; charset=utf-8' }, allowed).ok).toBe(true);
  });
  it('rejects a non-JSON content-type with 415', () => {
    const r = checkOrigin({ origin: 'https://calmsoft.pro', contentType: 'text/plain' }, allowed);
    expect(r).toMatchObject({ ok: false, status: 415 });
  });
  it('rejects a missing Origin with 403 (falls back to Referer)', () => {
    expect(checkOrigin({ contentType: 'application/json' }, allowed)).toMatchObject({ ok: false, status: 403 });
  });
  it('accepts when Referer matches and Origin absent', () => {
    expect(checkOrigin({ referer: 'https://calmsoft.pro/#contact', contentType: 'application/json' }, allowed).ok).toBe(true);
  });
  it('rejects a foreign Origin with 403', () => {
    expect(checkOrigin({ origin: 'https://evil.example', contentType: 'application/json' }, allowed)).toMatchObject({ ok: false, status: 403 });
  });
});

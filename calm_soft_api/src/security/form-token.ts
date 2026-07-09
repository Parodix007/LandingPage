import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export interface FormTokenService {
  issue(): string;
  check(token: string): { ok: true; nonce: string } | { ok: false; reason: string };
  consume(nonce: string): void;
}

const b64u = (b: Buffer) => b.toString('base64url');

export function createFormTokenService(opts: {
  secret: string; ttlMs: number; now?: () => number;
}): FormTokenService {
  const now = opts.now ?? Date.now;
  const used = new Map<string, number>();

  const sign = (payload: string) => b64u(createHmac('sha256', opts.secret).update(payload).digest());
  const sweep = (t: number) => { for (const [k, exp] of used) if (exp <= t) used.delete(k); };

  return {
    issue() {
      const issuedAt = now();
      const nonce = b64u(randomBytes(16));
      const payload = `${b64u(Buffer.from(String(issuedAt)))}.${nonce}`;
      return `${payload}.${sign(payload)}`;
    },
    check(token) {
      if (typeof token !== 'string') return { ok: false, reason: 'malformed' };
      const parts = token.split('.');
      if (parts.length !== 3) return { ok: false, reason: 'malformed' };
      const [issuedB64, nonce, mac] = parts as [string, string, string];
      const payload = `${issuedB64}.${nonce}`;
      const expected = sign(payload);
      const a = Buffer.from(mac); const b = Buffer.from(expected);
      if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: 'bad-signature' };
      const issuedAt = Number(Buffer.from(issuedB64, 'base64url').toString());
      if (!Number.isFinite(issuedAt)) return { ok: false, reason: 'malformed' };
      const t = now();
      if (t - issuedAt > opts.ttlMs || issuedAt > t) return { ok: false, reason: 'expired' };
      sweep(t);
      if (used.has(nonce)) return { ok: false, reason: 'reused' };
      return { ok: true, nonce };
    },
    consume(nonce) {
      // Keep the used-marker until at least the token's own expiry so a replay within
      // the validity window is always caught; the sweep in check() reclaims it afterwards.
      used.set(nonce, now() + opts.ttlMs);
    },
  };
}

export interface TurnstileVerifier {
  verify(token: string, remoteIp?: string): Promise<{ ok: boolean; reason?: string }>;
}

const ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export function createTurnstileVerifier(opts: {
  secret: string; fetchImpl?: typeof fetch; timeoutMs?: number;
}): TurnstileVerifier {
  const doFetch = opts.fetchImpl ?? fetch;
  const timeoutMs = opts.timeoutMs ?? 4000;
  return {
    async verify(token, remoteIp) {
      if (!token || typeof token !== 'string') return { ok: false, reason: 'missing-token' };
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const body = new URLSearchParams({ secret: opts.secret, response: token });
        if (remoteIp) body.set('remoteip', remoteIp);
        const res = await doFetch(ENDPOINT, { method: 'POST', body, signal: controller.signal });
        if (!res.ok) return { ok: false, reason: 'verify-error' };
        const data = (await res.json()) as { success?: boolean };
        return data.success === true ? { ok: true } : { ok: false, reason: 'challenge-failed' };
      } catch {
        return { ok: false, reason: 'verify-error' };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

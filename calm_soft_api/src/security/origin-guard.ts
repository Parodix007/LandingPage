export interface OriginCheckInput { origin?: string; referer?: string; contentType?: string; }
export interface OriginCheckResult { ok: boolean; status: number; message: string; }

export function checkOrigin(input: OriginCheckInput, allowed: string[]): OriginCheckResult {
  const ct = (input.contentType ?? '').split(';')[0]?.trim().toLowerCase();
  if (ct !== 'application/json') return { ok: false, status: 415, message: 'Content-Type must be application/json' };

  if (input.origin) {
    return allowed.includes(input.origin)
      ? { ok: true, status: 200, message: 'ok' }
      : { ok: false, status: 403, message: 'Origin not allowed' };
  }
  if (input.referer) {
    const ok = allowed.some((a) => input.referer === a || input.referer!.startsWith(a + '/'));
    return ok ? { ok: true, status: 200, message: 'ok' } : { ok: false, status: 403, message: 'Referer not allowed' };
  }
  return { ok: false, status: 403, message: 'Missing Origin' };
}

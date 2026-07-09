import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildApp, type AppDeps } from '../src/app.js';
import { createFormTokenService } from '../src/security/form-token.js';
import { createSendBudget } from '../src/security/send-budget.js';
import type { Config } from '../src/config.js';

const config = {
  NODE_ENV: 'test', HOST: '0.0.0.0', PORT: 0, TRUST_PROXY_HOPS: 1,
  SMTP_HOST: 's', SMTP_PORT: 465, SMTP_USER: 'u', SMTP_PASS: 'p',
  MAIL_FROM: 'f@x', MAIL_TEAM_TO: 't@x',
  CORS_ORIGINS: ['https://calmsoft.pro'], SITE_DOMAIN: 'calmsoft.pro',
  FORM_TOKEN_SECRET: 'x'.repeat(32), FORM_TOKEN_TTL_MS: 600000, TURNSTILE_SECRET: 's',
  SMTP_SEND_CAP_HOURLY: 1000, SMTP_SEND_CAP_DAILY: 1000, OUTBOX_DB_PATH: ':memory:', OUTBOX_MAX_ATTEMPTS: 5,
} satisfies Config;

const H = { origin: 'https://calmsoft.pro', 'content-type': 'application/json' };

function makeDeps(over: Partial<AppDeps> = {}): { deps: AppDeps; enqueue: ReturnType<typeof vi.fn>; turnstileOk: { ok: boolean } } {
  const formToken = createFormTokenService({ secret: config.FORM_TOKEN_SECRET, ttlMs: config.FORM_TOKEN_TTL_MS });
  const enqueue = vi.fn(() => ({ id: 1 }));
  const turnstile = { verify: vi.fn(async () => ({ ok: true })) };
  const deps: AppDeps = {
    config, formToken, turnstile,
    sendBudget: createSendBudget({ hourlyCap: 1000, dailyCap: 1000 }),
    enqueue, readiness: async () => ({ ok: true }), ...over,
  };
  return { deps, enqueue, turnstileOk: { ok: true } };
}

async function validBody(app: Awaited<ReturnType<typeof buildApp>>, deps: AppDeps) {
  const tok = await app.inject({ method: 'GET', url: '/api/contact/token', headers: H });
  return {
    name: 'Anna', email: 'anna@example.com', service: 'web', meeting: 'online',
    message: 'Hello', discover: true, handover: false,
    formToken: tok.json().token, turnstileToken: 'tok',
  };
}

describe('security controls (CI gate)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let deps: AppDeps; let enqueue: ReturnType<typeof vi.fn>;

  beforeEach(async () => { ({ deps, enqueue } = makeDeps()); app = await buildApp(deps); });

  it('accepts a valid submission and enqueues exactly once', async () => {
    const body = await validBody(app, deps);
    const r = await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: body });
    expect(r.statusCode).toBe(200);
    expect(enqueue).toHaveBeenCalledTimes(1);
  });
  it('rejects malformed email with 400', async () => {
    const body = { ...(await validBody(app, deps)), email: 'a@' };
    expect((await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: body })).statusCode).toBe(400);
  });
  it('rejects an extra property with 400 (additionalProperties:false)', async () => {
    const body = { ...(await validBody(app, deps)), surprise: 'x' };
    expect((await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: body })).statusCode).toBe(400);
  });
  it('rejects a CRLF payload in email with 400', async () => {
    const body = { ...(await validBody(app, deps)), email: 'a@b.com\r\nBcc: v@evil' };
    expect((await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: body })).statusCode).toBe(400);
  });
  it('rejects an email without a TLD dot (a@b) with 400', async () => {
    const body = { ...(await validBody(app, deps)), email: 'a@b' };
    expect((await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: body })).statusCode).toBe(400);
  });
  it('rejects an email with a 1-char TLD with 400', async () => {
    const body = { ...(await validBody(app, deps)), email: 'a@b.c' };
    expect((await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: body })).statusCode).toBe(400);
  });
  it('accepts a multi-label domain email', async () => {
    const body = { ...(await validBody(app, deps)), email: 'x@y.co.uk' };
    const r = await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: body });
    expect(r.statusCode).toBe(200);
    expect(enqueue).toHaveBeenCalledTimes(1);
  });
  it('accepts an international phone (+48 123 456 789)', async () => {
    const body = { ...(await validBody(app, deps)), phone: '+48 123 456 789' };
    const r = await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: body });
    expect(r.statusCode).toBe(200);
    expect(enqueue).toHaveBeenCalledTimes(1);
  });
  it('accepts a bare national phone (123456789)', async () => {
    const body = { ...(await validBody(app, deps)), phone: '123456789' };
    const r = await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: body });
    expect(r.statusCode).toBe(200);
    expect(enqueue).toHaveBeenCalledTimes(1);
  });
  it('accepts an empty phone string (field is optional)', async () => {
    const body = { ...(await validBody(app, deps)), phone: '' };
    const r = await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: body });
    expect(r.statusCode).toBe(200);
    expect(enqueue).toHaveBeenCalledTimes(1);
  });
  it('rejects a non-numeric phone with 400', async () => {
    const body = { ...(await validBody(app, deps)), phone: 'not-a-phone' };
    expect((await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: body })).statusCode).toBe(400);
  });
  it('rejects an html/script phone payload with 400', async () => {
    const body = { ...(await validBody(app, deps)), phone: '<script>alert(1)</script>' };
    expect((await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: body })).statusCode).toBe(400);
  });
  it('rejects a too-short phone (5 digits) with 400', async () => {
    const body = { ...(await validBody(app, deps)), phone: '12345' };
    expect((await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: body })).statusCode).toBe(400);
  });
  it('rejects a too-long phone (16 digits) with 400', async () => {
    const body = { ...(await validBody(app, deps)), phone: '1234567890123456' };
    expect((await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: body })).statusCode).toBe(400);
  });
  it('honeypot: filled website returns fake 200 and enqueues 0', async () => {
    const body = { ...(await validBody(app, deps)), website: 'bot' };
    const r = await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: body });
    expect(r.statusCode).toBe(200); expect(enqueue).not.toHaveBeenCalled();
  });
  it('rejects a disallowed Origin with 403', async () => {
    const body = await validBody(app, deps);
    const r = await app.inject({ method: 'POST', url: '/api/contact', headers: { ...H, origin: 'https://evil.example' }, payload: body });
    expect(r.statusCode).toBe(403);
  });
  it('rejects a non-JSON content-type with 415', async () => {
    const r = await app.inject({ method: 'POST', url: '/api/contact', headers: { origin: 'https://calmsoft.pro', 'content-type': 'text/plain' }, payload: 'x' });
    expect(r.statusCode).toBe(415);
  });
  it('rejects a reused form token with 403', async () => {
    const body = await validBody(app, deps);
    await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: body });
    const r = await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: body });
    expect(r.statusCode).toBe(403);
  });
  it('rejects a failed Turnstile with 403 (fail-closed)', async () => {
    ({ deps, enqueue } = makeDeps({ turnstile: { verify: vi.fn(async () => ({ ok: false, reason: 'x' })) } }));
    app = await buildApp(deps);
    const r = await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: await validBody(app, deps) });
    expect(r.statusCode).toBe(403); expect(enqueue).not.toHaveBeenCalled();
  });
  it('over-budget returns 200 without enqueueing', async () => {
    ({ deps, enqueue } = makeDeps({ sendBudget: createSendBudget({ hourlyCap: 0, dailyCap: 0 }) }));
    app = await buildApp(deps);
    const r = await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: await validBody(app, deps) });
    expect(r.statusCode).toBe(200); expect(enqueue).not.toHaveBeenCalled();
  });
  it('rejects a body over 32 KB with 413', async () => {
    const body = { ...(await validBody(app, deps)), message: 'a'.repeat(33 * 1024) };
    expect((await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: body })).statusCode).toBe(413);
  });
  it('the 6th request in the window returns 429', async () => {
    const send = async () => app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: await validBody(app, deps) });
    const codes: number[] = [];
    for (let i = 0; i < 6; i++) codes.push((await send()).statusCode);
    expect(codes.filter((c) => c === 429).length).toBeGreaterThanOrEqual(1);
  });
  it('/health is ok and /ready reflects readiness', async () => {
    expect((await app.inject({ method: 'GET', url: '/health' })).json()).toEqual({ status: 'ok' });
    expect((await app.inject({ method: 'GET', url: '/ready' })).statusCode).toBe(200);
  });
  it('accepts a name containing a comma ("Doe, Jane")', async () => {
    const body = { ...(await validBody(app, deps)), name: 'Doe, Jane' };
    const r = await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: body });
    expect(r.statusCode).toBe(200);
    expect(enqueue).toHaveBeenCalledTimes(1);
  });
  it('/health is not rate-limited (probes never self-429)', async () => {
    for (let i = 0; i < 12; i++) {
      expect((await app.inject({ method: 'GET', url: '/health' })).statusCode).toBe(200);
    }
  });
  it('form-token and turnstile failures return an identical 403 body (no gate oracle)', async () => {
    const badTok = await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: { ...(await validBody(app, deps)), formToken: 'bad.tok.en' } });
    const { deps: deps2 } = makeDeps({ turnstile: { verify: vi.fn(async () => ({ ok: false, reason: 'x' })) } });
    const app2 = await buildApp(deps2);
    const badTs = await app2.inject({ method: 'POST', url: '/api/contact', headers: H, payload: await validBody(app2, deps2) });
    expect(badTok.statusCode).toBe(403);
    expect(badTs.statusCode).toBe(403);
    expect(badTok.json()).toEqual(badTs.json());
  });
});

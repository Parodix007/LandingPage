import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildApp, type AppDeps } from '../src/app.js';
import { createFormTokenService } from '../src/security/form-token.js';
import { createSendBudget } from '../src/security/send-budget.js';
import type { Config } from '../src/config.js';

const config = {
  NODE_ENV: 'test', HOST: '0.0.0.0', PORT: 0, TRUST_PROXY_HOPS: 1,
  SMTP_HOST: 's', SMTP_PORT: 465, SMTP_USER: 'u', SMTP_PASS: 'p',
  MAIL_FROM: 'f@x', MAIL_TEAM_TO: 't@x',
  CORS_ORIGINS: ['https://calmsoft.pro'],
  FORM_TOKEN_SECRET: 'x'.repeat(32), FORM_TOKEN_TTL_MS: 600000, TURNSTILE_SECRET: 's',
  SMTP_SEND_CAP_HOURLY: 1000, SMTP_SEND_CAP_DAILY: 1000,
} satisfies Config;

const H = { origin: 'https://calmsoft.pro', 'content-type': 'application/json' };

function makeDeps(over: Partial<AppDeps> = {}): {
  deps: AppDeps;
  sendMail: ReturnType<typeof vi.fn>;
  sendDetailsMail: ReturnType<typeof vi.fn>;
  turnstileOk: { ok: boolean };
} {
  const formToken = createFormTokenService({ secret: config.FORM_TOKEN_SECRET, ttlMs: config.FORM_TOKEN_TTL_MS });
  const sendMail = vi.fn(async () => {});
  const sendDetailsMail = vi.fn(async () => {});
  const turnstile = { verify: vi.fn(async () => ({ ok: true })) };
  const deps: AppDeps = {
    config, formToken, turnstile,
    sendBudget: createSendBudget({ hourlyCap: 1000, dailyCap: 1000 }),
    sendMail, sendDetailsMail, readiness: async () => ({ ok: true }), ...over,
  };
  return { deps, sendMail, sendDetailsMail, turnstileOk: { ok: true } };
}

async function validBody(app: Awaited<ReturnType<typeof buildApp>>, deps: AppDeps) {
  const tok = await app.inject({ method: 'GET', url: '/api/contact/token', headers: H });
  return {
    name: 'Anna', email: 'anna@example.com', message: 'Hello',
    formToken: tok.json().token, turnstileToken: 'tok',
  };
}

async function validDetailsBody(app: Awaited<ReturnType<typeof buildApp>>, deps: AppDeps) {
  const tok = await app.inject({ method: 'GET', url: '/api/contact/token', headers: H });
  return {
    name: 'Anna', email: 'anna@example.com', area: 'rescue', budget: '10-30k', phone: '+48 123 456 789',
    formToken: tok.json().token, turnstileToken: 'tok',
  };
}

describe('security controls (CI gate)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let deps: AppDeps; let sendMail: ReturnType<typeof vi.fn>; let sendDetailsMail: ReturnType<typeof vi.fn>;

  beforeEach(async () => { ({ deps, sendMail, sendDetailsMail } = makeDeps()); app = await buildApp(deps); });

  it('accepts a valid submission, sends exactly once, and awaits the send before replying', async () => {
    let sendResolved = false;
    const sendMailMock = vi.fn(async () => { await new Promise((r) => setTimeout(r, 5)); sendResolved = true; });
    ({ deps } = makeDeps({ sendMail: sendMailMock }));
    app = await buildApp(deps);
    const body = await validBody(app, deps);
    const r = await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: body });
    expect(r.statusCode).toBe(200);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendResolved).toBe(true);
  });
  it('sendMail failure returns 503, releases the budget, and does not burn the form token (retry with same token succeeds)', async () => {
    const sendMailMock = vi.fn(async () => {});
    sendMailMock.mockImplementationOnce(async () => { throw new Error('smtp down'); });
    ({ deps } = makeDeps({ sendMail: sendMailMock, sendBudget: createSendBudget({ hourlyCap: 1, dailyCap: 1 }) }));
    app = await buildApp(deps);
    const body = await validBody(app, deps);

    const r1 = await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: body });
    expect(r1.statusCode).toBe(503);
    expect(r1.headers['retry-after']).toBe('30');
    expect(sendMailMock).toHaveBeenCalledTimes(1);

    // Same formToken (never consumed on failure) + budget released by the 503 path: retry succeeds.
    // hourlyCap:1 makes this prove the release actually happened, not just a generous cap.
    const r2 = await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: body });
    expect(r2.statusCode).toBe(200);
    expect(sendMailMock).toHaveBeenCalledTimes(2);
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
    expect(sendMail).toHaveBeenCalledTimes(1);
  });
  it('honeypot: filled website returns fake 200 and sends 0', async () => {
    const body = { ...(await validBody(app, deps)), website: 'bot' };
    const r = await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: body });
    expect(r.statusCode).toBe(200); expect(sendMail).not.toHaveBeenCalled();
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
    ({ deps, sendMail } = makeDeps({ turnstile: { verify: vi.fn(async () => ({ ok: false, reason: 'x' })) } }));
    app = await buildApp(deps);
    const r = await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: await validBody(app, deps) });
    expect(r.statusCode).toBe(403); expect(sendMail).not.toHaveBeenCalled();
  });
  it('over-budget returns 200 without sending', async () => {
    ({ deps, sendMail } = makeDeps({ sendBudget: createSendBudget({ hourlyCap: 0, dailyCap: 0 }) }));
    app = await buildApp(deps);
    const r = await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: await validBody(app, deps) });
    expect(r.statusCode).toBe(200); expect(sendMail).not.toHaveBeenCalled();
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
    expect(sendMail).toHaveBeenCalledTimes(1);
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

  it('accepts a legacy full payload (transitional keys) with 200, and the sent Submission carries none of them', async () => {
    const body = {
      ...(await validBody(app, deps)),
      company: 'Acme Inc', phone: '+48 123 456 789', service: 'web', meeting: 'online',
      discover: true, handover: false,
    };
    const r = await app.inject({ method: 'POST', url: '/api/contact', headers: H, payload: body });
    expect(r.statusCode).toBe(200);
    expect(sendMail).toHaveBeenCalledTimes(1);
    const sent = sendMail.mock.calls[0]![0];
    expect(sent).not.toHaveProperty('company');
    expect(sent).not.toHaveProperty('phone');
    expect(sent).not.toHaveProperty('service');
    expect(sent).not.toHaveProperty('meeting');
    expect(sent).not.toHaveProperty('discover');
    expect(sent).not.toHaveProperty('handover');
    expect(sent).toEqual({
      name: 'Anna', email: 'anna@example.com', message: 'Hello',
      submittedAt: sent.submittedAt, source: sent.source,
    });
  });
});

describe('POST /api/contact/details', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let deps: AppDeps; let sendDetailsMail: ReturnType<typeof vi.fn>;

  beforeEach(async () => { ({ deps, sendDetailsMail } = makeDeps()); app = await buildApp(deps); });

  it('valid full body: 200, sendDetailsMail called with the submitted ids', async () => {
    const body = await validDetailsBody(app, deps);
    const r = await app.inject({ method: 'POST', url: '/api/contact/details', headers: H, payload: body });
    expect(r.statusCode).toBe(200);
    expect(sendDetailsMail).toHaveBeenCalledTimes(1);
    const sent = sendDetailsMail.mock.calls[0]![0];
    expect(sent.name).toBe('Anna');
    expect(sent.email).toBe('anna@example.com');
    expect(sent.area).toBe('rescue');
    expect(sent.budget).toBe('10-30k');
    expect(sent.phone).toBe('+48 123 456 789');
  });
  it('valid minimal body (no area/budget/phone): 200 with empty-string fields', async () => {
    const { area, budget, phone, ...body } = await validDetailsBody(app, deps);
    const r = await app.inject({ method: 'POST', url: '/api/contact/details', headers: H, payload: body });
    expect(r.statusCode).toBe(200);
    expect(sendDetailsMail).toHaveBeenCalledTimes(1);
    const sent = sendDetailsMail.mock.calls[0]![0];
    expect(sent.area).toBe('');
    expect(sent.budget).toBe('');
    expect(sent.phone).toBe('');
  });
  it('rejects an extra property with 400 (additionalProperties:false)', async () => {
    const body = { ...(await validDetailsBody(app, deps)), surprise: 'x' };
    expect((await app.inject({ method: 'POST', url: '/api/contact/details', headers: H, payload: body })).statusCode).toBe(400);
  });
  it('rejects a bad area enum value with 400', async () => {
    const body = { ...(await validDetailsBody(app, deps)), area: 'not-a-real-area' };
    expect((await app.inject({ method: 'POST', url: '/api/contact/details', headers: H, payload: body })).statusCode).toBe(400);
  });
  it('rejects a bad budget enum value with 400', async () => {
    const body = { ...(await validDetailsBody(app, deps)), budget: 'not-a-real-budget' };
    expect((await app.inject({ method: 'POST', url: '/api/contact/details', headers: H, payload: body })).statusCode).toBe(400);
  });
  // Moved/adapted from the old step-1 phone-pattern matrix (phone now lives on step 2 only).
  it('accepts an international phone (+48 123 456 789)', async () => {
    const body = { ...(await validDetailsBody(app, deps)), phone: '+48 123 456 789' };
    const r = await app.inject({ method: 'POST', url: '/api/contact/details', headers: H, payload: body });
    expect(r.statusCode).toBe(200);
    expect(sendDetailsMail).toHaveBeenCalledTimes(1);
  });
  it('accepts a bare national phone (123456789)', async () => {
    const body = { ...(await validDetailsBody(app, deps)), phone: '123456789' };
    const r = await app.inject({ method: 'POST', url: '/api/contact/details', headers: H, payload: body });
    expect(r.statusCode).toBe(200);
    expect(sendDetailsMail).toHaveBeenCalledTimes(1);
  });
  it('accepts an empty phone string (field is optional)', async () => {
    const body = { ...(await validDetailsBody(app, deps)), phone: '' };
    const r = await app.inject({ method: 'POST', url: '/api/contact/details', headers: H, payload: body });
    expect(r.statusCode).toBe(200);
    expect(sendDetailsMail).toHaveBeenCalledTimes(1);
  });
  it('rejects a non-numeric phone with 400', async () => {
    const body = { ...(await validDetailsBody(app, deps)), phone: 'not-a-phone' };
    expect((await app.inject({ method: 'POST', url: '/api/contact/details', headers: H, payload: body })).statusCode).toBe(400);
  });
  it('rejects an html/script phone payload with 400', async () => {
    const body = { ...(await validDetailsBody(app, deps)), phone: '<script>alert(1)</script>' };
    expect((await app.inject({ method: 'POST', url: '/api/contact/details', headers: H, payload: body })).statusCode).toBe(400);
  });
  it('rejects a too-short phone (5 digits) with 400', async () => {
    const body = { ...(await validDetailsBody(app, deps)), phone: '12345' };
    expect((await app.inject({ method: 'POST', url: '/api/contact/details', headers: H, payload: body })).statusCode).toBe(400);
  });
  it('rejects a too-long phone (16 digits) with 400', async () => {
    const body = { ...(await validDetailsBody(app, deps)), phone: '1234567890123456' };
    expect((await app.inject({ method: 'POST', url: '/api/contact/details', headers: H, payload: body })).statusCode).toBe(400);
  });
  it('honeypot: filled website returns fake 200 and sends 0', async () => {
    const body = { ...(await validDetailsBody(app, deps)), website: 'bot' };
    const r = await app.inject({ method: 'POST', url: '/api/contact/details', headers: H, payload: body });
    expect(r.statusCode).toBe(200); expect(sendDetailsMail).not.toHaveBeenCalled();
  });
  it('rejects a bad form token with 403', async () => {
    const body = { ...(await validDetailsBody(app, deps)), formToken: 'bad.tok.en' };
    const r = await app.inject({ method: 'POST', url: '/api/contact/details', headers: H, payload: body });
    expect(r.statusCode).toBe(403);
  });
  it('rejects a failed Turnstile with 403 (parity with token failure)', async () => {
    ({ deps, sendDetailsMail } = makeDeps({ turnstile: { verify: vi.fn(async () => ({ ok: false, reason: 'x' })) } }));
    app = await buildApp(deps);
    const r = await app.inject({ method: 'POST', url: '/api/contact/details', headers: H, payload: await validDetailsBody(app, deps) });
    expect(r.statusCode).toBe(403); expect(sendDetailsMail).not.toHaveBeenCalled();
  });
  it('rejects a reused form token with 403', async () => {
    const body = await validDetailsBody(app, deps);
    await app.inject({ method: 'POST', url: '/api/contact/details', headers: H, payload: body });
    const r = await app.inject({ method: 'POST', url: '/api/contact/details', headers: H, payload: body });
    expect(r.statusCode).toBe(403);
  });
  it('rejects a disallowed Origin with 403', async () => {
    const body = await validDetailsBody(app, deps);
    const r = await app.inject({ method: 'POST', url: '/api/contact/details', headers: { ...H, origin: 'https://evil.example' }, payload: body });
    expect(r.statusCode).toBe(403);
  });
  it('over-budget returns 200 without sending (identical behavior to step 1)', async () => {
    ({ deps, sendDetailsMail } = makeDeps({ sendBudget: createSendBudget({ hourlyCap: 0, dailyCap: 0 }) }));
    app = await buildApp(deps);
    const r = await app.inject({ method: 'POST', url: '/api/contact/details', headers: H, payload: await validDetailsBody(app, deps) });
    expect(r.statusCode).toBe(200); expect(sendDetailsMail).not.toHaveBeenCalled();
  });
  it('sendDetailsMail failure returns 503, releases the budget, and does not burn the form token (retry succeeds)', async () => {
    const sendDetailsMailMock = vi.fn(async () => {});
    sendDetailsMailMock.mockImplementationOnce(async () => { throw new Error('smtp down'); });
    ({ deps } = makeDeps({ sendDetailsMail: sendDetailsMailMock, sendBudget: createSendBudget({ hourlyCap: 1, dailyCap: 1 }) }));
    app = await buildApp(deps);
    const body = await validDetailsBody(app, deps);

    const r1 = await app.inject({ method: 'POST', url: '/api/contact/details', headers: H, payload: body });
    expect(r1.statusCode).toBe(503);
    expect(r1.headers['retry-after']).toBe('30');
    expect(sendDetailsMailMock).toHaveBeenCalledTimes(1);

    const r2 = await app.inject({ method: 'POST', url: '/api/contact/details', headers: H, payload: body });
    expect(r2.statusCode).toBe(200);
    expect(sendDetailsMailMock).toHaveBeenCalledTimes(2);
  });
  it('rejects a body over 32 KB with 413', async () => {
    const body = { ...(await validDetailsBody(app, deps)), phone: '1'.repeat(33 * 1024) };
    expect((await app.inject({ method: 'POST', url: '/api/contact/details', headers: H, payload: body })).statusCode).toBe(413);
  });
  it('the 6th request in the window returns 429 (same rate limit as step 1)', async () => {
    const send = async () => app.inject({ method: 'POST', url: '/api/contact/details', headers: H, payload: await validDetailsBody(app, deps) });
    const codes: number[] = [];
    for (let i = 0; i < 6; i++) codes.push((await send()).statusCode);
    expect(codes.filter((c) => c === 429).length).toBeGreaterThanOrEqual(1);
  });
});

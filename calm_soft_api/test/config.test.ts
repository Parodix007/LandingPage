import { describe, it, expect } from 'vitest';
import { loadConfig } from '../src/config.js';

const base = {
  NODE_ENV: 'test', HOST: '0.0.0.0', PORT: '3000', TRUST_PROXY_HOPS: '1',
  SMTP_HOST: 'smtp', SMTP_PORT: '465', SMTP_USER: 'u', SMTP_PASS: 'p',
  MAIL_FROM: 'a@b', MAIL_TEAM_TO: 't@b',
  CORS_ORIGINS: 'https://calmsoft.pro, https://www.calmsoft.pro', SITE_DOMAIN: 'calmsoft.pro',
  FORM_TOKEN_SECRET: 'x'.repeat(32), FORM_TOKEN_TTL_MS: '600000', TURNSTILE_SECRET: 's',
  SMTP_SEND_CAP_HOURLY: '60', SMTP_SEND_CAP_DAILY: '300',
};

describe('loadConfig', () => {
  it('parses and coerces a valid env', () => {
    const c = loadConfig(base);
    expect(c.PORT).toBe(3000);
    expect(c.CORS_ORIGINS).toEqual(['https://calmsoft.pro', 'https://www.calmsoft.pro']);
    expect(c.SMTP_SEND_CAP_DAILY).toBe(300);
  });
  it('throws naming the missing var, without printing its value', () => {
    const { SMTP_PASS, ...missing } = base;
    expect(() => loadConfig(missing)).toThrow(/SMTP_PASS/);
  });
  it('rejects a too-short FORM_TOKEN_SECRET', () => {
    expect(() => loadConfig({ ...base, FORM_TOKEN_SECRET: 'short' })).toThrow(/FORM_TOKEN_SECRET/);
  });
  it('rejects TRUST_PROXY_HOPS below 1', () => {
    expect(() => loadConfig({ ...base, TRUST_PROXY_HOPS: '0' })).toThrow(/TRUST_PROXY_HOPS/);
  });
  it('defaults LOG_LEVEL to info when unset', () => {
    expect(loadConfig(base).LOG_LEVEL).toBe('info');
  });
  it('accepts a valid LOG_LEVEL', () => {
    expect(loadConfig({ ...base, LOG_LEVEL: 'debug' }).LOG_LEVEL).toBe('debug');
  });
  it('rejects an invalid LOG_LEVEL', () => {
    expect(() => loadConfig({ ...base, LOG_LEVEL: 'bogus' })).toThrow(/LOG_LEVEL/);
  });
  it('defaults LOG_PRETTY to off outside development', () => {
    expect(loadConfig(base).LOG_PRETTY).toBe(false);
  });
  it('defaults LOG_PRETTY to on in development', () => {
    expect(loadConfig({ ...base, NODE_ENV: 'development' }).LOG_PRETTY).toBe(true);
  });
  it('accepts LOG_PRETTY=true', () => {
    expect(loadConfig({ ...base, LOG_PRETTY: 'true' }).LOG_PRETTY).toBe(true);
  });
  it('accepts LOG_PRETTY=false', () => {
    expect(loadConfig({ ...base, LOG_PRETTY: 'false' }).LOG_PRETTY).toBe(false);
  });
  it('rejects an invalid LOG_PRETTY', () => {
    expect(() => loadConfig({ ...base, LOG_PRETTY: 'bogus' })).toThrow(/LOG_PRETTY/);
  });
});

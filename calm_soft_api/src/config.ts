export interface Config {
  NODE_ENV: 'development' | 'production' | 'test';
  LOG_LEVEL: string;
  LOG_PRETTY: boolean;
  HOST: string; PORT: number; TRUST_PROXY_HOPS: number;
  SMTP_HOST: string; SMTP_PORT: number; SMTP_USER: string; SMTP_PASS: string;
  MAIL_FROM: string; MAIL_TEAM_TO: string;
  CORS_ORIGINS: string[]; SITE_DOMAIN: string;
  FORM_TOKEN_SECRET: string; FORM_TOKEN_TTL_MS: number;
  TURNSTILE_SECRET: string;
  SMTP_SEND_CAP_HOURLY: number; SMTP_SEND_CAP_DAILY: number;
  OUTBOX_DB_PATH: string; OUTBOX_MAX_ATTEMPTS: number;
}

type Env = Record<string, string | undefined>;

function str(env: Env, key: string): string {
  const v = env[key];
  if (v === undefined || v.trim() === '') throw new Error(`Missing required env var: ${key}`);
  return v.trim();
}
function int(env: Env, key: string): number {
  const v = str(env, key);
  const n = Number(v);
  if (!Number.isInteger(n)) throw new Error(`Env var ${key} must be an integer`);
  return n;
}
function boolOpt(env: Env, key: string, dflt: boolean): boolean {
  const v = env[key];
  if (v === undefined || v.trim() === '') return dflt;
  const t = v.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(t)) return true;
  if (['0', 'false', 'no', 'off'].includes(t)) return false;
  throw new Error(`Env var ${key} must be a boolean (true/false)`);
}

export function loadConfig(env: Env = process.env): Config {
  const nodeEnv = (env.NODE_ENV ?? 'development') as Config['NODE_ENV'];
  const secret = str(env, 'FORM_TOKEN_SECRET');
  if (secret.length < 32) throw new Error('Env var FORM_TOKEN_SECRET must be at least 32 chars');
  const trustProxyHops = int(env, 'TRUST_PROXY_HOPS');
  if (trustProxyHops < 1) throw new Error('Env var TRUST_PROXY_HOPS must be an integer >= 1');
  const PINO_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'];
  const logLevel = env.LOG_LEVEL?.trim() || 'info';
  if (!PINO_LEVELS.includes(logLevel))
    throw new Error(`Env var LOG_LEVEL must be one of: ${PINO_LEVELS.join(', ')}`);
  const logPretty = boolOpt(env, 'LOG_PRETTY', nodeEnv === 'development');
  return {
    NODE_ENV: nodeEnv,
    LOG_LEVEL: logLevel,
    LOG_PRETTY: logPretty,
    HOST: env.HOST?.trim() || '0.0.0.0',
    PORT: int(env, 'PORT'),
    TRUST_PROXY_HOPS: trustProxyHops,
    SMTP_HOST: str(env, 'SMTP_HOST'), SMTP_PORT: int(env, 'SMTP_PORT'),
    SMTP_USER: str(env, 'SMTP_USER'), SMTP_PASS: str(env, 'SMTP_PASS'),
    MAIL_FROM: str(env, 'MAIL_FROM'), MAIL_TEAM_TO: str(env, 'MAIL_TEAM_TO'),
    CORS_ORIGINS: str(env, 'CORS_ORIGINS').split(',').map((s) => s.trim()).filter(Boolean),
    SITE_DOMAIN: str(env, 'SITE_DOMAIN'),
    FORM_TOKEN_SECRET: secret, FORM_TOKEN_TTL_MS: int(env, 'FORM_TOKEN_TTL_MS'),
    TURNSTILE_SECRET: str(env, 'TURNSTILE_SECRET'),
    SMTP_SEND_CAP_HOURLY: int(env, 'SMTP_SEND_CAP_HOURLY'),
    SMTP_SEND_CAP_DAILY: int(env, 'SMTP_SEND_CAP_DAILY'),
    OUTBOX_DB_PATH: env.OUTBOX_DB_PATH?.trim() || 'data/outbox.db',
    OUTBOX_MAX_ATTEMPTS: int(env, 'OUTBOX_MAX_ATTEMPTS'),
  };
}

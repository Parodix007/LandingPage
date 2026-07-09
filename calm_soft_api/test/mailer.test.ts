import { describe, it, expect, vi } from 'vitest';
import { createMailer } from '../src/mailer/mailer.js';
import type { Submission } from '../src/mailer/mailer.js';

const sub = (over: Partial<Submission> = {}): Submission => ({
  name: 'Anna Nowak', email: 'anna@example.com', company: 'Acme', phone: '+48 111',
  service: 'web', meeting: 'online', discover: true, handover: false,
  message: 'Line1\nLine2', submittedAt: '2026-07-08 14:32', source: 'calmsoft.pro/#contact', ...over,
});

describe('mailer', () => {
  it('sends one internal email with From=MAIL_FROM and structured Reply-To', async () => {
    const sendMail = vi.fn(async () => ({}));
    const mailer = createMailer({ transport: { sendMail } as any, from: 'calm_soft <forms@calmsoft.pro>', teamTo: 'team@calmsoft.pro' });
    await mailer.sendInternal(sub());
    expect(sendMail).toHaveBeenCalledTimes(1);
    const msg = sendMail.mock.calls[0]![0];
    expect(msg.from).toBe('calm_soft <forms@calmsoft.pro>');
    expect(msg.to).toBe('team@calmsoft.pro');
    expect(msg.replyTo).toEqual({ name: 'Anna Nowak', address: 'anna@example.com' });
    expect(msg.subject).toContain('Web solutions');
  });
  it('strips control chars from subject-bound fields (defense in depth)', async () => {
    const sendMail = vi.fn(async () => ({}));
    const mailer = createMailer({ transport: { sendMail } as any, from: 'f@x', teamTo: 't@x' });
    await mailer.sendInternal(sub({ name: 'Bad\r\nBcc: victim@evil' }));
    const msg = sendMail.mock.calls[0]![0];
    expect(msg.subject).not.toMatch(/[\r\n]/);
    expect(String(msg.replyTo.name)).not.toMatch(/[\r\n]/);
    // The injected CRLF+Bcc must not smuggle in a second recipient: `to` stays pinned to teamTo.
    expect(msg.to).toBe('t@x');
  });
  it('preserves hyphens and dots in Reply-To (stripping is CR/LF/TAB only)', async () => {
    const sendMail = vi.fn(async () => ({}));
    const mailer = createMailer({ transport: { sendMail } as any, from: 'f@x', teamTo: 't@x' });
    await mailer.sendInternal(sub({ name: 'Anna-Maria Kowalska-Nowak', email: 'jan.k@nowak-consulting.pl' }));
    const msg = sendMail.mock.calls[0]![0];
    // Regression guard: the old strip class contained a literal '-' and turned
    // 'jan.k@nowak-consulting.pl' into 'jan.k@nowak consulting.pl' — an undeliverable Reply-To.
    expect(msg.replyTo).toEqual({ name: 'Anna-Maria Kowalska-Nowak', address: 'jan.k@nowak-consulting.pl' });
  });
});

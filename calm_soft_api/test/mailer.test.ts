import { describe, it, expect, vi } from 'vitest';
import { createMailer } from '../src/mailer/mailer.js';
import type { Submission, DetailsSubmission } from '../src/mailer/mailer.js';

const sub = (over: Partial<Submission> = {}): Submission => ({
  name: 'Anna Nowak', email: 'anna@example.com',
  message: 'Line1\nLine2', submittedAt: '2026-07-08 14:32', source: 'calmsoft.pro/#contact', ...over,
});

const details = (over: Partial<DetailsSubmission> = {}): DetailsSubmission => ({
  name: 'Anna Nowak', email: 'anna@example.com', area: 'rescue', budget: '10-30k', phone: '+48 111',
  submittedAt: '2026-07-08 14:32', source: 'calmsoft.pro/#contact-details', ...over,
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
    expect(msg.subject).toContain('New inquiry — ');
    expect(msg.subject).toContain('Anna Nowak');
    // No service label anywhere — the field no longer exists on the v2 Submission.
    expect(msg.subject).not.toMatch(/web solutions/i);
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

  describe('sendDetails', () => {
    it('sends one details email with subject containing name and email, and structured Reply-To', async () => {
      const sendMail = vi.fn(async () => ({}));
      const mailer = createMailer({ transport: { sendMail } as any, from: 'calm_soft <forms@calmsoft.pro>', teamTo: 'team@calmsoft.pro' });
      await mailer.sendDetails(details());
      expect(sendMail).toHaveBeenCalledTimes(1);
      const msg = sendMail.mock.calls[0]![0];
      expect(msg.from).toBe('calm_soft <forms@calmsoft.pro>');
      expect(msg.to).toBe('team@calmsoft.pro');
      expect(msg.replyTo).toEqual({ name: 'Anna Nowak', address: 'anna@example.com' });
      expect(msg.subject).toContain('Anna Nowak');
      expect(msg.subject).toContain('anna@example.com');
    });
    it('maps area/budget ids to labels before rendering (e.g. "rescue" -> "Legacy rescue")', async () => {
      const sendMail = vi.fn(async () => ({}));
      const mailer = createMailer({ transport: { sendMail } as any, from: 'f@x', teamTo: 't@x' });
      await mailer.sendDetails(details({ area: 'rescue', budget: '30-80k' }));
      const msg = sendMail.mock.calls[0]![0];
      expect(String(msg.html)).toContain('Legacy rescue');
      expect(String(msg.html)).toContain('30–80k');
      expect(String(msg.text)).toContain('Legacy rescue');
      expect(String(msg.text)).toContain('30–80k');
    });
    it('renders no area/budget/phone rows when the fields are empty strings', async () => {
      const sendMail = vi.fn(async () => ({}));
      const mailer = createMailer({ transport: { sendMail } as any, from: 'f@x', teamTo: 't@x' });
      await mailer.sendDetails(details({ area: '', budget: '', phone: '' }));
      const msg = sendMail.mock.calls[0]![0];
      expect(String(msg.text)).not.toMatch(/- Area:/);
      expect(String(msg.text)).not.toMatch(/- Budget:/);
      expect(String(msg.text)).not.toMatch(/- Phone:/);
    });
    it('strips control chars from subject-bound fields (defense in depth, CRLF-strip enforced)', async () => {
      const sendMail = vi.fn(async () => ({}));
      const mailer = createMailer({ transport: { sendMail } as any, from: 'f@x', teamTo: 't@x' });
      await mailer.sendDetails(details({ name: 'Bad\r\nBcc: victim@evil' }));
      const msg = sendMail.mock.calls[0]![0];
      expect(msg.subject).not.toMatch(/[\r\n]/);
      expect(String(msg.replyTo.name)).not.toMatch(/[\r\n]/);
      expect(msg.to).toBe('t@x');
    });
    it('preserves hyphens and dots in Reply-To (stripping is CR/LF/TAB only)', async () => {
      const sendMail = vi.fn(async () => ({}));
      const mailer = createMailer({ transport: { sendMail } as any, from: 'f@x', teamTo: 't@x' });
      await mailer.sendDetails(details({ name: 'Anna-Maria Kowalska-Nowak', email: 'jan.k@nowak-consulting.pl' }));
      const msg = sendMail.mock.calls[0]![0];
      expect(msg.replyTo).toEqual({ name: 'Anna-Maria Kowalska-Nowak', address: 'jan.k@nowak-consulting.pl' });
    });
  });
});

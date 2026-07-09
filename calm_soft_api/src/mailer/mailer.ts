import Handlebars from 'handlebars';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { Logger } from 'pino';

export interface Submission {
  name: string; email: string; company: string; phone: string;
  service: string; meeting: 'online' | 'onsite';
  discover: boolean; handover: boolean; message: string;
  submittedAt: string; source: string;
}

export interface Mailer { sendInternal(s: Submission): Promise<void>; }

const SERVICE_LABELS: Record<string, string> = {
  web: 'Web solutions', automation: 'Automation',
  core: 'Core systems & integrations', refactor: 'Refactor & rescue',
};
// Header-injection defense only: CR/LF/TAB. Nothing else — a wider class silently corrupts
// legitimate values (a literal '-' here once broke Reply-To for hyphenated domains).
const stripCtrl = (v: string) => v.replace(/[\r\n\t]/g, ' ').trim();

// Templates are static files compiled ONCE here — request data is only ever
// passed as context to an already-compiled template, never as template source.
const here = dirname(fileURLToPath(import.meta.url));
const compile = (f: string) => Handlebars.compile(readFileSync(join(here, '..', 'emails', f), 'utf8'));

export function createMailer(opts: {
  transport: {
    sendMail(msg: Record<string, unknown>): Promise<{
      messageId?: string; accepted?: unknown[]; rejected?: unknown[]; response?: string;
    }>;
  };
  from: string; teamTo: string; logger?: Logger;
}): Mailer {
  const html = compile('inquiry-internal.hbs');
  const text = compile('inquiry-internal.txt.hbs');
  return {
    async sendInternal(s) {
      const serviceLabel = SERVICE_LABELS[s.service] ?? s.service;
      const data = {
        firstName: s.name.trim().split(/\s+/)[0], name: s.name, email: s.email,
        company: s.company, phone: s.phone, service: serviceLabel,
        meeting: s.meeting === 'onsite' ? 'On-site at your office' : 'Online',
        discoverWorkshop: s.discover, maintenanceHandover: s.handover,
        message: s.message, submittedAt: s.submittedAt, source: s.source,
        year: new Date().getFullYear(),
      };
      const subject = stripCtrl(`New inquiry: ${serviceLabel} — ${s.name}`);
      const info = await opts.transport.sendMail({
        from: opts.from,
        to: opts.teamTo,
        replyTo: { name: stripCtrl(s.name), address: stripCtrl(s.email) },
        subject,
        html: html(data), text: text(data),
      });
      opts.logger?.info(
        {
          messageId: info?.messageId, to: opts.teamTo,
          replyTo: s.email, subject, accepted: info?.accepted, rejected: info?.rejected,
        },
        'internal email sent',
      );
    },
  };
}

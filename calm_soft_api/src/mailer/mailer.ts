import Handlebars from 'handlebars';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { Logger } from 'pino';

export interface Submission {
  name: string; email: string; message: string;
  submittedAt: string; source: string;
}

export interface DetailsSubmission {
  name: string; email: string; area: string; budget: string; phone: string;
  submittedAt: string; source: string;
}

export interface Mailer {
  sendInternal(s: Submission): Promise<void>;
  sendDetails(s: DetailsSubmission): Promise<void>;
}

const AREA_LABELS: Record<string, string> = {
  core: 'Core systems', automation: 'Automation', rescue: 'Legacy rescue',
  web: 'Web platform', 'not-sure': 'Not sure',
};
const BUDGET_LABELS: Record<string, string> = {
  'under-10k': 'Under 10k', '10-30k': '10–30k', '30-80k': '30–80k',
  '80k-plus': '80k+', 'no-idea': 'No idea yet',
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
  const detailsHtml = compile('inquiry-details.hbs');
  const detailsText = compile('inquiry-details.txt.hbs');
  return {
    async sendInternal(s) {
      const data = {
        firstName: s.name.trim().split(/\s+/)[0], name: s.name, email: s.email,
        message: s.message, submittedAt: s.submittedAt, source: s.source,
        year: new Date().getFullYear(),
      };
      const subject = stripCtrl(`New inquiry — ${s.name}`);
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
    async sendDetails(s) {
      const areaLabel = s.area ? (AREA_LABELS[s.area] ?? s.area) : '';
      const budgetLabel = s.budget ? (BUDGET_LABELS[s.budget] ?? s.budget) : '';
      const data = {
        firstName: s.name.trim().split(/\s+/)[0], name: s.name, email: s.email,
        area: areaLabel, budget: budgetLabel, phone: s.phone,
        submittedAt: s.submittedAt, source: s.source,
        year: new Date().getFullYear(),
      };
      const subject = stripCtrl(`Inquiry details — ${s.name} (${s.email})`);
      const info = await opts.transport.sendMail({
        from: opts.from,
        to: opts.teamTo,
        replyTo: { name: stripCtrl(s.name), address: stripCtrl(s.email) },
        subject,
        html: detailsHtml(data), text: detailsText(data),
      });
      opts.logger?.info(
        {
          messageId: info?.messageId, to: opts.teamTo,
          replyTo: s.email, subject, accepted: info?.accepted, rejected: info?.rejected,
        },
        'details email sent',
      );
    },
  };
}

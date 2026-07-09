// calm_soft — form emails (green theme)
// npm i nodemailer handlebars
'use strict';

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const nodemailer = require('nodemailer');

const load = (file) =>
  Handlebars.compile(fs.readFileSync(path.join(__dirname, file), 'utf8'));

const templates = {
  confirmationHtml: load('confirmation-client.hbs'),
  confirmationText: load('confirmation-client.txt.hbs'),
  internalHtml: load('inquiry-internal.hbs'),
  internalText: load('inquiry-internal.txt.hbs'),
};

// Map form service ids (landing page) to display labels
const SERVICE_LABELS = {
  web: 'Web solutions',
  automation: 'Automation',
  core: 'Core systems & integrations',
  refactor: 'Refactor & rescue',
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

/**
 * Call after the landing-page form is submitted.
 * @param {object} form  { name, email, company?, phone?, service: 'web'|'automation'|'core'|'refactor',
 *                         meeting: 'online'|'onsite', discover: boolean, handover: boolean, message: string }
 */
async function onFormSubmit(form) {
  const data = {
    firstName: form.name.trim().split(/\s+/)[0],
    name: form.name.trim(),
    email: form.email.trim(),
    company: (form.company || '').trim(),
    phone: (form.phone || '').trim(),
    service: SERVICE_LABELS[form.service] || form.service,
    meeting: form.meeting === 'onsite' ? 'On-site at your office' : 'Online',
    discoverWorkshop: !!form.discover,
    maintenanceHandover: !!form.handover,
    message: (form.message || '').trim(), // Handlebars escapes HTML; newlines render via white-space: pre-line
    submittedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    source: 'calmsoft.com/#contact',
    year: new Date().getFullYear(),
  };

  // 1) Confirmation to the client (template 2a — no CTA button)
  await transporter.sendMail({
    from: '"calm_soft" <hello@calmsoft.com>',
    to: data.email,
    subject: 'Request received — a senior engineer replies within 24h',
    html: templates.confirmationHtml(data),
    text: templates.confirmationText(data),
  });

  // 2) Internal summary with all form fields (template 2b)
  await transporter.sendMail({
    from: '"calmsoft.com form" <forms@calmsoft.com>',
    to: 'team@calmsoft.com',
    replyTo: `"${data.name}" <${data.email}>`,
    subject: `New inquiry: ${data.service} — ${data.name}`,
    html: templates.internalHtml(data),
    text: templates.internalText(data),
  });
}

module.exports = { onFormSubmit, templates, SERVICE_LABELS };

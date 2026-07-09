import type { SiteContent } from "./types";

export const site: SiteContent = {
  name: "calm_soft",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@calmsoft.com",
  eyebrow: "Web · Automation · Core systems · Refactoring",
  featuredCaseSlug: "enterprise-30-years-in-production",
  footerLinks: [
    { label: "Services", href: "/#services" },
    { label: "Process", href: "/#process" },
    { label: "Case studies", href: "/#cases" },
    { label: "Contact", href: "/#contact" },
  ],
  hero: {
    aurora: {
      h1: "Software that\nsimply works.",
      lead: "Web platforms, automation, core integrations and legacy rescue — built end to end by a team that treats your product like its own.",
      ctaPrimary: "Start a project",
      ctaSecondary: "Explore services",
    },
    code: {
      h1: "Software your business can lean on.",
      lead: "Web platforms, business automation, core integrations and legacy rescue — one team, a transparent process, honest timelines and support that stays.",
      ctaPrimary: "Start a project",
      ctaSecondary: "See how we work ›",
      window: {
        title: [
          { tone: "brand", text: "calm" },
          { tone: "accent", text: "_" },
          { tone: "brand", text: "soft" },
          { tone: "muted", text: " · automation.ts" },
        ],
        lines: [
          [
            { kind: "kw", text: "const" },
            { kind: "plain", text: " pipeline = " },
            { kind: "fn", text: "automate" },
            { kind: "plain", text: "({" },
          ],
          [
            { kind: "plain", text: "  intake: " },
            { kind: "str", text: "'crm.leads'" },
            { kind: "plain", text: "," },
          ],
          [
            { kind: "plain", text: "  enrich: [" },
            { kind: "str", text: "'scoring'" },
            { kind: "plain", text: ", " },
            { kind: "str", text: "'routing'" },
            { kind: "plain", text: "]," },
          ],
          [
            { kind: "plain", text: "  notify: " },
            { kind: "str", text: "'#sales'" },
            { kind: "plain", text: "," },
          ],
          [{ kind: "plain", text: "});" }],
          [
            { kind: "kw", text: "await" },
            { kind: "plain", text: " pipeline." },
            { kind: "fn", text: "deploy" },
            { kind: "plain", text: "();" },
          ],
          [{ kind: "ok", text: "✓ Live · 99.98% uptime · 4,120 tasks automated" }],
        ],
      },
    },
    type: {
      line1: "Complex problems.",
      line2: "Calm software.",
      lead: "From web platforms and automation to integrations and legacy rescue — built end to end by people who keep their promises.",
      ctaPrimary: "Start a project",
    },
  },
  sections: {
    services: { line1: "Four disciplines.", line2: "One accountable partner." },
    process: { line1: "From idea to production.", line2: "Calmly, step by step." },
    cases: {
      line1: "Proof, not promises.",
      line2: "Selected work, with the numbers.",
      footnote: "References and technical deep-dives available on request.",
    },
  },
  modals: {
    serviceNote: "A senior engineer replies within 24 hours · NDA on request.",
    caseNote: "References and technical deep-dives on request.",
  },
  contact: {
    heading: "Let's build something that lasts.",
    paragraph: "Tell us about your project — you'll hear back from a senior engineer, not a sales script.",
    checks: [
      "NDA on request — your idea stays yours",
      "Reply within 24 hours, always from an engineer",
      "EU-based team — on-site across Poland or online",
    ],
    form: {
      title: "Project inquiry",
      fields: {
        name: "Name",
        email: "Email",
        company: "Company (optional)",
        phone: "Phone (optional)",
        message: "Tell us about your project",
      },
      servicePicker: {
        legend: "Which service do you need?",
        options: [
          { id: "web", label: "Web solutions", sub: "Platforms, portals, products" },
          { id: "automation", label: "Automation", sub: "Processes, RPA, AI workflows" },
          { id: "core", label: "Core systems & integrations", sub: "Distributed, B2B, event-driven" },
          { id: "refactor", label: "Refactor & rescue", sub: "Legacy, tech debt, migrations" },
        ],
      },
      toggles: {
        legend: "Shape the engagement",
        discover: {
          label: "Start with a Discover workshop",
          sub: "A DDD brainstorming session where we define together what your product should do — before you commit to building. Billed separately, and it pays for itself in avoided rework.",
          badge: "Recommended",
        },
        handover: {
          label: "Handover with a maintenance plan",
          sub: "Close the project with a fixed-term maintenance & growth agreement — priority support, predictable costs, and a partner who already knows your system. No lock-in beyond the agreed term.",
          badge: "Peace of mind",
        },
      },
      meeting: {
        legend: "First meeting",
        online: "Online",
        onsite: "On-site at your office",
      },
      submit: "Send request",
      submitting: "Sending…",
      fieldErrors: {
        name: "Please enter your name.",
        emailRequired: "Please enter your email.",
        emailInvalid: "Please enter a valid email address.",
        phoneInvalid: "Please enter a valid phone number, or leave it blank.",
        service: "Please pick a service.",
        message: "Please tell us about your project.",
      },
      submitError: "Something went wrong and your request wasn't sent. Please try again — or email us directly.",
      success: {
        heading: "Request sent.",
        paragraph: "Thank you — a senior engineer will get back to you within 24 hours to schedule the first meeting.",
        again: "Send another request ›",
      },
      finePrint: "A senior engineer replies within 24 hours · NDA on request",
    },
  },
  notFound: {
    heading: "Nothing to see here.",
    text: "This page doesn't exist — but your project could.",
    back: "Back to home ›",
  },
};

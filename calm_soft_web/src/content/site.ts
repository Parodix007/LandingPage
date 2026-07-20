import type { SiteContent } from "./types";

export const site: SiteContent = {
  name: "calm_soft",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@calmsoft.com",
  eyebrow: "Web · Automation · Core systems · Refactoring",
  featuredCaseSlugs: [
    "enterprise-30-years-in-production",
    "international-automotive-sales-platform",
    "e-delivery-platform-nationwide",
  ],
  featuredDemoSlugs: ["merdi", "healthlab", "vitalab"],
  footerLinks: [
    { label: "Services", href: "/#services" },
    { label: "Case studies", href: "/#cases" },
    { label: "Demos", href: "/#demo" },
    { label: "Process", href: "/#process" },
    { label: "Pricing", href: "/pricing/" },
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
      ctaDemos: "Explore demos ›",
      ctaPricing: "Check pricing ›",
      demoLabel: "Live demos",
    },
    type: {
      line1: "Complex problems.",
      line2: "Calm software.",
      lead: "From web platforms and automation to integrations and legacy rescue — built end to end by people who keep their promises.",
      ctaPrimary: "Start a project",
    },
  },
  sections: {
    services: {
      line1: "Four disciplines.",
      line2: "One accountable partner.",
      pricingCta: "See transparent pricing ›",
      pricingPrompt: "Wondering what a project like yours costs?",
    },
    process: { line1: "From idea to production.", line2: "Calmly, step by step." },
    cases: {
      line1: "Proof, not promises.",
      line2: "Selected work, with the numbers.",
      footnote: "References and technical deep-dives available on request.",
      seeAllCta: "See all case studies ›",
      calendly: {
        prompt: "Prefer to talk your project through?",
        cta: "Book a free 30-min call ›",
      },
    },
    demos: {
      line1: "Working software, not slides.",
      line2: "Click through live demos, end to end.",
      langChip: "Demo in Polish",
      cta: "Open the demo ›",
      footnote: "Fully clickable, front to back — explore each flow the way a real user would.",
      seeAllCta: "See all demos ›",
      detailCta: "View details ›",
      liveCta: "Open the live demo ›",
      techLegend: "Technologies we can build it in",
      calendly: {
        prompt: "Clicked through a demo and want one of your own?",
        cta: "Book a free 30-min call ›",
      },
    },
  },
  modals: {
    serviceNote: "A senior engineer replies within 24 hours · NDA on request.",
    caseNote: "References and technical deep-dives on request.",
    demoNote: "A fully clickable prototype — built to modern best practices, ready to become a real product.",
  },
  contact: {
    heading: "Let's build something that lasts.",
    paragraph: "Tell us about your project — you'll hear back from a senior engineer, not a sales script.",
    checks: [
      "NDA on request — your idea stays yours",
      "Reply within 24 hours, always from an engineer",
      "EU-based team — on-site across Poland or online",
    ],
    talk: {
      title: "Rather talk it through first?",
      body: "Book a free 30-minute call with a senior engineer — no pitch, just a straight conversation about what you're building.",
      cta: "Book a free 30-min call ›",
    },
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
  work: {
    metaTitle: "Case studies — calm_soft",
    metaDescription:
      "Every calm_soft case study in one place — legacy rescue, an international automotive platform, public-sector core systems and automation, each with the numbers.",
    heading: { line1: "Every project,", line2: "with the numbers." },
    lead: "The full set of case studies behind the highlights on our homepage — real systems, real scale, honest outcomes.",
    calendly: {
      prompt: "See something close to your project?",
      cta: "Book a free 30-min call ›",
    },
    startLabel: "Start a project ›",
  },
  demosPage: {
    metaTitle: "Demos — calm_soft",
    metaDescription:
      "Five clickable product demos from calm_soft — patient-facing clinic websites and the back-office consoles that run them, each built to modern best practices.",
    heading: { line1: "Five demos,", line2: "clickable end to end." },
    lead: "Patient-facing clinic sites and the staff consoles behind them — each a fully clickable prototype, built the way we’d build the real thing.",
    calendly: {
      prompt: "Want one of these tailored to your business?",
      cta: "Book a free 30-min call ›",
    },
    startLabel: "Start a project ›",
  },
  notFound: {
    heading: "Nothing to see here.",
    text: "This page doesn't exist — but your project could.",
    back: "Back to home ›",
  },
};

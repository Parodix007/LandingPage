import type { PricingPage } from "./types";

// Full English translation of the owner's Polish pricing draft (..\cennik.html — outside this
// repo, source of truth for copy/amounts), 1:1 in meaning. Amounts unchanged, "PLN 3,200"
// format; "netto" → "net". Voice matches the rest of the site: calm, honest, no hype. Visual
// spec: ..\cennik-design-handoff.md, rendered by src/app/pricing/page.tsx (2026-07-20 pricing/
// Calendly/reorder design doc).
export const pricing: PricingPage = {
  heading: { line1: "What does it cost?", line2: "No prices hidden behind a form." },
  lead: "Real starting ranges below. You'll get an exact written quote within 24 hours — from an engineer, not a script.",
  badges: ["Prices 'from' · net", "Written quote in 24h", "NDA on request", "Base rate from PLN 150/h"],
  groups: [
    {
      eyebrow: "Start without risk",
      sub: "A low barrier to entry — get to know us before committing to a big project.",
      tone: "accent",
      cards: [
        {
          title: "Intro call (30 min)",
          tag: "No strings attached",
          desc: "A conversation with an engineer, not a salesperson. Tell us what you want to build — you'll get an honest first take and a direction.",
          price: { kind: "free", label: "free" },
        },
        {
          title: "Technical consultation (2–3 h)",
          desc: "An in-depth session: a review of your idea or system, recommendations and technical direction.",
          price: { kind: "from", amount: "PLN 400" },
          note: "Credited toward the project.",
        },
        {
          title: "Discovery workshop (1 day)",
          desc: "A day of joint work using Domain-Driven Design. You leave with scope, a mockup and a quote — before any costly code gets written.",
          price: { kind: "from", amount: "PLN 1,600" },
          note: "Credited toward the project.",
        },
        {
          title: "Clickable project mockup",
          tag: "Limited-time offer",
          desc: "An interactive prototype of your application — click through the whole flow before a single line of code exists. Built after the workshop, or once you've shared the details.",
          price: { kind: "promo", old: "from PLN 1,200", now: "now free" },
          note: "Limited-time offer.",
        },
      ],
    },
    {
      eyebrow: "Web Solutions",
      icon: "🌐",
      sub: "Platforms, portals and products — built to scale.",
      tone: "accent",
      cards: [
        {
          title: "Simple app / store MVP",
          desc: "The first working version of your product — get to market fast, before you commit your whole budget.",
          price: { kind: "from", amount: "PLN 3,200" },
        },
        {
          title: "Web application / platform",
          desc: "A full web product with business logic, dashboards and integrations.",
          price: { kind: "from", amount: "PLN 11,500" },
        },
        {
          title: "API / integrations / cloud & DevOps",
          desc: "APIs, connections to external systems, cloud deployments and CI/CD.",
          price: { kind: "from", amount: "PLN 5,600" },
        },
      ],
    },
    {
      eyebrow: "Automation",
      icon: "⚙️",
      sub: "Repetitive work — taken off your team's shoulders.",
      tone: "accent2",
      cards: [
        {
          title: "Simple automation",
          desc: "Document workflows, notifications, chatbots — simple processes that run themselves.",
          price: { kind: "from", amount: "PLN 1,600" },
        },
        {
          title: "Mid-size integration",
          desc: "Connecting multiple systems — ERP, CRM, databases — into one consistent data flow.",
          price: { kind: "from", amount: "PLN 8,000" },
        },
        {
          title: "Advanced automation / AI system",
          desc: "Dedicated solutions with business logic and AI components.",
          price: { kind: "from", amount: "PLN 18,000" },
        },
      ],
    },
    {
      eyebrow: "Core Systems & Integrations",
      icon: "🔗",
      sub: "Systems that talk to systems.",
      tone: "accent2",
      cards: [
        {
          title: "B2B integrations / distributed systems / event-driven",
          desc: "Event-driven architecture and cross-company integrations — built to hold up at scale.",
          price: { kind: "from", amount: "PLN 16,000" },
        },
        {
          title: "Environment profiling",
          desc: "Load balancing, health checks and infrastructure tuning for stable traffic.",
          price: { kind: "from", amount: "PLN 1,600" },
        },
        {
          title: "High-availability API (HA)",
          desc: "High-availability architecture: redundancy, failover, no single point of failure.",
          price: { kind: "from", amount: "PLN 6,000" },
          note: "Requires an application built for scaling.",
        },
      ],
    },
    {
      eyebrow: "Refactor & Rescue",
      icon: "🛟",
      sub: "Legacy systems — a second life.",
      tone: "accent",
      cards: [
        {
          title: "Code / tech debt audit",
          desc: "A review of your system and code, plus a report on what works, what's a risk, and what to fix first.",
          price: { kind: "from", amount: "PLN 1,600" },
        },
        {
          title: "Legacy system modernization / migration",
          desc: "Moving a legacy system onto a modern stack — without losing data or downtime.",
          price: { kind: "from", amount: "PLN 24,000" },
        },
        {
          title: "Senior-level work (rescue / performance / security)",
          desc: "Rescuing troubled projects, performance tuning, security — high-stakes work.",
          price: { kind: "individual", label: "individual quote" },
        },
      ],
    },
    {
      eyebrow: "Post-launch maintenance",
      icon: "🔧",
      sub: "Support that stays after the project ends.",
      tone: "accent",
      cards: [
        {
          title: "Administration",
          desc: "Log review, status monitoring, small fixes — peace of mind after launch.",
          price: { kind: "from", amount: "PLN 200", unit: "/ mo." },
        },
        {
          title: "Support & ongoing development",
          desc: "Continued product development, billed hourly or on retainer.",
          price: { kind: "individual", label: "individual quote" },
        },
      ],
    },
  ],
  filters: {
    categoryLegend: "Category",
    priceLegend: "Price",
    clearLabel: "Clear all",
    countLabel: "shown",
    emptyTitle: "Nothing matches those filters",
    emptyBody: "Try removing a filter — or clear them all to see every option.",
    tiers: [
      { id: "free", label: "Free" },
      { id: "lt5k", label: "Under PLN 5k" },
      { id: "mid", label: "PLN 5–15k" },
      { id: "high", label: "PLN 15k+" },
      { id: "custom", label: "Custom quote" },
    ],
  },
  foot: {
    billing:
      "How we bill: Time & Material where scope evolves (you pay for real work), Fixed Price where the scope is clear (you know the price up front). We match the model to the risk — honestly.",
    fine: "All amounts are net and indicative. The final quote comes in writing within 24h. NDA on request.",
  },
  ctaLabel: "Book a free 30-min intro call ›",
  disclaimer: "All prices are 'from' — every final quote is prepared individually.",
};

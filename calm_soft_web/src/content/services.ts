import type { Service } from "./types";

export const services: Service[] = [
  {
    id: "web",
    tone: "a",
    tag: "Web solutions",
    headline: "Platforms, portals and products — built to scale.",
    cardBody:
      "Customer portals, e-commerce, SaaS products and internal tools — architecture, design, development and cloud operations under one roof, with one team answerable to you from day one.",
    chips: ["Web apps", "E-commerce", "APIs & integrations", "Cloud & DevOps"],
    intro:
      "The products your customers actually touch: portals, e-commerce, SaaS and the internal tools behind them. One team owns the whole thing — design, architecture, code and cloud — so nothing falls between vendors.",
    fit: [
      "You’re launching a product, portal or store and want it built end to end",
      "An existing app is struggling — performance, UX, or how slowly it ships",
      "Internal operations run on spreadsheets and goodwill",
      "You have the idea and the designs, but no team to take them to production",
    ],
    deliver: [
      { n: "Product discovery & UX", d: "From workshop to clickable prototype — agreed before expensive code is written." },
      { n: "Frontend & backend", d: "One codebase standard: typed, tested, reviewed, deployed continuously." },
      { n: "E-commerce & payments", d: "Storefront to checkout to the ERP behind it, working as one flow." },
      { n: "APIs & integrations", d: "Your platform talking cleanly to CRM, ERP and partner systems." },
      { n: "Cloud & DevOps", d: "CI/CD, monitoring and infrastructure that scales with real traffic." },
      { n: "QA built in", d: "Testing inside every iteration — not a phase at the end." },
    ],
    approach:
      "Web projects start with a Discover workshop and ship in visible iterations, each ending in a working demo. You watch the product grow — and can change course while change is still cheap.",
    relatedSlugs: ["public-sector-poland", "enterprise-30-years-in-production"],
  },
  {
    id: "automation",
    tone: "b",
    tag: "Automation",
    headline: "Repetitive work, off your team’s plate.",
    cardBody:
      "Process automation, system integrations and AI-assisted workflows that quietly remove manual steps — carefully, transparently, and always with your people in the loop.",
    chips: ["Process automation", "RPA", "AI workflows", "Data pipelines"],
    intro:
      "Every company runs on invisible routines — data re-typed between systems, payments chased, the same email sent for the tenth time. We map those routines and hand them to software: carefully, transparently, with your people in the loop.",
    fit: [
      "Your team re-types the same data into two or three systems",
      "Month-end means overtime, spreadsheets and avoidable mistakes",
      "Operations can’t grow without hiring more hands for manual work",
      "You want AI in the workflow — without giving up control of quality",
    ],
    deliver: [
      { n: "Process mapping & audit", d: "We find where the hours actually leak before automating anything." },
      { n: "System integrations", d: "CRM, ERP, email and payments connected — instead of copy-pasted." },
      { n: "RPA", d: "Software robots for the repetitive clicks nobody should be doing." },
      { n: "AI-assisted workflows", d: "LLMs drafting the routine work; your people making the calls." },
      { n: "Data pipelines & reporting", d: "Reports that assemble themselves, on schedule, from live data." },
    ],
    approach:
      "We start small on purpose: map one process, automate it, measure the hours returned — then expand. No big-bang platform, no six-month rollout before the first visible result.",
    relatedSlugs: ["software-delivery-org-50-people", "premium-online-school-edtech"],
  },
  {
    id: "core",
    tone: "b",
    tag: "Core systems & integrations",
    headline: "Systems that talk to systems.",
    cardBody:
      "Not everything has a screen. We engineer the backbone — distributed architectures, event-driven services and backend-to-backend integrations that keep your ERP, partners and platforms perfectly in sync.",
    chips: ["Distributed systems", "Event-driven architecture", "B2B integrations", "High-availability APIs"],
    intro:
      "The systems nobody sees and everything depends on. We engineer the backbone — services, queues and integrations that keep your ERP, partners and platforms in sync — for work where correctness is not negotiable.",
    fit: [
      "Your ERP, e-commerce and partner systems keep drifting out of sync",
      "Batch jobs are failing under volumes they were never designed for",
      "You exchange data where every message has legal or financial weight",
      "Real-time is becoming a requirement, not a nice-to-have",
    ],
    deliver: [
      { n: "Architecture & design", d: "Event-driven, domain-driven — sized for the load you’ll have, not the load you had." },
      { n: "B2B integrations", d: "REST, SOAP, queues or flat files: we speak whatever your partners run." },
      { n: "High-availability APIs", d: "Designed, load-tested and verified against real traffic targets." },
      { n: "Zero-loss data migrations", d: "Millions of records moved, integrity checked at every step." },
      { n: "Compliance-grade security", d: "ETSI, eIDAS and audit trails in the architecture — not bolted on." },
    ],
    approach:
      "Backbone work is planned like surgery: staging rehearsals, load tests, rollback paths and cutover windows measured in hours — so the business never notices the operation.",
    relatedSlugs: ["public-sector-eu", "e-delivery-platform-nationwide"],
  },
  {
    id: "refactor",
    tone: "a",
    tag: "Refactor & rescue",
    headline: "Legacy systems, given a second life.",
    cardBody:
      "Inherited a platform that almost works? We step into codebases others walk away from — audit honestly, pay down the technical debt and modernise piece by piece, while your business keeps running.",
    chips: ["Code audit", "Tech-debt paydown", "Migrations & upgrades", "Performance & security"],
    intro:
      "Inherited a system that almost works? Most teams walk away from other people’s code. We step in: audit honestly, stabilise first, then modernise piece by piece — while your business keeps running on it.",
    fit: [
      "Releases are slow, risky and depend on the one person who knows the system",
      "The original team is gone and the documentation never existed",
      "Your framework, database or platform has reached end of life",
      "You’ve been quoted a full rewrite — and it rightly terrifies you",
    ],
    deliver: [
      { n: "Code & architecture audit", d: "A readable report of what’s really there: risks, costs, options. No scare tactics." },
      { n: "Stabilise first", d: "Tests, CI/CD and monitoring around the current system before anything is rewritten." },
      { n: "Incremental modernisation", d: "Strangler-pattern migrations: replaced piece by piece, in production." },
      { n: "Migrations & upgrades", d: "Frameworks, databases and platforms brought back to supported versions." },
      { n: "Performance & security", d: "The bottlenecks and leaks fixed while we’re in there." },
    ],
    approach:
      "Rewrites fail when they start from zero, so we start from what works: the system keeps earning while we replace it underneath. That’s how a 30-year-old Oracle Forms platform became a modern Node.js product in under a year — without stopping the business.",
    relatedSlugs: ["enterprise-30-years-in-production"],
  },
];

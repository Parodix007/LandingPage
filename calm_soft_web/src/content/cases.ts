import type { CaseStudy } from "./types";

export const cases: CaseStudy[] = [
  {
    slug: "enterprise-30-years-in-production",
    serviceId: "refactor",
    tone: "a",
    tag: "Refactor & rescue",
    client: "Enterprise · 30 years in production",
    headline: "A 30-year-old Oracle Forms system, reborn as a modern web platform.",
    teaser:
      "A business-critical system with three decades of history and up to 200,000 users — moved to a modern Node.js stack without stopping the business.",
    m1v: "<1 yr",
    m1l: "full migration, end to end",
    m2v: "200k",
    m2l: "users on the platform",
    challenge:
      "The core system had been in production for over 30 years, built on Oracle Forms. It worked — but it locked the business into aging technology, made hiring and maintenance harder every year, and its dated interface was becoming an obstacle in winning new customers. With 100,000–200,000 users depending on it, a big-bang rewrite was not an option.",
    approach:
      "We defined and owned the technical direction of the migration to a modern Node.js web stack — target architecture, security standards and performance benchmarks — and planned it so the business kept running on the existing system while the new platform took shape. No compromise on speed, safety or continuity.",
    results:
      "Users got a modern UX the old technology simply could not deliver, and the refreshed product started winning new customers. Maintenance became easier and cheaper, the platform opened up to modern integrations — and the entire migration was delivered in under a year.",
    tags: ["Legacy modernization", "Oracle Forms → Node.js", "Architecture", "100–200k users"],
  },
  {
    slug: "public-sector-eu",
    serviceId: "core",
    tone: "b",
    tag: "Core systems",
    client: "Public sector · EU",
    headline: "Legally binding e-delivery, across EU borders.",
    teaser: "",
    m1v: "50k/h",
    m1l: "users engineered for",
    challenge:
      "Electronic delivery is communication with legal consequences: every message must be secure, verifiable and compliant with EU regulations. The platform — part of a major European Union initiative — needed an integration layer connecting national and cross-border systems, each with its own protocols and standards, without a single weak link.",
    approach:
      "We designed and implemented the integration platform as reactive, asynchronous services (WebFlux) built for scale, with integrations to external SOAP-based systems and strict adherence to ETSI and eIDAS standards at every layer. Security and compliance shaped the architecture from day one — not as a checklist at the end.",
    results:
      "The system was engineered and verified to handle 50,000 users per hour — nationwide-scale infrastructure ready to grow. Backend-to-backend engineering where correctness is non-negotiable: systems that do not have a screen, yet everything depends on them.",
    tags: ["Distributed systems", "ETSI · eIDAS", "WebFlux", "B2B integrations"],
  },
  {
    slug: "e-delivery-platform-nationwide",
    serviceId: "core",
    tone: "b",
    tag: "Core systems",
    client: "E-delivery platform · nationwide",
    headline: "Millions of files moved. Zero lost.",
    teaser: "",
    m1v: "2.5M",
    m1l: "files per migration session",
    m2v: "1",
    m2l: "weekend cutover window",
    challenge:
      "A live, legally regulated e-delivery platform had outgrown its NFS file storage. Hundreds of gigabytes across millions of files made storage increasingly hard to operate, scale and maintain — and because the service processes documents with legal weight, losing files was simply not in the vocabulary.",
    approach:
      "We engineered the migration to S3-compatible object storage (MinIO) with data integrity verified at every step. The pipeline was tuned to a throughput of up to 2.5 million files per session, so the entire switch fit inside a single weekend maintenance window instead of dragging the risk out over weeks.",
    results:
      "Zero data loss, one weekend of planned downtime, and a storage layer dramatically easier to operate — which translated directly into lower running costs. The platform now scales the way modern object storage should.",
    tags: ["Data migration", "MinIO · S3", "Zero-loss", "Weekend cutover"],
  },
  {
    slug: "public-sector-poland",
    serviceId: "web",
    tone: "a",
    tag: "Web solutions",
    client: "Public sector · Poland",
    headline: "The platform behind Poland’s largest cities.",
    teaser: "",
    m1v: "10+",
    m1l: "major cities deployed",
    m2v: "100k",
    m2l: "users per deployment",
    challenge:
      "Software for large city administrations lives under permanent pressure: citizens and officials depend on it daily, regulations change constantly, and every deployment brings demanding functional and technological requirements. Stability is not a feature — it is the baseline.",
    approach:
      "We held technical leadership over the platform’s quality and development: high availability, strict security, and integrations across dozens of back-office modules. A key part of the work was hardening the application to meet the requirements large public-sector clients demand before they sign.",
    results:
      "Application stability measurably improved, and meeting those demanding requirements directly contributed to winning new clients. Today the platform serves more than 10 of the largest cities in Poland, with deployments reaching up to 100,000 users.",
    tags: ["Public sector", "Enterprise web platform", "High availability"],
  },
  {
    slug: "software-delivery-org-50-people",
    serviceId: "automation",
    tone: "b",
    tag: "Automation",
    client: "Software delivery org · ~50 people",
    headline: "AI adoption that stuck — culture, not hype.",
    teaser: "",
    m1v: "50",
    m1l: "person AI-assisted organization",
    challenge:
      "AI tooling fails in delivery organizations for a predictable reason: tools get bought, guidelines get written, and six months later nobody uses them. The goal was to make AI genuinely useful across development, testing and business operations in an organization of around 50 people — without compromising quality or control.",
    approach:
      "We built the rollout of Claude-based AI tooling around custom workflows designed for how the organization actually works — tool selection, safety guardrails, hands-on enablement, and embedding AI into the existing engineering culture: repetitive work off people’s plates, humans firmly in the loop for decisions and quality.",
    results:
      "AI became part of the daily workflow across engineering, testing and business roles — adopted because it fit the culture, not because it was mandated. The organization now automates routine work in code, tests and business processes while keeping full control over what ships.",
    tags: ["AI workflows", "Claude", "Custom workflows", "Human-in-the-loop"],
  },
  {
    slug: "premium-online-school-edtech",
    serviceId: "automation",
    tone: "b",
    tag: "Automation",
    client: "Premium online school · EdTech",
    headline: "A premium school’s invisible machinery, automated.",
    teaser: "",
    m1v: "150",
    m1l: "students, one calm back office",
    challenge:
      "A private premium school serving up to 150 students was running its operations by hand: payments, management–student communication, homework reminders, pre- and post-lesson notes, onboarding of new students. At a premium price point every dropped ball is visible — and manual operations do not scale without hiring.",
    approach:
      "We designed and delivered an online back-office system together with automations spanning the school’s core processes: payment handling, structured communication between management and students, automatic task reminders, lesson notes before and after each session, and a smooth onboarding path for new students.",
    results:
      "Administrative processes that used to depend on someone remembering now run themselves. The school operates its premium service with less manual overhead, fewer misses, and an operational backbone that can grow with the student base.",
    tags: ["Process automation", "Back-office system", "Payments & communication", "EdTech"],
  },
];

export const getCaseBySlug = (slug: string) => cases.find((c) => c.slug === slug);

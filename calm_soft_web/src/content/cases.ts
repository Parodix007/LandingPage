import type { CaseStudy } from "./types";

// Wersja bezpieczna prawnie (sanityzacja NDA + uczciwa atrybucja), zgodna z ustaleniami:
// liczby skali zostają, usunięte identyfikatory (nazwa programu, ETSI/eIDAS, "largest",
// dokładny wiek systemu), atrybucja "our team contributed to / responsible for our part".
export const cases: CaseStudy[] = [
  {
    slug: "enterprise-30-years-in-production",
    serviceId: "refactor",
    tone: "a",
    tag: "Refactor & rescue",
    client: "Enterprise · decades in production",
    headline: "A decades-old business-critical system, reborn as a modern web platform.",
    teaser:
      "A business-critical system serving up to 200,000 users — moved off legacy technology onto a modern web stack, with no business downtime.",
    m1v: "<1 yr",
    m1l: "core migration delivered",
    m2v: "200k",
    m2l: "users on the platform",
    challenge:
      "A core system had spent decades in production on now-legacy technology. It worked — but it locked the business into aging tooling, made maintenance and hiring harder every year, and its dated interface was becoming an obstacle to winning new customers. With up to 200,000 users depending on it, a big-bang rewrite was off the table.",
    approach:
      "Working as part of the delivery team, we contributed to the technical direction of the migration to a modern web stack — target architecture, security standards and performance benchmarks — planned so the business kept running on the existing system while the new platform took shape.",
    results:
      "Users gained a modern experience the old technology could not deliver, maintenance became easier and cheaper, and the platform opened up to modern integrations — with the core migration delivered in under a year.",
    tags: ["Legacy modernization", "4GL → modern web stack", "Architecture", "Up to 200k users"],
  },
  {
    slug: "international-automotive-sales-platform",
    serviceId: "web",
    tone: "a",
    tag: "Web solutions",
    client: "Global automotive manufacturer · US & Europe",
    headline: "A global automotive brand's sales platform, delivered across the US and Europe.",
    teaser:
      "An international engineering team building the online sales platform for one of the world's largest automotive brands — serving hundreds of thousands of users across the US and Europe.",
    m1v: "US + EU",
    m1l: "markets served",
    m2v: "100k+",
    m2l: "users on the platform",
    challenge:
      "Selling vehicles at global scale is not one sales process — it is dozens. Every market brings its own language, regulations, pricing rules and dealer structures, and the brand experience has to stay consistent across all of them. On top of that, the European rollout of a new vehicle line came with a fixed launch date — the kind of deadline that does not move for a world-recognized brand.",
    approach:
      "Working as part of an international team of engineers, we contributed as full-stack developers and integration engineers — building platform features end to end and the integrations that tie the sales journey to the surrounding systems — engineered for the US and European markets with the reliability and brand consistency a global automotive brand demands. Cross-border collaboration across time zones was the daily rhythm, not the exception.",
    results:
      "We took part in rolling out the platform for a new vehicle line to the European market — and delivered it within the planned timeline. Today the platform serves hundreds of thousands of users across the US and Europe, holding one consistent brand experience across languages and regulations.",
    tags: ["International project", "Automotive", "Full-stack & integrations", "US & EU rollout"],
  },
  {
    slug: "public-sector-eu",
    serviceId: "core",
    tone: "b",
    tag: "Core systems",
    client: "Regulated public-sector programme",
    headline: "Legally binding electronic delivery, built to comply.",
    teaser:
      "A secure electronic-delivery platform where every message carries legal weight — engineered for regulatory compliance and nationwide scale.",
    m1v: "50k/h",
    m1l: "users engineered for",
    challenge:
      "Electronic delivery is communication with legal consequences: every message must be secure, verifiable and compliant with the applicable regulations. The platform needed an integration layer connecting national and cross-border systems — each with its own protocols and standards — without a single weak link.",
    approach:
      "Our team engineered part of the integration platform as reactive, asynchronous services built for scale, integrating with external systems under strict security and regulatory-compliance requirements. Compliance shaped the architecture from day one — not as a checklist at the end.",
    results:
      "The integration layer was engineered and verified to handle 50,000 users per hour — nationwide-scale infrastructure ready to grow. Backend-to-backend engineering where correctness is non-negotiable: systems that have no screen, yet everything depends on them.",
    tags: ["Distributed systems", "Regulatory compliance", "Reactive services", "System integrations"],
  },
  {
    slug: "e-delivery-platform-nationwide",
    serviceId: "core",
    tone: "b",
    tag: "Core systems",
    client: "Regulated document platform",
    headline: "2.5M files moved. Zero lost.",
    teaser:
      "A live, regulated platform outgrew its NFS file storage — we migrated 2.5 million legally significant files to S3-compatible object storage with zero data loss.",
    m1v: "2.5M",
    m1l: "files per migration session",
    m2v: "0",
    m2l: "files lost",
    challenge:
      "A live, regulated document platform had outgrown its NFS file storage. Hundreds of gigabytes across millions of files made storage increasingly hard to operate and scale — and because the service processes documents with legal weight, losing a single file was simply not in the vocabulary.",
    approach:
      "We engineered the migration to S3-compatible object storage (MinIO) with data integrity verified at every step, and tuned the pipeline to a throughput of up to 2.5 million files per session — so the switch fit inside a single weekend maintenance window instead of dragging risk out over weeks.",
    results:
      "Zero data loss, one weekend of planned downtime, and a storage layer dramatically easier to operate — translating directly into lower running costs and clean horizontal scaling.",
    tags: ["Data migration", "MinIO · S3", "Zero-loss", "Weekend cutover"],
  },
  {
    slug: "public-sector-poland",
    serviceId: "web",
    tone: "a",
    tag: "Web solutions",
    client: "Large public-sector deployments",
    headline: "The platform behind large city administrations.",
    teaser:
      "Software that citizens and officials depend on daily — hardened for high availability and the demanding requirements large public-sector clients sign off on.",
    m1v: "10+",
    m1l: "major city deployments",
    m2v: "100k",
    m2l: "users per deployment",
    challenge:
      "Software for large administrations lives under permanent pressure: people depend on it daily, regulations change constantly, and every deployment brings demanding functional and technical requirements. Stability is not a feature — it is the baseline.",
    approach:
      "Our team was responsible for our part of the platform's quality and development: high availability, strict security, and integrations across back-office modules — including hardening the application to meet the requirements large public-sector clients demand before they sign.",
    results:
      "Application stability measurably improved, and meeting those demanding requirements directly contributed to winning new clients — with the platform running across 10+ major city deployments, each serving up to 100,000 users.",
    tags: ["Public sector", "Enterprise web platform", "High availability"],
  },
  {
    slug: "software-delivery-org-50-people",
    serviceId: "automation",
    tone: "b",
    tag: "Automation",
    client: "Software delivery organization",
    headline: "AI adoption that stuck — culture, not hype.",
    teaser:
      "Making AI genuinely useful across development, testing and operations in a mid-sized delivery organization — without compromising quality or control.",
    m1v: "org-wide",
    m1l: "AI-assisted workflows",
    challenge:
      "AI tooling fails in delivery organizations for a predictable reason: tools get bought, guidelines get written, and six months later nobody uses them. The goal was to make AI genuinely useful across development, testing and business operations — without compromising quality or control.",
    approach:
      "We built the rollout of AI tooling around custom workflows designed for how the organization actually works — tool selection, safety guardrails, hands-on enablement, and embedding AI into the existing engineering culture: repetitive work off people's plates, humans firmly in the loop for decisions and quality.",
    results:
      "AI became part of the daily workflow across engineering, testing and business roles — adopted because it fit the culture, not because it was mandated. Routine work in code, tests and processes is now automated while the team keeps full control over what ships.",
    tags: ["AI workflows", "Custom workflows", "Enablement", "Human-in-the-loop"],
  },
  {
    slug: "premium-online-school-edtech",
    serviceId: "automation",
    tone: "b",
    tag: "Automation",
    client: "Premium online school · EdTech",
    headline: "A premium school's invisible machinery, automated.",
    teaser: "",
    m1v: "150",
    m1l: "students, one calm back office",
    challenge:
      "A private premium school serving up to 150 students was running its operations by hand: payments, management–student communication, homework reminders, pre- and post-lesson notes, onboarding of new students. At a premium price point every dropped ball is visible — and manual operations do not scale without hiring.",
    approach:
      "We designed and delivered an online back-office system together with automations spanning the school's core processes: payment handling, structured communication between management and students, automatic task reminders, lesson notes before and after each session, and a smooth onboarding path for new students.",
    results:
      "Administrative processes that used to depend on someone remembering now run themselves. The school operates its premium service with less manual overhead, fewer misses, and an operational backbone that can grow with the student base.",
    tags: ["Process automation", "Back-office system", "Payments & communication", "EdTech"],
  },
];

export const getCaseBySlug = (slug: string) => cases.find((c) => c.slug === slug);

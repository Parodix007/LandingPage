export type ServiceId = "web" | "automation" | "core" | "refactor";
export type Tone = "a" | "b";

export type Service = {
  id: ServiceId;
  tone: Tone;
  tag: string;
  headline: string;
  cardBody: string; // paragraf karty w siatce usług (markup prototypu — RÓŻNY od intro)
  chips: string[]; // 4 chipy możliwości na karcie
  intro: string;
  fit: string[]; // 4 pozycje
  deliver: { n: string; d: string }[]; // 5–6 pozycji
  approach: string;
  relatedSlugs: string[]; // slugi case studies (NIE indeksy)
};

export type CaseStudy = {
  slug: string; // stabilny identyfikator (kebab-case klienta)
  serviceId: ServiceId;
  tone: Tone;
  tag: string;
  client: string;
  headline: string;
  teaser: string;
  m1v: string; m1l: string;
  m2v?: string; m2l?: string;
  challenge: string;
  approach: string;
  results: string;
  tags: string[];
};

export type ProcessStep = {
  number: "00" | "01" | "02" | "03";
  title: string;
  description: string;
  badge?: string;
};

export type Demo = {
  slug: string; // stabilny identyfikator — mapuje 1:1 na public/demo/<slug>/
  name: string;
  tag: string;
  description: string; // krótki opis (karta: hero slider + sekcja + podstrona /demos/)
  tagline: string; // nagłówek modala (element z id="modal-headline")
  detail: string; // dłuższy akapit w modalu detali
  features: string[]; // 3–6 kluczowych przepływów (bullety w modalu)
  shot: string; // /demo-shots/<slug>.webp — zrzut makiety (lazy <img> na kartach + w modalu)
  shotAlt: string; // tekst alternatywny zrzutu
  href: string; // root-relative /demo/<slug>/index.html — otwierany w nowej karcie
  desktopOnly?: boolean; // panel back-office, tylko desktop — brak layoutu mobile (opcjonalne: 3 responsywne dema zostają nietknięte)
};

// /pricing/ page content (2026-07-20 pricing/Calendly/reorder design doc). Discriminated union
// on `kind` — note "from" has no `label` field: the word "from" itself is fixed UI chrome
// rendered by the page, not sourced from content (unlike "free"/"individual", which are full
// labels because their wording varies).
export type PricePoint =
  | { kind: "from"; amount: string; unit?: string }
  | { kind: "free"; label: string }
  | { kind: "promo"; old: string; now: string }
  | { kind: "individual"; label: string };

export type PricingCard = {
  title: string;
  desc: string;
  tag?: string;
  price: PricePoint;
  note?: string;
};

export type PricingGroup = {
  eyebrow: string;
  // Decorative per-group emoji from the owner's draft (🌐⚙️🔗🛟🔧) — rendered in its own
  // aria-hidden span ahead of the eyebrow text (HANDOFF a11y note); "Start without risk" has
  // none. Tone is the same "accent"/"accent2" vocabulary Chip/GhostPill already use — unlike
  // Service.tone's "a"/"b" + translation table, this type matches the tone prop domain 1:1.
  icon?: string;
  sub: string;
  tone: "accent" | "accent2";
  cards: PricingCard[];
};

export type PriceTierId = "free" | "lt5k" | "mid" | "high" | "custom";

export type PricingFilterTier = { id: PriceTierId; label: string };

export type PricingFilters = {
  categoryLegend: string; // e.g. "Category"
  priceLegend: string; // e.g. "Price"
  clearLabel: string; // e.g. "Clear all"
  countLabel: string; // e.g. "shown"  — rendered as `{shown} / {total} {countLabel}`
  emptyTitle: string; // shown when nothing matches
  emptyBody: string;
  tiers: PricingFilterTier[];
};

export type PricingPage = {
  heading: { line1: string; line2: string };
  lead: string;
  badges: string[];
  groups: PricingGroup[];
  filters: PricingFilters;
  foot: { billing: string; fine: string };
  ctaLabel: string;
  disclaimer: string;
};

// /work/ page content (2026-07-20 work-page-and-round2-polish design doc) — the full case
// study index. Own metaTitle/metaDescription (rather than deriving from layout.tsx's title)
// since the page needs a distinct <title>/description, mirroring PricingPage's shape.
export type Work = {
  metaTitle: string;
  metaDescription: string;
  heading: { line1: string; line2: string };
  lead: string;
  calendly: { prompt: string; cta: string };
  startLabel: string;
};

export type SiteContent = {
  name: string;
  email: string;
  eyebrow: string;
  featuredCaseSlugs: string[]; // 3 featured cases (CaseStudies homepage, 3-up), display order
  featuredDemoSlugs: string[]; // 3 featured demos (Demos homepage, 3-up), display order
  footerLinks: { label: string; href: string }[]; // root-relative: /#services itd.
  hero: {
    aurora: { h1: string; lead: string; ctaPrimary: string; ctaSecondary: string };
    code: {
      h1: string; lead: string; ctaPrimary: string; ctaDemos: string; ctaPricing: string;
      demoLabel: string;
    };
    type: { line1: string; line2: string; lead: string; ctaPrimary: string; ctaSecondary?: string };
  };
  sections: {
    services: { line1: string; line2: string; pricingCta: string; pricingPrompt: string };
    process: { line1: string; line2: string };
    cases: {
      line1: string; line2: string; footnote: string; seeAllCta: string;
      calendly: { prompt: string; cta: string };
    };
    demos: {
      line1: string; line2: string; langChip: string; cta: string; footnote: string;
      seeAllCta: string; detailCta: string; liveCta: string; techLegend: string;
      desktopNote: string;
      calendly: { prompt: string; cta: string };
    };
  };
  modals: { serviceNote: string; caseNote: string; demoNote: string }; // stopki modali (≈finePrint/footnote, ale z różnicami — 1:1 z prototypu)
  contact: {
    heading: string;
    paragraph: string;
    checks: string[]; // 3 pozycje
    talk: { title: string; body: string; cta: string };
    form: {
      title: string; // "Project inquiry" (uppercase w prototypie to CSS text-transform)
      fields: { name: string; email: string; company: string; phone: string; message: string };
      servicePicker: { legend: string; options: { id: ServiceId; label: string; sub: string }[] };
      toggles: {
        legend: string;
        discover: { label: string; sub: string; badge: string };
        handover: { label: string; sub: string; badge: string };
      };
      meeting: { legend: string; online: string; onsite: string };
      submit: string;
      submitting: string; // "Sending…"
      fieldErrors: {
        name: string;
        emailRequired: string;
        emailInvalid: string;
        phoneInvalid: string;
        service: string;
        message: string;
      };
      submitError: string;
      success: { heading: string; paragraph: string; again: string };
      finePrint: string;
    };
  };
  work: Work;
  demosPage: Work; // /demos/ subpage — reuses the Work shape (meta/heading/lead/calendly/startLabel)
  notFound: { heading: string; text: string; back: string };
};

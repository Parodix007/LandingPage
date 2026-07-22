export type ServiceId = "web" | "automation" | "core" | "refactor";
export type Tone = "a" | "b";

// Kontrakt kroku 2 formularza (opcjonalne szczegóły po sukcesie) — id muszą zgadzać się 1:1
// z SiteContent.contact.form.success.details.areaOptions/budgetOptions poniżej.
export type AreaId = "core" | "automation" | "rescue" | "web" | "not-sure";
export type BudgetId = "under-10k" | "10-30k" | "30-80k" | "80k-plus" | "no-idea";

export type Service = {
  id: ServiceId;
  tone: Tone;
  tag: string;
  headline: string;
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
  archived?: true; // case archiwalny (dziś: tylko international-automotive-sales-platform) — widoczny na /work/ w osobnej sekcji archiwum
};

export type ProcessStep = {
  number: "00" | "01" | "02" | "03" | "04";
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
  desktopOnly?: boolean; // panel back-office, tylko desktop — brak layoutu mobile (opcjonalne: reszta dem zostaje responsywna)
  uiLang: "pl" | "en"; // język interfejsu samego dema — steruje chipem "Interfejs po angielsku" (renderowanym TYLKO dla "en", patrz sections.demos.langChip)
  logoId?: "cadence" | "airlift"; // dema z własnym wordmarkiem/logo zamiast (lub obok) zrzutu ekranu — tylko nowa dwójka
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
  archiveHeading?: string; // nagłówek sekcji archiwum (tylko /work/)
  archiveIntro?: string; // linia wprowadzająca nad sekcją archiwum (tylko /work/)
};

export type SiteContent = {
  name: string;
  email: string;
  eyebrow: string;
  // Ujednolicona etykieta CTA nawigacji ("Zacznij projekt") — Nav.tsx/NavMobileMenu.tsx nie
  // hardkodują już własnego tekstu (2026-07-23 hero-demo-detail-slider design, CTA-consistency
  // sub-feature). Ten sam label co hero.*.ctaPrimary, ale osobne pole: komponenty nie hardkodują
  // treści.
  navCta: string;
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
    services: {
      line1: string; line2: string; pricingCta: string; pricingPrompt: string;
      // 2026-07-22 services-slider design — the one-tile-per-view slider that replaced the
      // 2×2 card grid + service modal (docs/superpowers/specs/2026-07-22-services-slider-
      // design.md). sliderLabel is the carousel's uppercase eyebrow/aria-label; the rest are
      // the tile's section labels/CTAs, transplanted verbatim from the retired service modal.
      sliderLabel: string;
      overviewLabel: string;
      fitLabel: string;
      deliverLabel: string;
      approachLabel: string;
      proofLabel: string;
      readCaseCta: string;
      cta: string;
      note: string;
    };
    process: { line1: string; line2: string };
    cases: {
      line1: string; line2: string; intro: [string, string]; footnote: string; seeAllCta: string;
      calendly: { prompt: string; cta: string };
    };
    demos: {
      line1: string; line2: string;
      langChip: string; // etykieta chipu renderowanego TYLKO na kartach/w modalu dem z Demo.uiLang === "en" (nie: globalny chip sekcji)
      cta: string; footnote: string;
      seeAllCta: string; detailCta: string; liveCta: string; techLegend: string;
      // "Kluczowe przepływy" — etykieta sekcji features w DemoModalContent ORAZ w pełno-
      // szczegółowych kafelkach HeroDemoSlider (2026-07-23 hero-demo-detail-slider design).
      flowsLegend: string;
      desktopNote: string;
      calendly: { prompt: string; cta: string };
    };
  };
  modals: { caseNote: string; demoNote: string }; // stopki modali (≈finePrint/footnote, ale z różnicami — 1:1 z prototypu). serviceNote przeniesiony do sections.services.note (2026-07-22 services-slider design — modal usługi zniesiony).
  contact: {
    heading: string;
    paragraph: string;
    checks: string[]; // 3 pozycje
    talk: { title: string; body: string; cta: string };
    form: {
      title: string;
      intro: string; // linia pod tytułem
      fields: { name: string; email: string; message: string };
      messagePlaceholder: string;
      submit: string;
      submitting: string;
      fieldErrors: { name: string; emailRequired: string; emailInvalid: string; message: string };
      submitError: string;
      finePrint: string;
      success: {
        heading: string;
        paragraph: string;
        again: string;
        details: {
          areaLegend: string;
          areaOptions: { id: AreaId; label: string }[];
          budgetLegend: string;
          budgetOptions: { id: BudgetId; label: string }[];
          phoneLabel: string;
          phoneInvalid: string;
          submit: string;
          submitting: string;
          skip: string;
          done: string;
          error: string;
        };
      };
    };
  };
  work: Work;
  demosPage: Work; // /demos/ subpage — reuses the Work shape (meta/heading/lead/calendly/startLabel)
  notFound: { heading: string; text: string; back: string };
  // Consent banner copy (2026-07-22 GA4 + Consent Mode addendum) — settingsLabel doubles as
  // both the footer "Cookie settings" link text and the banner's aria-label (role="region").
  consent: { text: string; accept: string; decline: string; settingsLabel: string };
};

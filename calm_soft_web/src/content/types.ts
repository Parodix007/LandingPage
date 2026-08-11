export type ServiceId = "web" | "automation" | "core" | "refactor";
export type Tone = "a" | "b";

// Kontrakt kroku 2 formularza (opcjonalne szczegóły po sukcesie) — id muszą zgadzać się 1:1
// z SiteContent.contact.form.success.details.areaOptions/budgetOptions poniżej.
export type AreaId = "core" | "automation" | "rescue" | "web" | "not-sure";
export type BudgetId = "under-10k" | "10-30k" | "30-80k" | "80k-plus" | "no-idea";

export type NamedItem = { n: string; d: string };

// Grupa w obrębie ServiceSection. `group` jest opcjonalne: sekcja bez podziału to jedna
// grupa bez etykiety, dzięki czemu widok ma jedną ścieżkę renderowania zamiast dwóch.
export type ServiceSectionGroup = { group?: string; items: NamedItem[] };

// Sekcja nazwanych bytów na stronie usługi: „Z jakimi systemami pracuję",
// „Co najczęściej automatyzuję", „Na czym buduję". Jeden kształt obsługuje wszystkie trzy —
// różni je wyłącznie heading i zawartość groups (2026-07-31 service-pages-restructure design).
export type ServiceSection = { heading: string; intro?: string; groups: ServiceSectionGroup[] };

export type Service = {
  id: ServiceId;
  tone: Tone;
  tag: string;
  headline: string;
  intro: string;
  fit: string[]; // 4 pozycje
  deliver: NamedItem[]; // 5–6 pozycji
  approach: string;
  relatedSlugs: string[]; // slugi case studies (NIE indeksy)
  // Linie rozwiązań, których ta usługa jest źródłem (2026-07-26 services-solutions crosslink
  // design) — pole WYMAGANE, `[]` dla usług bez linii, żeby brak mapowania był jawną decyzją.
  // Kierunek odwrotny (linia → usługa) jest wyprowadzany przez getServiceForLine, nie
  // duplikowany jako pole na SolutionLine.
  solutionSlugs: SolutionLineSlug[];
  // Segment adresu /uslugi/<slug>/ — NIE równy `id`. `id` jest nośne: czyta je deep-link
  // ?usluga= w ServicesSlider i dzieli słownictwo z AreaId, więc nie może się zmienić pod adres.
  // Adres potrzebuje osobnego, polskiego, frazowego segmentu (2026-07-31
  // service-pages-restructure design).
  slug: string;
  metaTitle: string;
  metaDescription: string;
  // Osobny od `headline`: headline to hak slidera, pageH1 niesie frazę, na którą licytuje
  // kampania — różne zadania, więc różna treść (2026-07-31 service-pages-restructure design).
  pageH1: string;
  // Puste `[]` nadal znaczy „sekcja się nie renderuje" (ten sam wzorzec co SolutionLine.price,
  // patrz SolutionLineBlock.tsx) — ale od etapu 2 to nie jest prawdą dla wszystkich usług: `core`
  // i `automation` mają już treść, `web` i `refactor` czekają na materiał od właściciela.
  pageSections: ServiceSection[];
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
  tagline: string; // nagłówek modala (element z id="modal-headline")
  detail: string; // dłuższy akapit w modalu detali
  features: string[]; // 3–6 kluczowych przepływów (bullety w modalu)
  shot: string; // /demo-shots/<slug>.webp — zrzut makiety (lazy <img> na kartach + w modalu)
  shotAlt: string; // tekst alternatywny zrzutu
  href: string; // root-relative /demo/<slug>/index.html — otwierany w nowej karcie
  desktopOnly?: boolean; // panel back-office, tylko desktop — brak layoutu mobile (opcjonalne: reszta dem zostaje responsywna)
  uiLang: "pl" | "en"; // język interfejsu samego dema — steruje chipem "Interfejs po angielsku" (renderowanym TYLKO dla "en", patrz sections.demos.langChip)
  logoId?: "cadence" | "airlift" | "puls"; // dema z własnym wordmarkiem/logo zamiast (lub obok) zrzutu ekranu — dziś trójka: cadence, airlift, puls
};

// /pricing/ page content — 2026-08-11 pricing-single-rate collapse (owner decision): the
// 20-card/6-group grid + dual filter set gave way to one hourly rate. `rate` carries the number
// and how the full price is derived; `badges` carries trust signals; `lead` carries the T&M
// billing model — three different jobs, kept as three fields on purpose.
export type PricingPage = {
  heading: { line1: string; line2: string };
  lead: string;
  rate: { amount: string; unit: string; note: string };
  badges: string[];
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
  footerLinks: { label: string; href: string }[]; // root-relative: /#services itd.
  hero: {
    aurora: { h1: string; lead: string; ctaPrimary: string; ctaSecondary: string };
    code: {
      h1: string; lead: string; ctaPrimary: string; ctaPricing: string;
      // Eyebrow/aria-label for HeroCaseSlider (2026-07-31 service-pages-restructure design) —
      // the hero's right-column carousel over site.featuredCaseSlugs. Replaces the retired
      // demoLabel ("Rozwiązania na żywo"), which labelled the mockup slider this one replaces.
      casesLabel: string;
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
      // Etykieta nad rzędem linków usługa → rozwiązania w kafelku slidera (2026-07-26
      // services-solutions crosslink design).
      solutionsLabel: string;
      // Link kafelka slidera → jego strona usługi /uslugi/<slug>/ (2026-07-31 service-pages-
      // restructure design).
      detailsCta: string;
    };
    process: { line1: string; line2: string };
    cases: {
      line1: string; line2: string; intro: [string, string]; footnote: string; seeAllCta: string;
      calendly: { prompt: string; cta: string };
    };
    demos: {
      langChip: string; // etykieta chipu renderowanego TYLKO na kartach/w modalu dem z Demo.uiLang === "en" (nie: globalny chip sekcji)
      detailCta: string; liveCta: string; techLegend: string;
      // "Kluczowe przepływy" — etykieta sekcji features w DemoModalContent (2026-07-23
      // hero-demo-detail-slider design; ta sekcja żyje dziś w SolutionLineBlock na /uslugi/<slug>/).
      flowsLegend: string;
      desktopNote: string;
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
  notFound: { heading: string; text: string; back: string };
  // Consent banner copy (2026-07-22 GA4 + Consent Mode addendum) — settingsLabel doubles as
  // both the footer "Cookie settings" link text and the banner's aria-label (role="region").
  consent: { text: string; accept: string; decline: string; settingsLabel: string };
};

// /rozwiazania/ taksonomia (2026-07-26 solutions restructure design) — grupuje istniejące 7 dem
// w pięć linii produktowych na dwóch poziomach (branżowe / operacyjne). Osobna od `Demo`:
// dema zostają identyfikowane po `slug` i nie wiedzą nic o tej taksonomii, więc jedna makieta
// może być składnikiem jednej linii bez duplikowania jej opisu w demos.ts.
export type SolutionLineSlug =
  | "weterynaria"
  | "kliniki-laboratoria"
  | "automatyzacje"
  | "migracje"
  | "integracje";

export type SolutionDemoItem = {
  demoSlug: string;   // rozwiązywany przez getDemoBySlug — nieudana resolucja jest odfiltrowywana
  text: string;
  openCta: string;
};

export type SolutionAside = { label: string; body: string };

export type SolutionProof = { label: string; body: string; caseSlug: string; cta: string };

// Kwoty per linia dochodzą w osobnym etapie (właściciel jeszcze ich nie podał) — pole jest
// opcjonalne, a widoki renderują blok ceny tylko wtedy, gdy istnieje.
export type SolutionPrice = { asIs: string; custom: string };

export type SolutionLine = {
  slug: SolutionLineSlug;
  kicker: string;
  headline: string;
  intro: string[];
  items: SolutionDemoItem[];
  audience: string;
  caveat?: SolutionAside;
  proof?: SolutionProof;
  price?: SolutionPrice;
};

export type SolutionGroup = {
  slug: "branzowe" | "operacyjne";
  eyebrow: string;
  sub: string;
  tone: "accent" | "accent2";
  lines: SolutionLine[];
};

export type SolutionsContent = {
  page: {
    mechanism: { heading: string; body: string[]; noDiscoverLabel: string; noDiscover: string };
    paths: {
      heading: string;
      asIs: { title: string; body: string };
      custom: { title: string; body: string };
    };
    clickLabel: string;
    audienceLabel: string;
    // Etykieta nad linkiem linia → usługa w SolutionLineBlock (2026-07-26 services-solutions
    // crosslink design).
    serviceLabel: string;
    // Chip nad sekcją propozycji na /uslugi/<slug>/ — wymóg właściciela: makieta ma być
    // WYRAŹNIE oznaczona jako propozycja, nie gotowy produkt (2026-07-31 service-pages-
    // restructure design).
    proposalLabel: string;
  };
  groups: SolutionGroup[];
};

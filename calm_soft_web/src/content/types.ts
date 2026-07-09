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

export type HeroCodeToken = { kind: "kw" | "fn" | "str" | "ok" | "plain"; text: string };

export type HeroTitleSegment = { tone: "brand" | "accent" | "muted"; text: string };

export type SiteContent = {
  name: string;
  email: string;
  eyebrow: string;
  featuredCaseSlug: string; // case z pozycji 0 prototypu
  footerLinks: { label: string; href: string }[]; // root-relative: /#services itd.
  hero: {
    aurora: { h1: string; lead: string; ctaPrimary: string; ctaSecondary: string };
    code: {
      h1: string; lead: string; ctaPrimary: string; ctaSecondary: string;
      window: { title: HeroTitleSegment[]; lines: HeroCodeToken[][] };
    };
    type: { line1: string; line2: string; lead: string; ctaPrimary: string; ctaSecondary?: string };
  };
  sections: {
    services: { line1: string; line2: string };
    process: { line1: string; line2: string };
    cases: { line1: string; line2: string; footnote: string };
  };
  modals: { serviceNote: string; caseNote: string }; // stopki modali (≈finePrint/footnote, ale z różnicami — 1:1 z prototypu)
  contact: {
    heading: string;
    paragraph: string;
    checks: string[]; // 3 pozycje
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
  notFound: { heading: string; text: string; back: string };
};

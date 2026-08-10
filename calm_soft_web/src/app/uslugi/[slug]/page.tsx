import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cases, getCaseBySlug } from "@/content/cases";
import { demos } from "@/content/demos";
import { services, getServiceBySlug } from "@/content/services";
import { getSolutionLineBySlug, solutions } from "@/content/solutions";
import { site } from "@/content/site";
import { InquiryProvider } from "@/components/providers/InquiryProvider";
import { ModalProvider } from "@/components/providers/ModalProvider";
import { Chip } from "@/components/ui/Chip";
import { RichText } from "@/components/ui/RichText";
import { Watermark } from "@/components/ui/Watermark";
import { CardActions } from "@/components/interactive/CardActions";
import { SolutionLineBlock } from "@/components/sections/SolutionLineBlock";
import { Contact } from "@/components/sections/Contact";
import type { CaseStudy, SolutionLine, Tone } from "@/content/types";

// First dynamic route in this project (docs/superpowers/specs/2026-07-31-service-pages-
// restructure-design.md). generateStaticParams enumerates every `Service.slug`, so with
// `output: "export"` + `trailingSlash: true` this emits out/uslugi/<slug>/index.html per
// service, and the `notFound()` calls below are a type-safety net only — they can never
// actually trigger for a slug this function itself produced.
export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

// Next.js 16 passes `params` as a Promise — must be awaited (see node_modules/next/dist/docs/
// 01-app/03-api-reference/04-functions/generate-metadata.md and generate-static-params.md).
// metaTitle/metaDescription are stage-2 keyword-targeted copy (see services.ts) — all four
// services now carry campaign-phrase meta instead of the stage-1 tag/intro composite.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const title = service.metaTitle;
  const description = service.metaDescription;

  // metadataBase is inherited from layout.tsx — do not redeclare it here.
  return {
    title,
    description,
    alternates: { canonical: `/uslugi/${service.slug}/` },
    openGraph: {
      title,
      description,
      images: ["/og.png"],
      type: "website",
      url: `/uslugi/${service.slug}/`,
    },
  };
}

// Mirrors work/page.tsx's tone lookup (ui/ is frozen, so this small table is duplicated
// locally rather than shared — same precedent as work/page.tsx's own comment documents).
const TONE_CHIP: Record<Tone, "accent" | "accent2"> = {
  a: "accent",
  b: "accent2",
};

const HOVER_LIFT =
  "transition-[transform,border-color] duration-[350ms] hover:-translate-y-1 hover:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)] focus-within:-translate-y-1 focus-within:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)]";

const H2_CLASS = "text-[26px] font-bold leading-[1.15] tracking-[-0.02em]";

// This page's named-item typography (name + description, used by both `deliver` and
// `pageSections`) deliberately differs from ServicesSlider.tsx's identical-looking list, which
// runs 13-14.5px: the slider must fit an entire service inside one carousel tile, so it has to
// go small. This is a full-width subpage with no such constraint, so it holds the scale already
// used elsewhere on subpages instead — 16px name (matching /work/'s h3 card title) and 15px
// description at 1.55 line-height (matching the as-is/custom path cards and SolutionLineBlock
// further down this same page). Do not shrink these back to match the slider.
const NAMED_ITEM_NAME = "text-[16px] font-semibold text-ink";
const NAMED_ITEM_DESC = "text-[15px] leading-[1.55] text-ink-60";
const NAMED_ITEM_GRID =
  "grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-[12px_20px]";

// Mirrors SECTION_LABEL from ServicesSlider.tsx (also used by SolutionLineBlock.tsx via
// identical classes): the site-wide convention for a label sitting above a group of items.
// Duplicated locally rather than imported because ui/ and interactive/ are frozen and
// ServicesSlider is a client leaf — same precedent TONE_CHIP and HOVER_LIFT document above.
const GROUP_LABEL_CLASS = "mb-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-accent";

// Case-card markup transplanted from work/page.tsx's CaseCard (same duplication precedent that
// file documents) — one difference: the card heading is an <h3> here because it sits under this
// page's own "proofLabel" <h2>, whereas work/page.tsx's grid has no wrapping <h2> above it.
function CaseCard({ c }: { c: CaseStudy }) {
  return (
    <div
      className={`card-host relative flex flex-col gap-3 overflow-hidden rounded-[var(--radius-grid-card)] border border-border-08 bg-surface p-7 ${HOVER_LIFT}`}
    >
      {/* Decorative glow + mono watermark — purely presentational, hidden from AT. */}
      <span
        aria-hidden="true"
        className="card-glow -right-[80px] -top-[80px] h-[220px] w-[220px] [--glow-color:color-mix(in_oklch,var(--color-accent)_16%,transparent)]"
      />
      <span aria-hidden="true" className="absolute right-[26px] top-6">
        <Watermark />
      </span>

      <span className="self-start">
        <Chip tone={TONE_CHIP[c.tone]}>{c.tag}</Chip>
      </span>
      <div className="text-[30px] font-bold leading-none tracking-[-0.03em] text-accent">{c.m1v}</div>
      <h3 className="text-[16px] font-semibold leading-[1.3]">{c.headline}</h3>
      <span className="text-[13px] text-ink-50">{c.client}</span>
      <div className="mt-auto pt-2">
        <CardActions
          kind="case-card"
          caseSlug={c.slug}
          readLabel={site.sections.services.readCaseCta}
          ariaLabel={`${site.sections.services.readCaseCta} ${c.client}`}
        />
      </div>
    </div>
  );
}

// Server component — no 'use client' on the page itself (CLAUDE.md client/server boundary), but
// it wraps its content in InquiryProvider + ModalProvider exactly like work/page.tsx and
// demos/page.tsx, so the case-study "Read the story" cards and the SolutionLineBlock demo cards
// below can open the same modals used elsewhere on the site. <Contact/> carries its own
// id="contact", which is why every existing CTA (nav, footer, hero, modal, slider tile) that
// calls lib/scroll.ts's scrollToContact() automatically retargets to this page's local form —
// no changes needed there (see design doc "#contact needs no new plumbing").
//
// Heading order (contract, see design doc): h1 → h2 pageSections[] (h3 per named group; all four
// services now carry content) → h2 fit → h2 deliver → h2 approach →
// h2 proof (h3 per case card) → h2 proposal → h3 mechanism.heading → h3 per solution line (h4 per
// demo card, both inside SolutionLineBlock) → <Contact/>.
export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const relatedCases = service.relatedSlugs
    .map((caseSlug) => getCaseBySlug(caseSlug))
    .filter((c): c is CaseStudy => Boolean(c));

  const resolvedLines = service.solutionSlugs
    .map((lineSlug) => getSolutionLineBySlug(lineSlug))
    .filter((l): l is SolutionLine => Boolean(l));

  return (
    <InquiryProvider>
      <ModalProvider cases={cases} demos={demos}>
        <div className="reveal-group mx-auto max-w-[1200px] px-6 py-[72px] min-[900px]:py-[110px]">
          <header className="mb-4">
            <Chip tone={TONE_CHIP[service.tone]}>{service.tag}</Chip>
            <h1 className="mt-4 text-[clamp(36px,4.5vw,56px)] font-bold leading-[1.05] tracking-[-0.025em]">
              {service.pageH1}
            </h1>
            {/* headline jako podtytuł: to jest hak, który renderuje się też na stronie głównej
                w sliderze usług, a pageH1 niesie frazę kampanii — obie linie mają swoją rolę
                i obie zostają (2026-07-31 service-pages-restructure design, etap 2). Akapit, nie
                nagłówek — nie zaburza kolejności h1 → h2. */}
            <p className="mt-3 max-w-[600px] text-[20px] font-medium leading-[1.4] text-ink-85">
              {service.headline}
            </p>
            <p className="mt-4 max-w-[600px] text-[18px] leading-[1.55] text-ink-70">
              {service.intro}
            </p>
          </header>

          {/* pageSections is non-empty for all four services as of etap 2 (the `.length > 0` guard
              stays as a defensive no-render path, same treatment as SolutionLineBlock's
              line.price: "this block intentionally renders nothing until content supplies it. Do
              not invent figures."). Placed ahead of fit/deliver: this is the content the visitor
              clicked an ad for, so it belongs above the fold, not after the benefits list. */}
          {service.pageSections.length > 0 &&
            service.pageSections.map((section, i) => (
              <section key={section.heading} aria-labelledby={`page-section-${i}`} className="reveal-group mt-16">
                <h2 id={`page-section-${i}`} className={H2_CLASS}>
                  {section.heading}
                </h2>
                {/* section.intro and item.d go through RichText (keyword emphasis, 2026-07-27
                    design extended to pageSections): this page is the ONLY renderer of
                    pageSections, unlike service.intro/fit/deliver/approach, which
                    ServicesSlider on the home page also renders — as plain text, with no
                    RichText. A `**` marker in those shared fields would leak onto the home
                    page as literal asterisks, so they stay unmarked; pageSections is where
                    markers are safe. item.n stays plain text: it's a proper noun (system
                    name), already set apart structurally via font-semibold text-ink. */}
                {section.intro && (
                  <p className="mt-4 max-w-[720px] text-[16px] leading-[1.6] text-ink-70">
                    <RichText>{section.intro}</RichText>
                  </p>
                )}
                {section.groups.map((group, gi) => (
                  <div key={group.group ?? gi} className="mt-6">
                    {group.group && (
                      <h3 className={GROUP_LABEL_CLASS}>{group.group}</h3>
                    )}
                    <div className={NAMED_ITEM_GRID}>
                      {group.items.map((item) => (
                        <div key={item.n} className="flex flex-col gap-[3px]">
                          <p className={NAMED_ITEM_NAME}>{item.n}</p>
                          <p className={NAMED_ITEM_DESC}>
                            <RichText>{item.d}</RichText>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            ))}

          <section aria-labelledby="fit-heading" className="reveal-group mt-16">
            <h2 id="fit-heading" className={H2_CLASS}>
              {site.sections.services.fitLabel}
            </h2>
            <ul className="mt-6 flex flex-col gap-[9px]">
              {service.fit.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span aria-hidden="true" className="text-[16px] leading-[1.6] text-accent">
                    ✓
                  </span>
                  <span className="text-[16px] leading-[1.6] text-ink-70">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="deliver-heading" className="reveal-group mt-16">
            <h2 id="deliver-heading" className={H2_CLASS}>
              {site.sections.services.deliverLabel}
            </h2>
            <div className={`mt-6 ${NAMED_ITEM_GRID}`}>
              {service.deliver.map((d) => (
                <div key={d.n} className="flex flex-col gap-[3px]">
                  <p className={NAMED_ITEM_NAME}>{d.n}</p>
                  <p className={NAMED_ITEM_DESC}>{d.d}</p>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="approach-heading" className="reveal-group mt-16">
            <h2 id="approach-heading" className={H2_CLASS}>
              {site.sections.services.approachLabel}
            </h2>
            <p className="mt-4 max-w-[720px] text-[16px] leading-[1.6] text-ink-70">
              {service.approach}
            </p>
          </section>

          {relatedCases.length > 0 && (
            <section aria-labelledby="proof-heading" className="reveal-group mt-16">
              <h2 id="proof-heading" className={H2_CLASS}>
                {site.sections.services.proofLabel}
              </h2>
              <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,330px),1fr))] gap-4">
                {relatedCases.map((c) => (
                  <CaseCard key={c.slug} c={c} />
                ))}
              </div>
            </section>
          )}

          {/* Proposal section — only when this service has at least one resolved solution line
              (refactor's solutionSlugs is `[]`, so /uslugi/legacy/ skips this entirely; see
              design doc "/uslugi/legacy/ has no mockup"). proposalLabel is now the section's own
              h2 (previously a Chip above a separate h2) — the "propozycja, nie gotowy produkt"
              framing itself lives in the copy below (mechanism.heading/body, noDiscover), not in
              the markup. */}
          {resolvedLines.length > 0 && (
            <section aria-labelledby="proposal-heading" className="reveal-group mt-16">
              <h2 id="proposal-heading" className={H2_CLASS}>
                {solutions.page.proposalLabel}
              </h2>
              {/* h3 in between H2_CLASS (26px bold) and the paragraph copy. 18px font-semibold is
                  taken from this site's existing vocabulary: Contact.tsx's
                  `text-[18px] font-semibold text-ink` (site.contact.talk.title) and
                  PricingExplorer.tsx's `text-[18px] font-semibold text-ink-85` (price.label);
                  leading-[1.3] repeats the font-semibold h3 pattern already used on this page
                  (CaseCard above) and in work/page.tsx. */}
              <h3 className="mt-4 text-[18px] font-semibold leading-[1.3] text-ink">
                {solutions.page.mechanism.heading}
              </h3>
              <div className="mt-4 flex flex-col gap-4">
                {solutions.page.mechanism.body.map((paragraph) => (
                  <p key={paragraph} className="max-w-[720px] text-[16px] leading-[1.6] text-ink-70">
                    {paragraph}
                  </p>
                ))}
              </div>
              <p className="mt-4 max-w-[720px] text-[16px] leading-[1.6] text-ink-70">
                <strong className="text-ink">{solutions.page.mechanism.noDiscoverLabel}</strong>{" "}
                {solutions.page.mechanism.noDiscover}
              </p>

              <div className="mt-6 grid grid-cols-1 gap-6 min-[700px]:grid-cols-2">
                <div className="rounded-[var(--radius-card)] border border-border-08 bg-surface p-[32px]">
                  <strong className="text-[18px] font-bold text-ink">
                    {solutions.page.paths.asIs.title}
                  </strong>
                  <p className="mt-3 text-[15px] leading-[1.55] text-ink-70">
                    {solutions.page.paths.asIs.body}
                  </p>
                </div>
                <div className="rounded-[var(--radius-card)] border border-border-08 bg-surface p-[32px]">
                  <strong className="text-[18px] font-bold text-ink">
                    {solutions.page.paths.custom.title}
                  </strong>
                  <p className="mt-3 text-[15px] leading-[1.55] text-ink-70">
                    {solutions.page.paths.custom.body}
                  </p>
                </div>
              </div>

              <div className="mt-12 flex flex-col gap-16">
                {resolvedLines.map((line) => (
                  <SolutionLineBlock
                    key={line.slug}
                    line={line}
                    clickLabel={solutions.page.clickLabel}
                    audienceLabel={solutions.page.audienceLabel}
                    serviceLabel={solutions.page.serviceLabel}
                    asIsLabel={solutions.page.paths.asIs.title}
                    customLabel={solutions.page.paths.custom.title}
                    hideServiceLink
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <Contact />
      </ModalProvider>
    </InquiryProvider>
  );
}

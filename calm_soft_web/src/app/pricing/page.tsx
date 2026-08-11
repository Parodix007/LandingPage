import type { Metadata } from "next";
import { pricing } from "@/content/pricing";
import { RichText, stripEmphasis } from "@/components/ui/RichText";
import { Contact } from "@/components/sections/Contact";

const title = "Cennik — calm_soft";
const description = stripEmphasis(pricing.lead);

// metadataBase is inherited from layout.tsx — do not redeclare it here.
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/pricing/" },
  openGraph: {
    title,
    description,
    images: ["/og.png"],
    type: "website",
    url: "/pricing/",
  },
};

// Server component — no 'use client', no providers (the page needs no inquiry/modal state).
// Nav/Footer come from layout.tsx automatically. 2026-08-11 pricing-single-rate collapse: the
// former 20-card/6-group grid with a category/price filter pair gave way to one rate block (see
// src/content/pricing.ts). `RichText` renders the `**...**` emphasis markers in lead/rate.note/
// badges; `stripEmphasis` above strips them for the <meta> description so they never leak as
// literal asterisks. The page closes with its own <Contact /> section (id="contact"), which
// carries the page's only Calendly CTA. A standalone, centered CalendlyCta used to sit above it;
// it was removed 2026-08-11 on the owner's instruction because it duplicated the CTA in the
// "let's talk first" card a few hundred pixels below. Do not restore it.
export default function PricingPage() {
  return (
    <>
      {/* Padding is intentionally asymmetric: top is the page's breathing room under the nav,
          bottom is kept small because the following <Contact /> section brings its own
          py-[120px]. Symmetric py- here duplicated that spacing and left ~230px of empty
          space that hid the fact that a form sits below it. Do not "fix" this back to py-. */}
      <div className="reveal-group mx-auto max-w-[1200px] px-6 pt-[72px] pb-[32px] min-[900px]:pt-[110px] min-[900px]:pb-[40px]">
        <header className="mb-4">
          {/* Not SectionHeading (frozen, hardcoded h2) — same visual classes on a real h1, since
              this is a standalone page rather than a same-page section. */}
          <h1 className="m-0 text-[clamp(36px,4.5vw,56px)] font-bold leading-[1.05] tracking-[-0.025em]">
            {pricing.heading.line1}
            <br />
            <span className="text-ink-50">{pricing.heading.line2}</span>
          </h1>
          <p className="mt-4 max-w-[600px] text-[18px] leading-[1.55] text-ink-70">
            <RichText>{pricing.lead}</RichText>
          </p>
        </header>

        {/* Rate block — same card shell as the rest of this page (card-host, radius-card,
            border-08, bg-surface) and the same amount/unit baseline layout the retired PriceRow
            used for its "from" variant (flex flex-wrap items-baseline gap-2), just scaled up. */}
        <div className="card-host mt-12 rounded-[var(--radius-card)] border border-border-08 bg-surface p-[40px_32px] text-center">
          <div className="flex flex-wrap items-baseline justify-center gap-2">
            <span className="text-[clamp(40px,6vw,64px)] font-bold tracking-[-0.02em] text-accent">
              {pricing.rate.amount}
            </span>
            <span className="text-[20px] text-ink-50">{pricing.rate.unit}</span>
          </div>
          <p className="mx-auto mt-4 max-w-[560px] text-[15px] leading-[1.55] text-ink-70">
            <RichText>{pricing.rate.note}</RichText>
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-[10px]">
          {pricing.badges.map((badge) => (
            // Inner <span> is load-bearing, not redundant: this container is inline-flex, RichText
            // returns several sibling nodes (a <strong> plus surrounding text), and flex trims
            // whitespace at the edges of anonymous flex items — dropping this wrapper re-collapses
            // the space and glues "Bezpłatna" to "rozmowa". One wrapper = one flex item = normal
            // inline whitespace handling inside it.
            <span
              key={stripEmphasis(badge)}
              className="inline-flex items-center rounded-[var(--radius-pill)] border border-border-12 px-4 py-2 text-[13.5px] font-medium text-ink-70"
            >
              <span>
                <RichText>{badge}</RichText>
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Contact renders as a sibling AFTER the container above, not nested inside it — it needs
          the full page width and its own radial glow, which the max-w-[1200px] container would
          clip. No InquiryProvider/ModalProvider here: this page has no CardActions or modals to
          wire up, and ContactForm's useRegisterContactFocus has a safe no-op default without one
          (see the comment at the end of InquiryProvider.tsx). Adding a provider here would just
          be an unnecessary client boundary. */}
      <Contact />
    </>
  );
}

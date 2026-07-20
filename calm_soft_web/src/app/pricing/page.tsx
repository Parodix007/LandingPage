import type { Metadata } from "next";
import { pricing } from "@/content/pricing";
import { CalendlyCta } from "@/components/interactive/CalendlyCta";
import { PricingExplorer } from "@/components/interactive/PricingExplorer";

const title = "Pricing — calm_soft";
const description = pricing.lead;

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
// Nav/Footer come from layout.tsx automatically. Full EN translation of ..\cennik.html, visual
// spec ..\cennik-design-handoff.md (2026-07-20 pricing/Calendly/reorder design doc).
export default function PricingPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-[72px] min-[900px]:py-[110px]">
      <header className="mb-4">
        {/* Not SectionHeading (frozen, hardcoded h2) — same visual classes on a real h1, since
            this is a standalone page rather than a same-page section. */}
        <h1 className="m-0 text-[clamp(36px,4.5vw,56px)] font-bold leading-[1.05] tracking-[-0.025em]">
          {pricing.heading.line1}
          <br />
          <span className="text-ink-50">{pricing.heading.line2}</span>
        </h1>
        <p className="mt-4 max-w-[600px] text-[18px] leading-[1.55] text-ink-70">{pricing.lead}</p>
        <div className="mt-6 flex flex-wrap gap-[10px]">
          {pricing.badges.map((badge) => (
            <span
              key={badge}
              className="inline-flex items-center rounded-[var(--radius-pill)] border border-border-12 px-4 py-2 text-[13.5px] font-medium text-ink-70"
            >
              {badge}
            </span>
          ))}
        </div>
      </header>

      <PricingExplorer groups={pricing.groups} filters={pricing.filters} />

      <div className="mt-16 rounded-[var(--radius-card)] border border-border-08 bg-surface p-[40px_32px] text-center">
        <p className="mx-auto mb-2 max-w-[780px] text-[15px] text-ink-70">{pricing.foot.billing}</p>
        <p className="mx-auto max-w-[780px] text-[15px] text-ink-70">{pricing.foot.fine}</p>
        <div className="mt-6 flex justify-center">
          <CalendlyCta variant="filled" label={pricing.ctaLabel} />
        </div>
      </div>
      <p className="mt-7 text-center text-[13px] text-ink-50">{pricing.disclaimer}</p>
    </div>
  );
}

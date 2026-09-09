import type { SalesContactCopy } from "@/content/serviceSales";
import { CalendlyCta } from "@/components/interactive/CalendlyCta";
import { ContactForm } from "@/components/interactive/ContactForm";
import { HOVER_BORDER } from "@/components/ui/cardHover";

function CardGlow({ interactive = false }: { interactive?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`card-glow pointer-events-none -right-[80px] -top-[80px] h-[220px] w-[220px] [--glow-color:color-mix(in_oklch,var(--color-accent)_16%,transparent)] ${interactive ? "service-card-glow-interactive" : ""}`}
    />
  );
}

// Extracted 1:1 from ServiceSalesPage.tsx's private `Contact` function (2026-09-09
// ksef-product-pages design) so the KSeF product page can reuse the same contact-section
// markup without importing from a client-adjacent server module that also owns the sales-page
// composition. `page.contact.X` references became `copy.X`; `CardGlow` is duplicated locally
// (same precedent ServiceSalesPage.tsx's own comment documents for other frozen-boundary
// duplication) rather than exported, to keep this diff smaller.
export function SalesContact({ copy }: { copy: SalesContactCopy }) {
  return (
    <section id="contact" aria-labelledby="service-contact-heading" className="relative overflow-hidden border-t border-white/[0.06]">
      <span aria-hidden="true" className="pointer-events-none absolute bottom-[-140px] left-1/2 h-[420px] w-[1000px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,color-mix(in_oklch,var(--color-accent)_22%,transparent),transparent_70%)]" />
      <div className="reveal-group relative mx-auto grid max-w-[1200px] grid-cols-1 gap-16 px-6 py-[120px] pb-[100px] min-[900px]:grid-cols-[0.85fr_1.15fr]">
        <div className="reveal-group flex flex-col gap-6">
          <h2 id="service-contact-heading" className="text-[32px] font-bold">{copy.title}</h2>
          <p className="text-[18px] leading-[1.55] text-ink-70">{copy.intro}</p>
          <div className="mt-3 flex flex-col gap-3">
            {copy.checks.map((check) => (
              <div key={check} className="flex items-center gap-3">
                <span aria-hidden="true" className="text-[15px] text-accent">✓</span>
                <span className="text-[14.5px] text-ink-70">{check}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="reveal-group flex flex-col gap-6">
          <div className={`service-card relative overflow-hidden rounded-[var(--radius-card)] border border-border-08 bg-surface p-[28px_30px] ${HOVER_BORDER}`}>
            <CardGlow />
            <div className="relative z-[1]">
              <p className="text-[18px] font-semibold text-ink">{copy.calendlyTitle}</p>
              <p className="mt-2 text-[15px] leading-[1.55] text-ink-70">{copy.calendlyBody}</p>
              <div className="mt-4">
                <CalendlyCta variant="filled" label={copy.calendlyCta} />
              </div>
            </div>
          </div>
          <ContactForm introCopy={copy.form} />
        </div>
      </div>
    </section>
  );
}

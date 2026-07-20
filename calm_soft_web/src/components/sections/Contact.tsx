import { site } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ContactForm } from "@/components/interactive/ContactForm";
import { CalendlyCta } from "@/components/interactive/CalendlyCta";

// HANDOFF §8 — server component (SPEC §16 client/server boundary); interactivity lives in
// the 'use client' ContactForm leaf. Anchor target for nav/footer "/#contact" links and the
// modal CTA / "Start with this service ›" scroll destination (scroll-margin-top in globals.css).
export function Contact() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="relative overflow-hidden border-t border-white/[0.06]"
    >
      {/* Decorative bottom-center radial glow — purely presentational, hidden from AT. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-140px] left-1/2 h-[420px] w-[1000px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,color-mix(in_oklch,var(--color-accent)_22%,transparent),transparent_70%)]"
      />
      <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 gap-16 px-6 py-[120px] pb-[100px] min-[900px]:grid-cols-[0.85fr_1.15fr]">
        <div className="flex flex-col gap-6">
          <SectionHeading id="contact-heading" line1={site.contact.heading} />
          <p className="text-[18px] leading-[1.55] text-ink-70">{site.contact.paragraph}</p>
          <a
            href={`mailto:${site.email}`}
            className="text-[17px] font-medium text-accent hover:text-white"
          >
            {site.email}
          </a>
          <div className="mt-3 flex flex-col gap-3">
            {site.contact.checks.map((check) => (
              <div key={check} className="flex items-center gap-3">
                <span className="text-[15px] text-accent">✓</span>
                <span className="text-[14.5px] text-ink-70">{check}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="rounded-[var(--radius-card)] border border-border-08 bg-surface p-[28px_30px]">
            <p className="text-[18px] font-semibold text-ink">{site.contact.talk.title}</p>
            <p className="mt-2 text-[15px] leading-[1.55] text-ink-70">{site.contact.talk.body}</p>
            <div className="mt-4">
              <CalendlyCta variant="filled" label={site.contact.talk.cta} />
            </div>
          </div>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}

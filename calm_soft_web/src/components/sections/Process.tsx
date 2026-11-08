import { steps } from "@/content/steps";
import { site } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WATERMARK_MOBILE_PAD, Watermark } from "@/components/ui/Watermark";

// HANDOFF §5, SPEC §6.6 — anchor target for nav/footer "/#process" links. Sticky-stack
// (spec 2026-11-06 §4.4) replaced the old ProcessCarousel: server component now, zero JS,
// step cards stack under the sticky nav via `position: sticky` (offsets + killswitch live
// in globals.css `.process-stack` / `.stack-item`, brief #10B uogólnił selektor). Card markup mirrors the
// former carousel slide (card-host + card-glow + Watermark) so the resting look is intact.
// The SectionHeading (id="process-heading", referenced by aria-labelledby below) is the
// section's accessible name; step order in DOM equals reading order — no hidden slides.
export function Process() {
  const { line1, line2 } = site.sections.process;

  return (
    <section
      id="process"
      aria-labelledby="process-heading"
      className="mx-auto max-w-[1200px] px-6 py-[72px] min-[900px]:py-[110px]"
    >
      <div className="reveal-group">
        <SectionHeading id="process-heading" line1={line1} line2={line2} />

        <ol className="process-stack mt-12">
          {steps.map((s) => (
            <li
              key={s.number}
              className={`stack-item card-host relative grid min-h-[320px] grid-cols-1 gap-8 overflow-hidden rounded-[var(--radius-card)] border border-border-08 bg-surface p-8 min-[900px]:grid-cols-[0.9fr_1.1fr] min-[900px]:gap-14 min-[900px]:p-16 ${WATERMARK_MOBILE_PAD}`}
            >
              {/* Decorative glow + watermark — purely presentational, hidden from AT. */}
              <span
                aria-hidden="true"
                className="card-glow -right-[160px] -top-[160px] h-[460px] w-[460px] [--glow-color:color-mix(in_oklch,var(--color-accent)_16%,transparent)]"
              />
              <span className="absolute right-[34px] top-[28px] max-[899px]:right-[26px]">
                <Watermark />
              </span>

              <div className="relative flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[18px] text-accent">{s.number}</span>
                  {s.badge ? (
                    <span className="inline-flex items-center rounded-[var(--radius-pill)] border border-[color-mix(in_oklch,var(--color-accent2)_32%,transparent)] bg-[color-mix(in_oklch,var(--color-accent2)_15%,transparent)] px-4 py-1 text-[13.5px] leading-none text-ink">
                      {s.badge}
                    </span>
                  ) : null}
                </div>
                <h3 className="m-0 text-[clamp(34px,4vw,48px)] font-bold leading-[1.05] tracking-[-0.02em]">
                  {s.title}
                </h3>
              </div>

              <div className="relative">
                <p className="max-w-[560px] text-[18px] leading-[1.6] text-ink-70">
                  {s.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

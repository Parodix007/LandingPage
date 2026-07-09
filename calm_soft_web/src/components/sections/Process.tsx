import { steps } from "@/content/steps";
import { ProcessCarousel } from "@/components/interactive/ProcessCarousel";

// HANDOFF §5, SPEC §6.6 — anchor target for nav/footer "/#process" links. Server component:
// the carousel's step state lives entirely in the 'use client' leaf (ProcessCarousel); this
// section only lays out the container and supplies the static `steps` content. The
// SectionHeading (id="process-heading", referenced by aria-labelledby below) is rendered
// inside ProcessCarousel's header row, next to the prev/next arrows.
export function Process() {
  return (
    <section
      id="process"
      aria-labelledby="process-heading"
      className="mx-auto max-w-[1200px] px-6 py-[72px] min-[900px]:py-[110px]"
    >
      <ProcessCarousel steps={steps} />
    </section>
  );
}

import type { ReactElement } from "react";

// The first primitive in `ui/` that parses a string instead of treating `children` as opaque
// content — `Chip`, `WarningNote`, `TechStack` and the pills all render their children verbatim.
// SPEC 2026-07-27 keyword-emphasis-and-audience-block-design introduces a `**phrase**` marker
// convention inside existing `src/content/` strings so copy stays plain, editable text instead
// of splitting into segment arrays or growing new `keywords` fields (Polish inflection makes
// string-matched keyword lists unreliable). This component is the one place that understands the
// marker syntax and turns it into `<strong>`; no `<p>`/`<span>` wrapper — the caller owns the
// block element. No `'use client'`: pure function, no hooks, so it works in server components
// (`SolutionLineBlock`, `DemoModalContent`) and inside client trees (`HeroDemoSlider`) alike.
// Emphasis is never underlined — underline is reserved for links elsewhere on this site, and
// that distinction is the whole point of the marker (see spec §2).

const EMPHASIS = /\*\*([^*]+)\*\*/g;

export function RichText({ children }: { children: string }): ReactElement {
  const parts = children.split(EMPHASIS);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <strong key={index} className="font-semibold text-accent">
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}

// Strips the same `**` markers instead of rendering them — for the places a marked-up string has
// to reach an attribute (aria-label, alt, meta) rather than markup, and for tests asserting that
// a content edit only inserted markers: `stripEmphasis(next) === previous`.
export function stripEmphasis(text: string): string {
  return text.replace(EMPHASIS, "$1");
}

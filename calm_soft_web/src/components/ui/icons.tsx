import type { SVGProps } from "react";

// Shared decorative icons for circular icon-buttons (arrows, modal close). SVG so the glyph is
// geometrically centered on every OS/font — system-font ‹ › × metrics vary and never center
// cleanly. Always aria-hidden; the enclosing <button> carries the accessible name.
const ICON_BASE: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
};

export function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...ICON_BASE} {...props}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...ICON_BASE} {...props}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...ICON_BASE} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

// Warning triangle + exclamation (SPEC 2026-07-21 desktop-only-demo-note-design "Warning
// treatment"). Decorative only — WarningNote's sentence carries the meaning — so it stays
// aria-hidden like every other icon here. Geometrically centered in the 24×24 box.
export function WarningIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...ICON_BASE} {...props}>
      <path d="M12 3.5 22 20H2L12 3.5Z" strokeLinejoin="round" />
      <path d="M12 10v4" />
      <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

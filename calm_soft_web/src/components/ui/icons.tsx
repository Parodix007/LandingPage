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

import { PILL_FOCUS, PillElement, type PillAsProps, type PillSharedProps } from "./pillBase";

export type FilledPillSize = "nav" | "md" | "lg";

export type FilledPillProps = PillSharedProps & PillAsProps & { size?: FilledPillSize };

// HANDOFF "Interactions & Behavior": accent bg, black text, hover filter: brightness(1.15),
// transition: filter 0.25s ease. Weight fixed 600. Sizes:
//   nav = 15px/600, padding 8px 20px (Nav CTA)
//   md  = 15px/600, padding 12px 28px (modal footer, default)
//   lg  = 17px/600, padding 12px 28px (hero primary)
const SIZE_CLASSES: Record<FilledPillSize, string> = {
  nav: "px-5 py-2 text-[15px]",
  md: "px-7 py-3 text-[15px]",
  lg: "px-7 py-3 text-[17px]",
};

// hit-44 (SPEC §11.3): ≥44px tap area via ::before, without inflating the visual size.
const BASE =
  `hit-44 ${PILL_FOCUS} inline-flex items-center justify-center rounded-[var(--radius-pill)] bg-accent font-semibold leading-none text-black transition-[filter] duration-[250ms] hover:brightness-[1.15]`;

export function FilledPill({
  as,
  href,
  onClick,
  size = "md",
  children,
  "aria-label": ariaLabel,
}: FilledPillProps) {
  return (
    <PillElement
      as={as}
      href={href}
      className={`${BASE} ${SIZE_CLASSES[size]}`}
      onClick={onClick}
      ariaLabel={ariaLabel}
    >
      {children}
    </PillElement>
  );
}

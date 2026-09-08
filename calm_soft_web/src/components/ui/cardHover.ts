/** Homepage card hover: lift + accent border (CaseStudies, /work, legacy CaseCard, SolutionLineBlock, service sales cards). */
export const HOVER_LIFT =
  "transition-[transform,border-color] duration-[350ms] hover:-translate-y-1 hover:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)] focus-within:-translate-y-1 focus-within:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)]";

/** Border-only variant, same timing — non-clickable tiles (mirrors ServicesSlider tone "a"). */
export const HOVER_BORDER =
  "transition-[border-color] duration-[350ms] hover:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)] focus-within:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)]";

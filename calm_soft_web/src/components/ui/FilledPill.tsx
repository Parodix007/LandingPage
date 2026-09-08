import { PILL_FOCUS, PillElement, type PillAsProps, type PillSharedProps } from "./pillBase";

export type FilledPillSize = "nav" | "md" | "lg";

export type FilledPillProps = PillSharedProps & PillAsProps & { size?: FilledPillSize; className?: string };

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
  `hit-44 ${PILL_FOCUS} inline-flex items-center justify-center rounded-[var(--radius-pill)] bg-accent font-semibold leading-none text-black transition-[filter,transform,opacity] duration-[250ms] hover:brightness-[1.15]`;

export function FilledPill(props: FilledPillProps) {
  const size = props.size ?? "md";
  const className = `${BASE} ${SIZE_CLASSES[size]}${props.className ? ` ${props.className}` : ""}`;
  const ariaLabel = props["aria-label"];
  const ariaHidden = props["aria-hidden"];

  if (props.as === "a") {
    return <PillElement as="a" href={props.href} target={props.target} rel={props.rel} className={className} onClick={props.onClick} ariaLabel={ariaLabel} ariaHidden={ariaHidden} tabIndex={props.tabIndex}>{props.children}</PillElement>;
  }
  return <PillElement as="button" className={className} onClick={props.onClick} ariaLabel={ariaLabel} ariaHidden={ariaHidden} tabIndex={props.tabIndex}>{props.children}</PillElement>;
}

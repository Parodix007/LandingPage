import type { MouseEventHandler, ReactNode } from "react";

// Shared building blocks for FilledPill / GhostPill so the two frozen primitives can never
// diverge on focus handling, aria-label forwarding, or the button-vs-anchor branch.

// Discriminated union: `as='a'` REQUIRES href (a non-navigable <a> can't compile); the button
// variant forbids href. `as` omitted ⇒ button. (Contract extension recorded in SPEC §6.9.)
export type PillAsProps =
  | { as?: "button"; href?: never; target?: never; rel?: never; onClick?: MouseEventHandler<HTMLButtonElement> }
  | { as: "a"; href: string; target?: string; rel?: string; onClick?: MouseEventHandler<HTMLAnchorElement> };

export type PillSharedProps = {
  "aria-label"?: string;
  "aria-hidden"?: boolean;
  tabIndex?: number;
  children: ReactNode;
};

// SPEC §11.2: every interactive control needs a visible keyboard-focus indicator. We never
// clear the native outline without a replacement — this swaps it for an accent ring offset
// against the canvas so it reads on both the dark surface and inside modals.
export const PILL_FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]";

export type PillElementProps = PillSharedProps & PillAsProps & {
  className: string;
  ariaLabel?: string;
  ariaHidden?: boolean;
};

export function PillElement(props: PillElementProps) {
  const { className, ariaLabel, ariaHidden, tabIndex, children } = props;
  if (props.as === "a") {
    return (
      <a href={props.href} target={props.target} rel={props.rel} onClick={props.onClick} aria-label={ariaLabel} aria-hidden={ariaHidden} tabIndex={tabIndex} className={className}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={props.onClick} aria-label={ariaLabel} aria-hidden={ariaHidden} tabIndex={tabIndex} className={className}>
      {children}
    </button>
  );
}

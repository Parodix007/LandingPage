import type { ReactNode } from "react";

// Shared building blocks for FilledPill / GhostPill so the two frozen primitives can never
// diverge on focus handling, aria-label forwarding, or the button-vs-anchor branch.

// Discriminated union: `as='a'` REQUIRES href (a non-navigable <a> can't compile); the button
// variant forbids href. `as` omitted ⇒ button. (Contract extension recorded in SPEC §6.9.)
export type PillAsProps = { as?: "button"; href?: never } | { as: "a"; href: string };

export type PillSharedProps = {
  onClick?: () => void;
  "aria-label"?: string;
  children: ReactNode;
};

// SPEC §11.2: every interactive control needs a visible keyboard-focus indicator. We never
// clear the native outline without a replacement — this swaps it for an accent ring offset
// against the canvas so it reads on both the dark surface and inside modals.
export const PILL_FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]";

export function PillElement({
  as = "button",
  href,
  className,
  onClick,
  ariaLabel,
  children,
}: {
  as?: "button" | "a";
  href?: string;
  className: string;
  onClick?: () => void;
  ariaLabel?: string;
  children: ReactNode;
}) {
  if (as === "a") {
    return (
      <a href={href} onClick={onClick} aria-label={ariaLabel} className={className}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className={className}>
      {children}
    </button>
  );
}

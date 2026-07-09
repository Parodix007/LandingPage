import { PILL_FOCUS, PillElement, type PillAsProps, type PillSharedProps } from "./pillBase";

export type GhostPillTone = "accent" | "accent2" | "gray";
export type GhostPillSize = "xs" | "sm" | "lg";

export type GhostPillProps = PillSharedProps &
  PillAsProps & {
    tone: GhostPillTone;
    size?: GhostPillSize;
    stretched?: boolean;
    flush?: boolean;
  };

// HANDOFF "Interactions & Behavior": base transparent; hover = tint@16% bg + tint@40% border + #fff
// text (gray variant: white@07% bg / white@22% border). transition: all 0.25s ease. Weight fixed 500.
const TONE_CLASSES: Record<GhostPillTone, string> = {
  accent:
    "text-accent hover:bg-[color-mix(in_oklch,var(--color-accent)_16%,transparent)] hover:border-[color-mix(in_oklch,var(--color-accent)_40%,transparent)] hover:text-white",
  accent2:
    "text-accent2 hover:bg-[color-mix(in_oklch,var(--color-accent2)_16%,transparent)] hover:border-[color-mix(in_oklch,var(--color-accent2)_40%,transparent)] hover:text-white",
  gray: "text-ink-50 hover:bg-white/[0.07] hover:border-white/[0.22] hover:text-white",
};

// Sizes (padding / text size):
//   xs = 13px/500, padding 6px 14px (service-modal mini-card "Read the story")
//   sm = 14.5px/500, padding 8px 16px (card footers / "Send another request", default)
//   lg = 17px/500, padding 12px 28px (hero secondary "See how we work")
const SIZE_CLASSES: Record<GhostPillSize, string> = {
  xs: "px-[14px] py-[6px] text-[13px]",
  sm: "px-4 py-2 text-[14.5px]",
  lg: "px-7 py-3 text-[17px]",
};

// flush = negative left margin equal to the size's horizontal padding, for optical
// left-edge alignment of a pill that starts a content row (HANDOFF). Opt-in only.
const FLUSH_CLASSES: Record<GhostPillSize, string> = {
  xs: "-ml-[14px]",
  sm: "-ml-4",
  lg: "-ml-7",
};

const BASE =
  "inline-flex items-center justify-center rounded-[var(--radius-pill)] border border-transparent font-medium leading-none transition-[all] duration-[250ms]";

export function GhostPill({
  tone,
  as,
  href,
  onClick,
  size = "sm",
  stretched,
  flush = false,
  children,
  "aria-label": ariaLabel,
}: GhostPillProps) {
  // Non-stretched: the visible pill IS the button; its own :hover drives the tint, which only
  // ever fires on direct pointer over the pill (hit-44 ::before does not extend card-wide).
  if (!stretched) {
    const className = [
      BASE,
      PILL_FOCUS,
      SIZE_CLASSES[size],
      TONE_CLASSES[tone],
      flush ? FLUSH_CLASSES[size] : "",
      "hit-44",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <PillElement as={as} href={href} className={className} onClick={onClick} ariaLabel={ariaLabel}>
        {children}
      </PillElement>
    );
  }

  // Stretched (whole-card click via .pill-stretched::after): the button is a bare, STATICALLY
  // positioned wrapper carrying only the card-wide click layer + focus ring. The visible pill
  // lives in an inner <span> at z-[1] so it paints ABOVE the ::after — its own :hover therefore
  // fires ONLY on direct pointer over the pill, never card-wide, while the ::after still makes
  // the whole card clickable. (SPEC §6.4 stretched-button + §11.2 focus preserved; the button
  // must stay static so ::after is positioned against .card-host, not the button.)
  // w-fit shrink-wraps the button to the visible span so a flex-COLUMN parent's `align-items:
  // stretch` can't stretch it full-width (which would overhang the focus ring past the pill);
  // it's a no-op where the button already shrink-wraps (grid cards, service-card row), and the
  // whole-card click is unaffected because .pill-stretched::after is anchored to .card-host,
  // not the button box.
  const buttonClassName = `w-fit pill-stretched inline-flex rounded-[var(--radius-pill)] ${PILL_FOCUS}`;
  const spanClassName = [
    BASE,
    SIZE_CLASSES[size],
    TONE_CLASSES[tone],
    flush ? FLUSH_CLASSES[size] : "",
    "relative z-[1]",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <PillElement
      as={as}
      href={href}
      className={buttonClassName}
      onClick={onClick}
      ariaLabel={ariaLabel}
    >
      <span className={spanClassName}>{children}</span>
    </PillElement>
  );
}

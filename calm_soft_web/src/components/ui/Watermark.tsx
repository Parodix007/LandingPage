// HANDOFF: decorative mono logo used behind process/case cards, aria-hidden. Positioning
// (absolute top/right offsets) is the parent's responsibility via `.card-host`; this
// component only renders the presentational mark itself.
// Shared mobile right-edge reservation for card hosts that position this watermark
// absolutely over their content: below 900px the mark shrinks to 16px (~84px wide), its
// right offset baseline is 26px, so hosts add this 112px padding (84 + 26 + margin) to keep
// card copy clear of it (the desktop reservation `min-[900px]:pr-[140px]` stays inline in the
// hosts and applies from 900px up — the two ranges never overlap).
export const WATERMARK_MOBILE_PAD = "max-[899px]:pr-[112px]";

export function Watermark() {
  return (
    <span
      aria-hidden="true"
      className="select-none font-mono text-[16px] min-[900px]:text-[24px] font-semibold leading-none tracking-[-0.02em] text-ink-deco-45 max-[899px]:text-ink-deco-55"
    >
      calm<span className="text-accent">_</span>soft
    </span>
  );
}

// HANDOFF: decorative mono logo used behind process/case cards, aria-hidden. Positioning
// (absolute top/right offsets) is the parent's responsibility via `.card-host`; this
// component only renders the presentational mark itself.
export function Watermark() {
  return (
    <span
      aria-hidden="true"
      className="select-none font-mono text-[24px] font-semibold leading-none tracking-[-0.02em] text-ink-deco-45"
    >
      calm<span className="text-accent">_</span>soft
    </span>
  );
}

export type SectionHeadingProps = {
  id?: string;
  line1: string;
  line2?: string;
  subline?: string;
};

// HANDOFF §Services/Process/Cases: H2 clamp(36px,4.5vw,56px)/700/-0.025em, two lines —
// second line dimmed. WCAG-corrected alpha for readable text: text-ink-50 (SPEC §11.1),
// not the raw 0.45 decorative alpha used for aria-hidden watermarks.
export function SectionHeading({ id, line1, line2, subline }: SectionHeadingProps) {
  return (
    <>
      <h2
        id={id}
        className="m-0 text-[clamp(36px,4.5vw,56px)] font-bold leading-[1.05] tracking-[-0.025em]"
      >
        {line1}
        {line2 ? (
          <>
            <br />
            <span className="text-ink-50">{line2}</span>
          </>
        ) : null}
      </h2>
      {subline ? (
        <p className="mt-3 max-w-[560px] text-[18px] leading-[1.55] text-ink-70">{subline}</p>
      ) : null}
    </>
  );
}

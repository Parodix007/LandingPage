import type { KsefErpPage } from "@/content/types";
import { Chip } from "@/components/ui/Chip";
import { RichText } from "@/components/ui/RichText";
import { CheckIcon, InfoIcon, MinusIcon } from "@/components/ui/icons";
import { KsefPlanCta } from "@/components/interactive/KsefPlanCta";

type Pricing = KsefErpPage["pricing"];

function PlanNote({ plan, placement }: { plan: Pricing["plans"][number]; placement: "desktop" | "mobile" }) {
  if (!plan.note || !plan.noteLabel) return null;
  const tooltipId = `ksef-${plan.id}-note-${placement}`;
  const tooltipPlacement = placement === "mobile"
    ? "left-0 max-w-[min(18rem,calc(100vw-6rem))]"
    : "right-0 left-auto max-w-[min(18rem,calc(100vw-3rem))]";
  const groupClassName = placement === "desktop" ? "group relative inline-flex" : "group inline-flex";

  return (
    <span className={groupClassName}>
      <button
        type="button"
        aria-label={plan.noteLabel}
        aria-describedby={tooltipId}
        className="hit-44 inline-flex h-4 w-4 items-center justify-center rounded-full text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <InfoIcon className="h-4 w-4 text-ink-50" />
      </button>
          <span
            id={tooltipId}
            role="tooltip"
            className={`invisible pointer-events-none absolute ${tooltipPlacement} top-full z-20 mt-1 w-max translate-y-1 rounded-[var(--radius-input)] border border-border-12 bg-surface px-4 py-3 text-left text-[14px] font-normal leading-[1.5] text-ink-85 opacity-0 shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition-[opacity,transform,visibility] duration-150 motion-reduce:transition-none group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100`}
      >
        <RichText>{plan.note}</RichText>
      </span>
    </span>
  );
}

// Server component (2026-09-09 ksef-product-pages design, rev. 3: badge + hover, includesIntro
// removed) — the KSeF pricing block: an "includes" summary shared by every plan (closing
// highlight note), then the plan comparison itself rendered twice (a `<table>` for `min-[900px]`
// and up, stacked `<article>` cards below that breakpoint) so both variants exist in the DOM
// simultaneously and are toggled purely via Tailwind responsive `hidden`/`block` — no
// `aria-hidden` needed, `display:none` already removes the inactive one from the accessibility
// tree. Heading depth here is `<h3>`: the page's pricing section owns the `<h2>`. Table hover
// (`.ksef-plan-table` + `data-plan`) is CSS-only in globals.css; mobile cards get a plain
// transform hover (`.ksef-surface` already carries the gradient border, so `HOVER_LIFT` is not
// used here). Desktop header cells (`<th data-plan>`) use a flex column with a reserved badge
// slot in every column and the CTA pinned to the bottom via `mt-auto`, so name/price/audience/CTA
// stay aligned across columns regardless of badge presence or audience text length. The desktop
// table is `table-fixed` with the label column pinned to `w-1/5` so the remaining 80% splits
// evenly across plan columns (auto layout was starving the Firma column since its body cells are
// short), and each header `<th>` carries `h-px` — the standard hack that gives a table cell an
// explicit height so a percentage-based child height (`h-full`) resolves, which is what lets the
// existing `mt-auto` pin the CTA to the bottom of the cell in Chrome.
export function KsefPricingTable({ pricing }: { pricing: Pricing }) {
  const presentationPlanId = (id: Pricing["plans"][number]["id"]) => id === "standard" ? "firma" : id;
  const sharedRows = pricing.table.filter((row) => pricing.plans.every((plan) => row.cells[plan.id] === true));

  return (
    <>
      <div className="ksef-surface p-7">
        <Chip tone="accent">{pricing.badge}</Chip>
        <h3 className="mt-4 text-[22px] font-bold leading-[1.15] tracking-[-0.02em]">{pricing.includesTitle}</h3>
        <ul className="mt-6 grid grid-cols-1 gap-x-6 gap-y-3 min-[700px]:grid-cols-2 min-[900px]:grid-cols-3">
          {pricing.includes.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <span className="text-[15px] leading-[1.5] text-ink-70"><RichText>{item}</RichText></span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[18px] font-semibold text-ink"><RichText>{pricing.includesNote}</RichText></p>
      </div>

      <div className="mt-8 hidden min-[900px]:block">
        <div className="overflow-x-auto">
          <table className="ksef-plan-table w-full table-fixed border-separate border-spacing-0">
            <caption className="sr-only">{pricing.tableCaption}</caption>
            <thead>
              <tr>
                <td className="w-1/5" />
                {pricing.plans.map((plan) => (
                  <th
                    key={plan.id}
                    scope="col"
                    data-plan={presentationPlanId(plan.id)}
                    className={`h-px p-4 text-center align-top ${plan.featured ? "rounded-t-[var(--radius-card)] border border-b-0 border-[color-mix(in_oklch,var(--color-accent)_40%,transparent)] bg-[color-mix(in_oklch,var(--color-accent)_8%,transparent)]" : ""}`}
                  >
                    <div className="flex h-full flex-col items-center">
                      <div className="flex min-h-8 justify-center">
                        {plan.badge && <Chip tone="accent">{plan.badge}</Chip>}
                      </div>
                      <div className="mt-2 flex min-h-11 items-center justify-center gap-1"><h3 className="text-[22px] font-bold leading-[1.15]">{plan.name}</h3></div>
                      <p className="mt-2">
                        <span className="text-[36px] font-bold leading-none text-accent">{plan.price}</span>{" "}
                        <span className="text-[13px] text-ink-50">{pricing.unit}</span>
                      </p>
                      <p className="relative mt-2 text-[14px] leading-[1.4] text-ink-70"><RichText>{plan.audience}</RichText>{plan.id === "pro" && <PlanNote plan={plan} placement="desktop" />}</p>
                      <div className="mt-auto flex justify-center pt-4">
                        <KsefPlanCta label={plan.cta} prefill={plan.prefill} variant="filled" />
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pricing.table.map((row) => (
                <tr key={row.label}>
                  <th scope="row" className="border-t border-border-08 py-4 px-4 text-left text-[15px] text-ink-85">
                    {row.label}
                  </th>
                  {pricing.plans.map((plan) => {
                    const cell = row.cells[plan.id];
                    return (
                      <td
                        key={plan.id}
                        data-plan={presentationPlanId(plan.id)}
                        className={`border-t border-border-08 py-4 px-4 text-center ${plan.featured ? "border-x border-x-[color-mix(in_oklch,var(--color-accent)_40%,transparent)] bg-[color-mix(in_oklch,var(--color-accent)_8%,transparent)]" : ""}`}
                      >
                        {cell === true ? (
                          <>
                            <CheckIcon className="mx-auto h-5 w-5 text-accent" />
                            <span className="sr-only">{pricing.yesLabel}</span>
                          </>
                        ) : cell === false ? (
                          <>
                            <MinusIcon className="mx-auto h-5 w-5 text-ink-50" />
                            <span className="sr-only">{pricing.noLabel}</span>
                          </>
                        ) : (
                          <span className="text-[14.5px] text-ink-70"><RichText>{cell}</RichText></span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 min-[900px]:hidden">
        {pricing.plans.map((plan) => (
          <article
            key={plan.id}
            className={`ksef-surface p-6 transition-transform duration-[350ms] hover:-translate-y-1 ${plan.featured ? "ksef-surface-featured" : ""}`}
          >
            {plan.badge && <Chip tone="accent">{plan.badge}</Chip>}
            <div className={`flex min-h-11 items-center gap-1 ${plan.badge ? "mt-2" : ""}`}><h3 className="text-[22px] font-bold leading-[1.15]">{plan.name}</h3></div>
            <p className="mt-2">
              <span className="text-[36px] font-bold leading-none text-accent">{plan.price}</span>{" "}
              <span className="text-[13px] text-ink-50">{pricing.unit}</span>
            </p>
            <p className="relative mt-2 text-[14px] leading-[1.4] text-ink-70"><RichText>{plan.audience}</RichText>{plan.id === "pro" && <PlanNote plan={plan} placement="mobile" />}</p>
            <ul className="mt-4 flex flex-col gap-2">
              {plan.highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-3">
                  <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <span className="text-[14.5px] leading-[1.5] text-ink-70"><RichText>{highlight}</RichText></span>
                </li>
              ))}
              {sharedRows.map((row) => (
                <li key={row.label} className="flex items-start gap-3">
                  <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <span className="text-[14.5px] leading-[1.5] text-ink-70">{row.label}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <KsefPlanCta label={plan.cta} prefill={plan.prefill} variant="filled" />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

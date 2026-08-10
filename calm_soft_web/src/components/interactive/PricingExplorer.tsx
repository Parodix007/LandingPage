"use client";

import { useState } from "react";
import type { PricePoint, PricingCard, PricingGroup, PriceTierId, PricingFilters } from "@/content/types";
import { Watermark } from "@/components/ui/Watermark";
import { PILL_FOCUS } from "@/components/ui/pillBase";
import { CHIP_BASE, CHIP_INACTIVE, FilterChip, FILTER_LEGEND_CLASS } from "@/components/ui/FilterChip";

// Client leaf (SPEC §16 client/server boundary) — owns category + price-tier filter state AND
// renders the (filtered) pricing groups, so app/pricing/page.tsx stays a server component and
// only threads `pricing.groups` / `pricing.filters` through as props. PriceRow/PricingCardItem
// and the tone maps used to live in page.tsx; they're presentational, so they moved down into
// this file rather than staying server-side. See docs/superpowers/specs/
// 2026-07-20-pricing-filters-and-card-gutter-design.md.

// HANDOFF (cennik-design-handoff.md): visually indistinguishable from #services — same
// tokens/radii/card shell as Services.tsx. PricingGroup.tone is already "accent"/"accent2"
// (the Chip/GhostPill tone vocabulary), unlike Service.tone's "a"/"b" + translation table, so
// one lookup covers both the card tag and the group eyebrow color.
const TONE_TEXT: Record<PricingGroup["tone"], string> = {
  accent: "text-accent",
  accent2: "text-accent2",
};

const TONE_GLOW: Record<PricingGroup["tone"], string> = {
  accent: "[--glow-color:color-mix(in_oklch,var(--color-accent)_18%,transparent)]",
  accent2: "[--glow-color:color-mix(in_oklch,var(--color-accent2)_18%,transparent)]",
};

const TONE_HOVER_BORDER: Record<PricingGroup["tone"], string> = {
  accent:
    "hover:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)] focus-within:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)]",
  accent2:
    "hover:border-[color-mix(in_oklch,var(--color-accent2)_50%,transparent)] focus-within:border-[color-mix(in_oklch,var(--color-accent2)_50%,transparent)]",
};

// "from" is the only PricePoint variant with no `label` field — the word itself is fixed UI
// chrome (HANDOFF price typography), not content copy, so it's hardcoded here rather than
// threaded through src/content/pricing.ts.
function PriceRow({ price }: { price: PricePoint }) {
  if (price.kind === "from") {
    return (
      <div className="mt-[6px] flex flex-wrap items-baseline gap-2">
        <span className="text-[13px] uppercase tracking-[0.08em] text-ink-50">od</span>
        <span className="text-[28px] font-bold tracking-[-0.02em] text-ink">{price.amount}</span>
        {price.unit ? <span className="text-[15px] text-ink-50">{price.unit}</span> : null}
      </div>
    );
  }
  if (price.kind === "free") {
    return (
      <div className="mt-[6px] flex flex-wrap items-baseline gap-2">
        <span className="text-[26px] font-bold text-accent">{price.label}</span>
      </div>
    );
  }
  if (price.kind === "promo") {
    return (
      <div className="mt-[6px] flex flex-wrap items-baseline gap-2">
        <span className="text-[16px] text-ink-50 line-through">{price.old}</span>
        <span className="text-[24px] font-bold text-accent2">{price.now}</span>
      </div>
    );
  }
  return (
    <div className="mt-[6px] flex flex-wrap items-baseline gap-2">
      <span className="text-[18px] font-semibold text-ink-85">{price.label}</span>
    </div>
  );
}

// Local to this file (not a new ui/ primitive — ui/ is frozen) — mirrors Services.tsx's card
// shell 1:1 (card-host, card-glow, radius-card, 36px/30px padding, hover lift + tone border).
// Title/tag carry a pr-[120px] right gutter so long text wraps before running under the
// absolutely-positioned watermark (top-right, ~120px wide, HANDOFF card watermark) — desc,
// PriceRow and note sit below the watermark band and stay full width.
function PricingCardItem({ card, tone }: { card: PricingCard; tone: PricingGroup["tone"] }) {
  return (
    <div
      className={`card-host relative flex flex-col gap-[14px] overflow-hidden rounded-[var(--radius-card)] border border-border-08 bg-surface p-[36px_30px] transition-[transform,border-color] duration-[350ms] hover:-translate-y-1 focus-within:-translate-y-1 ${TONE_HOVER_BORDER[tone]}`}
    >
      {/* Decorative glow circle — purely presentational, hidden from AT (mirrors Services.tsx). */}
      <span
        aria-hidden="true"
        className={`card-glow -right-[120px] -top-[120px] h-[320px] w-[320px] ${TONE_GLOW[tone]}`}
      />
      <span aria-hidden="true" className="absolute right-[26px] top-6">
        <Watermark />
      </span>
      {card.tag ? (
        <p className={`pr-[120px] text-[13px] font-semibold uppercase tracking-[0.12em] ${TONE_TEXT[tone]}`}>
          {card.tag}
        </p>
      ) : null}
      <h3 className="pr-[120px] text-[24px] font-bold leading-[1.15] tracking-[-0.02em]">{card.title}</h3>
      <p className="flex-grow text-[15px] leading-[1.55] text-ink-70">{card.desc}</p>
      <PriceRow price={card.price} />
      {card.note ? <p className="text-[13px] italic text-ink-50">{card.note}</p> : null}
    </div>
  );
}

// Pure price->tier derivation, no component state — easy to reason about independently of
// rendering. Boundaries: <5k / 5k-15k / >=15k.
function tierFromAmount(n: number): PriceTierId {
  if (n < 5000) return "lt5k";
  if (n < 15000) return "mid";
  return "high";
}

function priceTierOf(price: PricePoint): PriceTierId {
  if (price.kind === "free") return "free";
  if (price.kind === "individual") return "custom";
  if (price.kind === "promo") {
    const n = Number(price.now.replace(/[^\d]/g, ""));
    return n > 0 ? tierFromAmount(n) : "free"; // "now free" -> 0 -> free
  }
  const n = Number(price.amount.replace(/[^\d]/g, "")); // "PLN 16,000" -> 16000
  return tierFromAmount(n);
}

export function PricingExplorer({ groups, filters }: { groups: PricingGroup[]; filters: PricingFilters }) {
  const [cats, setCats] = useState<Set<string>>(new Set());
  const [tiers, setTiers] = useState<Set<PriceTierId>>(new Set());

  function toggleCat(eyebrow: string) {
    setCats((prev) => {
      const next = new Set(prev);
      if (next.has(eyebrow)) next.delete(eyebrow);
      else next.add(eyebrow);
      return next;
    });
  }

  function toggleTier(id: PriceTierId) {
    setTiers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearAll() {
    setCats(new Set());
    setTiers(new Set());
  }

  const total = groups.reduce((n, g) => n + g.cards.length, 0);
  const catActive = cats.size > 0;
  const tierActive = tiers.size > 0;
  const visibleGroups = groups
    .filter((g) => !catActive || cats.has(g.eyebrow))
    .map((g) => ({ group: g, cards: g.cards.filter((c) => !tierActive || tiers.has(priceTierOf(c.price))) }))
    .filter((x) => x.cards.length > 0);
  const shown = visibleGroups.reduce((n, x) => n + x.cards.length, 0);
  const anyFilter = catActive || tierActive;

  return (
    <div className="reveal-group mt-14">
      <div className="flex flex-col gap-6">
        <fieldset className="m-0 border-0 p-0">
          <legend className={FILTER_LEGEND_CLASS}>{filters.categoryLegend}</legend>
          <div className="flex flex-wrap gap-[10px]">
            {groups.map((g) => (
              <FilterChip key={g.eyebrow} pressed={cats.has(g.eyebrow)} tone={g.tone} onClick={() => toggleCat(g.eyebrow)}>
                {g.icon ? <span aria-hidden="true">{g.icon} </span> : null}
                {g.eyebrow}
              </FilterChip>
            ))}
          </div>
        </fieldset>

        <fieldset className="m-0 border-0 p-0">
          <legend className={FILTER_LEGEND_CLASS}>{filters.priceLegend}</legend>
          <div className="flex flex-wrap gap-[10px]">
            {filters.tiers.map((t) => (
              <FilterChip key={t.id} pressed={tiers.has(t.id)} onClick={() => toggleTier(t.id)}>
                {t.label}
              </FilterChip>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <p role="status" aria-live="polite" className="text-[14px] font-medium text-ink-50">
          {`${shown} / ${total} ${filters.countLabel}`}
        </p>
        {anyFilter ? (
          <button
            type="button"
            onClick={clearAll}
            className={`${CHIP_BASE} ${PILL_FOCUS} ${CHIP_INACTIVE}`}
          >
            {filters.clearLabel}
          </button>
        ) : null}
      </div>

      {visibleGroups.length === 0 ? (
        <div className="mt-14 rounded-[var(--radius-card)] border border-border-08 bg-surface p-[40px_32px] text-center">
          <p className="text-[20px] font-bold text-ink">{filters.emptyTitle}</p>
          <p className="mx-auto mt-2 max-w-[480px] text-[15px] text-ink-70">{filters.emptyBody}</p>
          <button
            type="button"
            onClick={clearAll}
            className={`mt-6 ${CHIP_BASE} ${PILL_FOCUS} ${CHIP_INACTIVE}`}
          >
            {filters.clearLabel}
          </button>
        </div>
      ) : (
        visibleGroups.map((x) => (
          <section key={x.group.eyebrow} className="mt-14">
            <p className={`mb-1 text-[13px] font-semibold uppercase tracking-[0.12em] ${TONE_TEXT[x.group.tone]}`}>
              {x.group.icon ? <span aria-hidden="true">{x.group.icon} </span> : null}
              {x.group.eyebrow}
            </p>
            <p className="mb-[22px] text-[15px] text-ink-50">{x.group.sub}</p>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-[18px]">
              {x.cards.map((card) => (
                <PricingCardItem key={card.title} card={card} tone={x.group.tone} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

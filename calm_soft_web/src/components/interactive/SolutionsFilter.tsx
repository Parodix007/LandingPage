"use client";

import { useState, type ReactNode } from "react";
import type { SolutionFilters, SolutionGroup, SolutionLineSlug } from "@/content/types";
import { PILL_FOCUS } from "@/components/ui/pillBase";
import { CHIP_BASE, CHIP_INACTIVE, FilterChip, FILTER_LEGEND_CLASS } from "@/components/ui/FilterChip";

// Client leaf (2026-07-26 solutions-group-heading-and-filters design) — owns the product-line
// filter state AND renders the (filtered) groups + lines, so app/demos/page.tsx stays a server
// component and only threads pre-rendered `<SolutionLineBlock>` nodes through as props. Same
// shape as PricingExplorer on /pricing/, which likewise owns both filter state and the rendering
// of what it filters. Unlike PricingExplorer, this filters on a single axis (SolutionLineSlug),
// so an empty result set is unreachable — no empty state to build.
//
// The group heading markup (h2/p/section) moved here from page.tsx along with GROUP_TONE_TEXT,
// since a group now only renders when it survives the filter.

export type SolutionsFilterLine = { slug: SolutionLineSlug; kicker: string; node: ReactNode };
export type SolutionsFilterGroup = {
  slug: string;
  eyebrow: string;
  sub: string;
  tone: SolutionGroup["tone"];
  lines: SolutionsFilterLine[];
};

const GROUP_TONE_TEXT: Record<SolutionGroup["tone"], string> = {
  accent: "text-accent",
  accent2: "text-accent2",
};

export function SolutionsFilter({
  groups,
  filters,
}: {
  groups: SolutionsFilterGroup[];
  filters: SolutionFilters;
}) {
  const [selected, setSelected] = useState<Set<SolutionLineSlug>>(new Set());

  function toggle(slug: SolutionLineSlug) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function clearAll() {
    setSelected(new Set());
  }

  // Presentation order comes solely from `groups`/`lines` array order — the filter never sorts.
  const allLines = groups.flatMap((g) => g.lines);
  const total = allLines.length;
  const anyFilter = selected.size > 0;

  const visibleGroups = groups
    .map((g) => ({ group: g, lines: g.lines.filter((l) => !anyFilter || selected.has(l.slug)) }))
    .filter((x) => x.lines.length > 0);
  const shown = visibleGroups.reduce((n, x) => n + x.lines.length, 0);

  return (
    <div className="mt-14">
      <fieldset className="m-0 border-0 p-0">
        <legend className={FILTER_LEGEND_CLASS}>{filters.legend}</legend>
        <div className="flex flex-wrap gap-[10px]">
          {allLines.map((line) => (
            <FilterChip key={line.slug} pressed={selected.has(line.slug)} onClick={() => toggle(line.slug)}>
              {line.kicker}
            </FilterChip>
          ))}
        </div>
      </fieldset>

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

      {visibleGroups.map(({ group, lines }) => (
        <section
          key={group.slug}
          aria-labelledby={`grupa-${group.slug}`}
          className="mt-16 border-t border-border-10 pt-12"
        >
          <h2
            id={`grupa-${group.slug}`}
            className={`text-[32px] font-bold leading-[1.15] tracking-[-0.02em] ${GROUP_TONE_TEXT[group.tone]}`}
          >
            {group.eyebrow}
          </h2>
          <p className="mt-3 max-w-[640px] text-[16px] text-ink-70">{group.sub}</p>

          <div className="mt-10 flex flex-col gap-16">{lines.map((line) => line.node)}</div>
        </section>
      ))}
    </div>
  );
}

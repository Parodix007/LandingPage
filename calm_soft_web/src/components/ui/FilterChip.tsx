import type { ReactNode } from "react";
import { PILL_FOCUS } from "./pillBase";

// Shared filter-chip vocabulary for /pricing/ and /demos/ — previously duplicated byte-for-byte
// across PricingExplorer and SolutionsFilter.
export const CHIP_BASE =
  "inline-flex items-center rounded-[var(--radius-pill)] border px-4 py-2 text-[13.5px] font-medium transition-[color,border-color,background-color] duration-200";
export const CHIP_INACTIVE =
  "border-border-12 text-ink-70 hover:text-white hover:border-[color-mix(in_oklch,var(--color-accent)_35%,transparent)]";
const CHIP_ACTIVE: Record<"accent" | "accent2", string> = {
  accent:
    "border-[color-mix(in_oklch,var(--color-accent)_60%,transparent)] bg-[color-mix(in_oklch,var(--color-accent)_12%,transparent)] text-ink",
  accent2:
    "border-[color-mix(in_oklch,var(--color-accent2)_60%,transparent)] bg-[color-mix(in_oklch,var(--color-accent2)_12%,transparent)] text-ink",
};

// aria-pressed toggle button — category chips key active styling off the group's own tone;
// price-tier chips omit `tone` and fall back to the accent active class.
export function FilterChip({
  pressed,
  tone = "accent",
  onClick,
  children,
}: {
  pressed: boolean;
  tone?: "accent" | "accent2";
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`${CHIP_BASE} ${PILL_FOCUS} ${pressed ? CHIP_ACTIVE[tone] : CHIP_INACTIVE}`}
    >
      {children}
    </button>
  );
}

export const FILTER_LEGEND_CLASS = "mb-3 p-0 text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-50";

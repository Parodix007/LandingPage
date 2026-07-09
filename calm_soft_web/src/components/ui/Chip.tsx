import type { ReactNode } from "react";

export type ChipProps = {
  tone: "accent" | "accent2";
  children: ReactNode;
};

// HANDOFF §Services card contents: 13.5px/500 pill, tint@15% bg, tint@32% border, ink text.
const TONE_CLASSES: Record<"accent" | "accent2", string> = {
  accent:
    "bg-[color-mix(in_oklch,var(--color-accent)_15%,transparent)] border-[color-mix(in_oklch,var(--color-accent)_32%,transparent)]",
  accent2:
    "bg-[color-mix(in_oklch,var(--color-accent2)_15%,transparent)] border-[color-mix(in_oklch,var(--color-accent2)_32%,transparent)]",
};

export function Chip({ tone, children }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center rounded-[var(--radius-pill)] border px-4 py-2 text-[13.5px] font-medium leading-none text-ink ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}

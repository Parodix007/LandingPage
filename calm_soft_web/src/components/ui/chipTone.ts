import type { Tone } from "@/content/types";

/**
 * Single source of truth for the `Tone` (content/types) → `tone` prop of ui/Chip
 * ("accent" | "accent2") lookup shared by every tone-tinted chip renderer
 * (CaseStudies, HeroCaseSlider, ServicesSlider, CaseModalContent, /work/, /uslugi/[slug]/)
 * so the mapping can never diverge between them.
 */
export const TONE_CHIP: Record<Tone, "accent" | "accent2"> = {
  a: "accent",
  b: "accent2",
};

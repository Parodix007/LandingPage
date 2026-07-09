// SINGLE source of the hero variant (SPEC §6.8). site.ts intentionally does NOT carry a
// heroVariant field — this constant is the only switch.
export type HeroVariant = "aurora" | "code" | "type";
export const HERO_VARIANT: HeroVariant = "code";

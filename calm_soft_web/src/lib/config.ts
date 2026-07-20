// SINGLE source of the hero variant (SPEC §6.8). site.ts intentionally does NOT carry a
// heroVariant field — this constant is the only switch.
export type HeroVariant = "aurora" | "code" | "type";
export const HERO_VARIANT: HeroVariant = "code";

// Calendly popup widget URL (owner's choice over a plain scheduling link) — single source
// for lib/calendly.ts + every CalendlyCta placement (Demos, Contact, /pricing/). See
// docs/superpowers/specs/2026-07-20-pricing-calendly-reorder-design.md.
export const CALENDLY_URL = "https://calendly.com/team-calmsoft/workshop";

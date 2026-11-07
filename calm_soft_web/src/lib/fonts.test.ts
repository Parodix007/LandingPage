import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Kontrakt typografii (spec 2026-11-06 §2b, brief #4): Inter + JetBrains Mono self-hosted
// przez next/font/local. Zmienne CSS fontów są deklarowane w layout.tsx i spinane do
// tokenów Tailwind v4 w bloku @theme globals.css. Test skanuje plik regexami — wzorzec
// fxStyles.test.ts. Dodatkowo pilnuje, że edycja @theme nie ruszyła tokenów kolorów
// ani bloków FX (regresja 2026-10-29: hurtowe edycje globals.css).
const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

describe("globals.css — kontrakt typografii (Inter + JetBrains Mono, brief #4)", () => {
  it("--font-sans wskazuje na zmienną Inter z next/font/local", () => {
    const sansRule = css.match(/--font-sans:[^;]+;/);
    expect(sansRule, "blok @theme musi definiować --font-sans").not.toBeNull();
    expect(sansRule![0]).toContain("var(--font-inter)");
  });

  it("--font-mono wskazuje na zmienną JetBrains Mono z next/font/local", () => {
    const monoRule = css.match(/--font-mono:[^;]+;/);
    expect(monoRule, "blok @theme musi definiować --font-mono").not.toBeNull();
    expect(monoRule![0]).toContain("var(--font-jetbrains-mono)");
  });

  it("tokeny zachowują fallbacki systemowe po zmiennych fontów (WCAG/brak blokady renderu)", () => {
    const sansRule = css.match(/--font-sans:[^;]+;/)![0];
    const monoRule = css.match(/--font-mono:[^;]+;/)![0];
    expect(sansRule).toContain("system-ui");
    expect(sansRule).toContain("sans-serif");
    expect(monoRule).toContain("monospace");
  });

  it("fonty są self-hosted — brak CDN Google Fonts ani zdalnych @font-face", () => {
    expect(css).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
    expect(css).not.toMatch(/@font-face[^}]*url\(https?:/);
  });

  it("tokeny kolorów @theme są nietknięte (brief #4 zamraża kolory)", () => {
    for (const token of [
      "--color-canvas: #000;",
      "--color-surface: #101012;",
      "--color-accent: #7ce38b;",
      "--color-accent2: #b9f0c4;",
      "--color-ink: #f5f5f7;",
    ]) {
      expect(css).toContain(token);
    }
  });

  it("bloki FX w globals.css pozostały (edycja @theme nie mogła ich usunąć)", () => {
    expect(css).toContain(".card-glow");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("body::after");
    expect(css).toContain(".process-stack");
  });
});

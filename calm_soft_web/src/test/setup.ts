import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// vitest.config.ts nie ustawia `test.globals: true`, więc automatyczne czyszczenie DOM
// z @testing-library/react (które polega na wykryciu globalnego `afterEach`) nigdy się nie
// odpala — bez tego elementy z kolejnych `it()` w tym samym pliku kumulują się w jsdom.
afterEach(() => {
  cleanup();
  // lib/consent.ts persists to localStorage (jsdom implements it) — clear it so one test's
  // stored consent decision can never leak into the next (e.g. ConsentBanner.test.tsx).
  window.localStorage.clear();
});

// Stuby czysto defensywne (SPEC §14.1) — jsdom nie implementuje tych API.
// reduced-motion żyje wyłącznie w CSS; NIE dopisuj gałęzi JS czytającej matchMedia.
Object.defineProperty(window, "scrollTo", { value: vi.fn(), writable: true });
Element.prototype.scrollIntoView = vi.fn();
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Defensive `window.turnstile` stub (jsdom never loads the real Cloudflare script). Tests that
// exercise lib/turnstile.ts override/replace this per-case; this default just prevents an
// incidental `window.turnstile.*` access elsewhere from throwing.
Object.defineProperty(window, "turnstile", {
  writable: true,
  configurable: true,
  value: {
    render: vi.fn().mockReturnValue("stub-widget-id"),
    execute: vi.fn(),
    reset: vi.fn(),
    remove: vi.fn(),
  },
});

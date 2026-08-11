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
  // Rejestr instancji MockIntersectionObserver (zdefiniowany niżej) — bez zerowania testy
  // korzystające z `MockIntersectionObserver.instances` widziałyby observery z poprzednich `it()`.
  MockIntersectionObserver.instances.length = 0;
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

// jsdom nie implementuje IntersectionObserver (RevealOnScroll.tsx). To NIE jest gałąź czytająca
// matchMedia — reduced-motion nadal żyje wyłącznie w CSS zgodnie z komentarzem wyżej; ten stub
// istnieje wyłącznie po to, żeby konstruktor `new IntersectionObserver(...)` nie wywalał się w
// jsdom, i żeby test mógł ręcznie odpalić callback przez `triggerIntersect`.
type IntersectionObserverCallback = (
  entries: IntersectionObserverEntry[],
  observer: IntersectionObserver
) => void;

export class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];
  private readonly callback: IntersectionObserverCallback;
  readonly observedTargets: Element[] = [];

  static instances: MockIntersectionObserver[] = [];

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  observe(target: Element) {
    this.observedTargets.push(target);
  }

  unobserve(target: Element) {
    const i = this.observedTargets.indexOf(target);
    if (i !== -1) this.observedTargets.splice(i, 1);
  }

  disconnect() {
    this.observedTargets.length = 0;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  // Pomocnicza metoda testowa — symuluje wejście `target` w kadr, wywołując realny callback
  // observera z minimalnym, ale poprawnym typowo entry.
  triggerIntersect(target: Element, isIntersecting = true) {
    const entry: IntersectionObserverEntry = {
      isIntersecting,
      target,
      boundingClientRect: target.getBoundingClientRect(),
      intersectionRatio: isIntersecting ? 1 : 0,
      intersectionRect: target.getBoundingClientRect(),
      rootBounds: null,
      time: Date.now(),
    };
    this.callback([entry], this);
  }
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

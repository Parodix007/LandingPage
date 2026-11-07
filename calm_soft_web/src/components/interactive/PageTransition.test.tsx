import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  PageTransition,
  qualifyTransitionHref,
  resolveClickPoint,
} from "./PageTransition";

function gateMatches(matches: boolean) {
  const spy = vi.fn((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  vi.stubGlobal("matchMedia", spy);
  return spy;
}

// Helper z HeroParticleField.test.tsx — ograniczony przełącznik timera, bez realnych rAF-i.
async function flushFrames(limit = 10): Promise<void> {
  for (let i = 0; i < limit; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

function stubGetContext(ctx: unknown): void {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    ctx as CanvasRenderingContext2D,
  );
}

// jsdom zwraca same zera z getBoundingClientRect — fikstura z realną geometrią.
function setRect(el: Element, left: number, top: number, width: number, height: number) {
  el.getBoundingClientRect = () =>
    ({
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;
}

describe("PageTransition", () => {
  beforeEach(() => {
    // Klucz i klasa są stanem globalnym dokumentu — bez zerowania testy wzajemnie się brudzą.
    sessionStorage.clear();
    document.documentElement.classList.remove("tr-in");
  });

  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    document.documentElement.classList.remove("tr-in");
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("qualifyTransitionHref", () => {
    const origin = "https://calmsoft.pro";

    it("kwalifikuje wewnętrzne trasy z kończącym ukośnikiem i zachowuje hash/query celu", () => {
      expect(qualifyTransitionHref("/o-mnie/", origin, "/")).toBe("/o-mnie/");
      expect(qualifyTransitionHref("/o-mnie/#x", origin, "/")).toBe("/o-mnie/#x");
      expect(qualifyTransitionHref("/uslugi/", origin, "/")).toBe("/uslugi/");
      expect(qualifyTransitionHref("/#contact", origin, "/o-mnie/")).toBe("/#contact");
      expect(qualifyTransitionHref("/?utm=1", origin, "/o-mnie/")).toBe("/?utm=1");
    });

    it("odrzuca kotwicę na tej samej ścieżce (hash nie ma znaczenia dla kwalifikacji)", () => {
      expect(qualifyTransitionHref("/", origin, "/")).toBeNull();
      expect(qualifyTransitionHref("/o-mnie/#x", origin, "/o-mnie/")).toBeNull();
    });

    it("odrzuca href tylko-fragment — natywne scrollowanie w ramach strony (regresja KSeF)", () => {
      expect(qualifyTransitionHref("#cennik", origin, "/ksef/rachmistrz-nexo/")).toBeNull();
      expect(qualifyTransitionHref("#top", origin, "/")).toBeNull();
    });

    it("odrzuca protokoły inne niż http/https", () => {
      expect(qualifyTransitionHref("mailto:hi@calmsoft.com", origin, "/")).toBeNull();
      expect(qualifyTransitionHref("tel:+48123", origin, "/")).toBeNull();
    });

    it("odrzuca inne originy (Calendly) i trasy bez kończącego ukośnika", () => {
      expect(qualifyTransitionHref("https://calendly.com/x", origin, "/")).toBeNull();
      expect(qualifyTransitionHref("https://inna.pl/o-mnie/", origin, "/")).toBeNull();
      expect(qualifyTransitionHref("/blog", origin, "/")).toBeNull();
    });

    it("odrzuca pusty href", () => {
      expect(qualifyTransitionHref(null, origin, "/")).toBeNull();
    });
  });

  describe("resolveClickPoint", () => {
    it("normalizuje rzeczywisty klik przez viewport", () => {
      const anchor = document.createElement("a");
      expect(resolveClickPoint(500, 300, anchor, 1000, 600)).toEqual({ x: 0.5, y: 0.5 });
    });

    it("dla kliku klawiaturowego (0,0) bierze środek <a>", () => {
      const anchor = document.createElement("a");
      setRect(anchor, 100, 50, 200, 20);
      expect(resolveClickPoint(0, 0, anchor, 1000, 600)).toEqual({ x: 0.2, y: 0.1 });
    });

    it("przycina wynik do [0,1]", () => {
      const anchor = document.createElement("a");
      setRect(anchor, 1200, 700, 100, 40);
      expect(resolveClickPoint(2000, 900, anchor, 1000, 600)).toEqual({ x: 1, y: 1 });
    });
  });

  it("bez klasy tr-in i bez klucza nie tworzy żadnego canvasa", () => {
    gateMatches(false);
    render(<PageTransition />);
    expect(document.querySelectorAll("canvas")).toHaveLength(0);
  });

  it("pod reduced-motion klik nie woła preventDefault i nie zapisuje cs-tr", () => {
    gateMatches(true);
    const { container } = render(
      <>
        <PageTransition />
        <a href="/o-mnie/">link</a>
      </>,
    );
    const anchor = container.querySelector("a") as HTMLAnchorElement;

    // Nasłuch testowy rejestrowany PO efekcie komponentu — działa w kolejności bubble, więc
    // captures stan prewencji zanim sam zablokuje nawigację, której jsdom i tak nie wykona.
    let preventedByComponent: boolean | null = null;
    const guard = (event: Event) => {
      preventedByComponent = event.defaultPrevented;
      event.preventDefault();
    };
    document.addEventListener("click", guard);

    anchor.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }),
    );
    document.removeEventListener("click", guard);

    expect(preventedByComponent).toBe(false);
    expect(sessionStorage.getItem("cs-tr")).toBeNull();
    expect(document.querySelectorAll("canvas")).toHaveLength(0);
  });

  it("wejście: kasuje cs-tr natychmiast i zdejmuje klasę tr-in (ścieżka bez kontekstu 2d = sprzątanie awaryjne)", async () => {
    gateMatches(false);
    sessionStorage.setItem("cs-tr", "0.4,0.5");
    document.documentElement.classList.add("tr-in");
    // jsdom bez pakietu `canvas`: getContext zwraca null → kurtyna zdjęta bez animacji.
    stubGetContext(null);

    render(<PageTransition />);
    await flushFrames();

    expect(sessionStorage.getItem("cs-tr")).toBeNull();
    expect(document.documentElement.classList.contains("tr-in")).toBe(false);
    expect(document.querySelectorAll("canvas")).toHaveLength(0);
  });

  it("wejście pod reduced-motion: natychmiast kasuje klucz i klasę, zero canvasa", () => {
    gateMatches(true);
    sessionStorage.setItem("cs-tr", "0.42,0.63");
    document.documentElement.classList.add("tr-in");

    render(<PageTransition />);

    expect(sessionStorage.getItem("cs-tr")).toBeNull();
    expect(document.documentElement.classList.contains("tr-in")).toBe(false);
    expect(document.querySelectorAll("canvas")).toHaveLength(0);
  });
});

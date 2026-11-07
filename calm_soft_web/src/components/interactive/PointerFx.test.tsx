import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PointerFx } from "./PointerFx";

// Kontrakt bramek (spec §4.1/§4.3) — ten sam string musi żyć w PointerFx.tsx,
// HeroParticleField.tsx i w bramkach bloków pointer-FX w globals.css.
const GATE_QUERY = "(prefers-reduced-motion: no-preference) and (pointer: fine)";

// rAF z kolejką callbacków (wzorzec KsefDiscountPrefill.test.tsx). Nie odpalamy callbacka
// synchronicznie wewnątrz `requestAnimationFrame`: dławienie w komponencie zapisuje id
// dopiero po powrocie z rAF, więc synchroniczny stub zatrzymałby każdą kolejną klatkę.
// Test trzyma callbacki i wywołuje je sam, w ograniczonej liczbie klatek.
let frames: FrameRequestCallback[] = [];
let nextFrameId = 0;
let rafSpy: ReturnType<typeof vi.fn>;
let cancelSpy: ReturnType<typeof vi.fn>;

function flush(framesToRun = 1) {
  for (let i = 0; i < framesToRun; i += 1) {
    const queue = frames;
    frames = [];
    for (const cb of queue) cb(0);
  }
}

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

// Fixture musi mieć realną geometrię — jsdom zwraca same zera z getBoundingClientRect, a bez
// szerokości/wysokości nie da się sprawdzić normalizacji -1..1.
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

function moveOver(el: Element, clientX: number, clientY: number) {
  el.dispatchEvent(new PointerEvent("pointermove", { clientX, clientY, bubbles: true }));
}

function vars(el: HTMLElement) {
  return {
    mx: el.style.getPropertyValue("--mx"),
    my: el.style.getPropertyValue("--my"),
    px: el.style.getPropertyValue("--px"),
    py: el.style.getPropertyValue("--py"),
  };
}

// Karta 400x200 w punkcie (20,10); kursor (320,160) ⇒ --mx=300px, --my=150px,
// a względem środka karty (220,110) ⇒ --px=0.5, --py=0.5.
function mountFixture() {
  const view = render(
    <>
      <div data-testid="both" data-glow data-tilt>
        <span data-testid="both-child">dziecko karty</span>
      </div>
      <div data-testid="glow-only" data-glow>karta bez tiltu</div>
      <div data-testid="layer" data-parallax aria-hidden="true">
        warstwa tła
      </div>
      <PointerFx />
    </>,
  );
  const both = view.getByTestId("both");
  const glowOnly = view.getByTestId("glow-only");
  const layer = view.getByTestId("layer");
  setRect(both, 20, 10, 400, 200);
  setRect(glowOnly, 20, 400, 400, 200);
  return { both, glowOnly, layer, unmount: view.unmount };
}

beforeEach(() => {
  frames = [];
  nextFrameId = 0;
  rafSpy = vi.fn((cb: FrameRequestCallback) => {
    frames.push(cb);
    nextFrameId += 1;
    return nextFrameId;
  });
  cancelSpy = vi.fn();
  vi.stubGlobal("requestAnimationFrame", rafSpy);
  vi.stubGlobal("cancelAnimationFrame", cancelSpy);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PointerFx (kontrakt atrybuty + zmienne CSS, spec §4.3)", () => {
  it("przy bramce mediów matches=false nie zapisuje żadnych zmiennych i nie zamawia klatki rAF", () => {
    const media = gateMatches(false);
    const { both, layer } = mountFixture();

    moveOver(both, 320, 160);
    flush(2);

    expect(vars(both)).toEqual({ mx: "", my: "", px: "", py: "" });
    expect(vars(layer)).toEqual({ mx: "", my: "", px: "", py: "" });
    expect(rafSpy).not.toHaveBeenCalled();
    // bramka jest czytana dokładnie raz, z zakontraktowanym zapytaniem
    expect(media).toHaveBeenCalledTimes(1);
    expect(media).toHaveBeenCalledWith(GATE_QUERY);
  });

  it("cel [data-glow][data-tilt] dostaje --mx/--my w px oraz --px/--py znormalizowane do -1..1", () => {
    gateMatches(true);
    const { both } = mountFixture();

    moveOver(both, 320, 160);
    flush();

    expect(vars(both)).toEqual({ mx: "300px", my: "150px", px: "0.5", py: "0.5" });
  });

  it("kursor w dziecku karty rozwiązuje cel przez closest() na karcie z atrybutem", () => {
    gateMatches(true);
    const { both } = mountFixture();

    moveOver(screen.getByTestId("both-child"), 320, 160);
    flush();

    expect(both.style.getPropertyValue("--mx")).toBe("300px");
    expect(both.style.getPropertyValue("--my")).toBe("150px");
  });

  it("karta z samym [data-glow] dostaje poświatę, ale nie zmienne tiltu", () => {
    gateMatches(true);
    const { glowOnly } = mountFixture();

    moveOver(glowOnly, 320, 460);
    flush();

    expect(glowOnly.style.getPropertyValue("--mx")).toBe("300px");
    expect(glowOnly.style.getPropertyValue("--my")).toBe("60px");
    expect(glowOnly.style.getPropertyValue("--px")).toBe("");
    expect(glowOnly.style.getPropertyValue("--py")).toBe("");
  });

  it("warstwa [data-parallax] dostaje --px/--py liczone względem środka viewporta", () => {
    gateMatches(true);
    const { both, layer } = mountFixture();
    const halfW = window.innerWidth / 2;
    const halfH = window.innerHeight / 2;

    moveOver(both, halfW + halfW / 2, halfH + halfH / 2);
    flush();

    expect(Number(layer.style.getPropertyValue("--px"))).toBeCloseTo(0.5);
    expect(Number(layer.style.getPropertyValue("--py"))).toBeCloseTo(0.5);
  });

  it("skrajny kursor: wartości bezjednostkowe są przycinane do <-1,1>", () => {
    gateMatches(true);
    const { both, layer } = mountFixture();

    moveOver(both, window.innerWidth * 10, -window.innerHeight * 10);
    flush();

    expect(both.style.getPropertyValue("--px")).toBe("1");
    expect(both.style.getPropertyValue("--py")).toBe("-1");
    expect(layer.style.getPropertyValue("--px")).toBe("1");
    expect(layer.style.getPropertyValue("--py")).toBe("-1");
  });

  it("dławienie rAF: wiele pointermove w jednej klatce zapisuje jedną aktualizację", () => {
    gateMatches(true);
    const { both } = mountFixture();

    moveOver(both, 100, 100);
    moveOver(both, 200, 120);
    moveOver(both, 320, 160);

    expect(rafSpy).toHaveBeenCalledTimes(1);
    flush();
    expect(vars(both)).toEqual({ mx: "300px", my: "150px", px: "0.5", py: "0.5" });
  });

  it("zmiana celu resetuje zmienne poprzedniej karty", () => {
    gateMatches(true);
    const { both, glowOnly } = mountFixture();

    moveOver(both, 320, 160);
    flush();
    expect(both.style.getPropertyValue("--mx")).toBe("300px");

    moveOver(glowOnly, 320, 460);
    flush();

    expect(vars(both)).toEqual({ mx: "", my: "", px: "", py: "" });
    expect(glowOnly.style.getPropertyValue("--mx")).toBe("300px");
  });

  it("kursor poza kartami resetuje cel i nie zostawia zmiennych na karcie", () => {
    gateMatches(true);
    const { both } = mountFixture();
    const outside = document.createElement("p");
    document.body.append(outside);

    moveOver(both, 320, 160);
    flush();

    moveOver(outside, 320, 160);
    flush();

    expect(vars(both)).toEqual({ mx: "", my: "", px: "", py: "" });
  });

  it("cleanup przy odmontowaniu: anuluje oczekującą klatkę, zdejmuje nasłuch i zmienne", () => {
    gateMatches(true);
    const { both, layer, unmount } = mountFixture();

    // odmontowanie z oczekującą klatką (bez flush) ⇒ cancelAnimationFrame na id z rAF
    moveOver(both, 320, 160);
    const pendingId = nextFrameId;
    unmount();

    expect(cancelSpy).toHaveBeenCalledWith(pendingId);

    const callsBefore = rafSpy.mock.calls.length;
    moveOver(both, 600, 300);
    moveOver(layer, 600, 300);
    flush(2);

    expect(rafSpy.mock.calls.length).toBe(callsBefore);
    expect(vars(both)).toEqual({ mx: "", my: "", px: "", py: "" });
    expect(vars(layer)).toEqual({ mx: "", my: "", px: "", py: "" });
  });
});

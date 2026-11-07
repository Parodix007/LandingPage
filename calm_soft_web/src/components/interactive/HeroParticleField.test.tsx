import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MockIntersectionObserver } from "@/test/setup";
import { HeroParticleField } from "./HeroParticleField";

// Ten sam string bramy co w PointerFx.test.tsx / PointerFx.tsx / globals.css (kontrakt §4.1).
const GATE_QUERY = "(prefers-reduced-motion: no-preference) and (pointer: fine)";

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

// Ograniczony przełącznik czekający na zrealizowanie zaplanowanych klatek rAF.
async function flushFrames(limit = 10): Promise<void> {
  for (let i = 0; i < limit; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

function stubCanvasRect(width: number, height: number): void {
  vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: width,
    bottom: height,
    width,
    height,
    toJSON: () => ({}),
  } as DOMRect);
}

function createMockCtx(canvas: HTMLCanvasElement) {
  return {
    canvas,
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    setTransform: vi.fn(),
    globalAlpha: 1,
    fillStyle: "",
  };
}

function stubGetContext(ctx: unknown): void {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    ctx as CanvasRenderingContext2D,
  );
}

function lastObserver(): MockIntersectionObserver {
  return MockIntersectionObserver.instances[MockIntersectionObserver.instances.length - 1];
}

describe("HeroParticleField", () => {
  let rafSpy: ReturnType<typeof vi.fn>;
  let cafSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    gateMatches(true);
    // Deterministyczna polirafa rAF oparta o timery: cancel naprawdę anuluje klatkę.
    const pending = new Map<number, ReturnType<typeof setTimeout>>();
    let handle = 0;
    rafSpy = vi.fn((callback: FrameRequestCallback) => {
      handle += 1;
      const id = handle;
      pending.set(
        id,
        setTimeout(() => {
          pending.delete(id);
          callback(performance.now());
        }, 0),
      );
      return id;
    });
    vi.stubGlobal("requestAnimationFrame", rafSpy);
    cafSpy = vi.fn((id: number) => {
      const timeout = pending.get(id);
      if (timeout !== undefined) {
        clearTimeout(timeout);
        pending.delete(id);
      }
    });
    vi.stubGlobal("cancelAnimationFrame", cafSpy);
  });

  afterEach(() => {
    cleanup();
    // restoreAllMocks zdejmuje spy'e z prototypów HTMLCanvasElement — bez niego spyOn
    // kolejnego testu zwraca ten sam mock z licznikiem po testach poprzednich.
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renderuje wyłącznie canvas aria-hidden z klasami pozycjonującymi", () => {
    stubGetContext(null);
    const { container } = render(<HeroParticleField className="dodatkowa" />);

    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    // Canvas jest jedynym węzłem renderowanym przez komponent.
    expect(container.children).toHaveLength(1);
    expect(canvas?.getAttribute("aria-hidden")).toBe("true");
    expect(canvas?.className).toContain("pointer-events-none");
    expect(canvas?.className).toContain("absolute");
    expect(canvas?.className).toContain("inset-0");
    expect(canvas?.className).toContain("dodatkowa");
  });

  it("gdy gate false: nie pobiera kontekstu i nie startuje pętli", () => {
    const media = gateMatches(false);
    const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, "getContext");
    const { container } = render(<HeroParticleField />);

    expect(media).toHaveBeenCalledWith(GATE_QUERY);
    expect(getContextSpy).not.toHaveBeenCalled();
    expect(rafSpy).not.toHaveBeenCalled();
    const canvas = container.querySelector("canvas");
    expect(canvas?.getAttribute("data-loop")).toBe("disabled");
  });

  it("używa dokładnie tej samej bramy co PointerFx", () => {
    const media = gateMatches(true);
    stubGetContext(null);
    render(<HeroParticleField />);
    expect(media).toHaveBeenCalledWith(GATE_QUERY);
  });

  it("gdy kontekst 2d niedostępny: pętla nie startuje i nie rzuca", async () => {
    stubCanvasRect(800, 500);
    stubGetContext(null);
    const { container } = render(<HeroParticleField />);
    await flushFrames();

    expect(container.querySelector("canvas")?.getAttribute("data-loop")).toBe("off");
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it("gdy gate true i kontekst dostępny: pętla startuje i rysuje", async () => {
    stubCanvasRect(800, 500);
    const ctx = createMockCtx(document.createElement("canvas"));
    stubGetContext(ctx);

    const { container } = render(<HeroParticleField />);
    await flushFrames();

    expect(container.querySelector("canvas")?.getAttribute("data-loop")).toBe("running");
    expect(ctx.clearRect).toHaveBeenCalled();
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it("liczba cząstek zależy od pola i jest ograniczona do 90", async () => {
    stubCanvasRect(800, 500); // 400 000 px² / 16 000 = 25
    stubGetContext(createMockCtx(document.createElement("canvas")));
    const { container } = render(<HeroParticleField />);
    await flushFrames();

    const count = Number(
      container.querySelector("canvas")?.getAttribute("data-particle-count"),
    );
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(90);

    cleanup();

    stubCanvasRect(4000, 4000); // 16 000 000 px² → clamp do 90
    stubGetContext(createMockCtx(document.createElement("canvas")));
    const second = render(<HeroParticleField />);
    await flushFrames();

    expect(
      second.container.querySelector("canvas")?.getAttribute("data-particle-count"),
    ).toBe("90");
  });

  it("skala DPR jest ograniczona do 1.5 przy zachowaniu układu CSS", async () => {
    const originalDpr = window.devicePixelRatio;
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      value: 3,
    });
    stubCanvasRect(800, 500);
    stubGetContext(createMockCtx(document.createElement("canvas")));

    const { container } = render(<HeroParticleField />);
    await flushFrames();

    const canvas = container.querySelector("canvas") as HTMLCanvasElement;
    expect(canvas.width).toBe(1200);
    expect(canvas.height).toBe(750);

    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      value: originalDpr,
    });
  });

  it("IntersectionObserver pauzuje i wznawia pętlę", async () => {
    stubCanvasRect(800, 500);
    stubGetContext(createMockCtx(document.createElement("canvas")));
    const { container } = render(<HeroParticleField />);
    await flushFrames();

    const canvas = container.querySelector("canvas") as HTMLCanvasElement;
    expect(canvas.getAttribute("data-loop")).toBe("running");

    lastObserver().triggerIntersect(canvas, false);
    await flushFrames();
    expect(canvas.getAttribute("data-loop")).toBe("paused");

    lastObserver().triggerIntersect(canvas, true);
    await flushFrames();
    expect(canvas.getAttribute("data-loop")).toBe("running");
  });

  it("po odmontowaniu pętla jest zatrzymana, a pointermove nic nie planuje", async () => {
    stubCanvasRect(800, 500);
    const ctx = createMockCtx(document.createElement("canvas"));
    stubGetContext(ctx);

    const { container, unmount } = render(<HeroParticleField />);
    await flushFrames();

    const canvas = container.querySelector("canvas") as HTMLCanvasElement;
    expect(canvas.getAttribute("data-loop")).toBe("running");

    unmount();
    expect(canvas.getAttribute("data-loop")).toBe("stopped");
    expect(cafSpy).toHaveBeenCalled();

    const clearCalls = ctx.clearRect.mock.calls.length;
    const rafCalls = rafSpy.mock.calls.length;
    await flushFrames();
    window.dispatchEvent(
      new PointerEvent("pointermove", { clientX: 10, clientY: 10, bubbles: true }),
    );
    await flushFrames();

    expect(ctx.clearRect.mock.calls.length).toBe(clearCalls);
    expect(rafSpy.mock.calls.length).toBe(rafCalls);
  });
});

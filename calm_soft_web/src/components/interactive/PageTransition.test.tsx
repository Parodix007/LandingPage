import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  PageTransition,
  logoGeometry,
  logoInkBox,
  qualifyTransitionHref,
  resolveCellSize,
  resolveClickPoint,
  resolveRasterRatio,
  snapToPixelGrid,
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

// jsdom definiuje innerWidth/innerHeight jako konfigurowalne akcesory okna — podstawiamy własne
// wartości i przywracamy oryginalne deskryptory po teście (pobrane raz, przed pierwszą nadpisą).
const VIEWPORT_DESCRIPTORS = {
  innerWidth: Object.getOwnPropertyDescriptor(window, "innerWidth"),
  innerHeight: Object.getOwnPropertyDescriptor(window, "innerHeight"),
};

function resizeViewportTo(innerW: number, innerH: number): void {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: innerW });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: innerH });
}

function setViewport(innerW: number, innerH: number): void {
  resizeViewportTo(innerW, innerH);
}

function restoreViewport(): void {
  if (VIEWPORT_DESCRIPTORS.innerWidth) {
    Object.defineProperty(window, "innerWidth", VIEWPORT_DESCRIPTORS.innerWidth);
  }
  if (VIEWPORT_DESCRIPTORS.innerHeight) {
    Object.defineProperty(window, "innerHeight", VIEWPORT_DESCRIPTORS.innerHeight);
  }
}

// Pojedyncze ostre rysowanie bitmapy loga (brief #11): pozycja/rozmiar w pikselach CSS wraz z
// alfą i ustawieniami wygładzenia w chwili wywołania drawImage na canvasie tranzycji.
type LogoDraw = {
  x: number;
  y: number;
  w: number;
  h: number;
  alpha: number;
  smoothing: boolean;
  quality: string;
};

// Kontekst 2d z podsłuchem: zwracane są prostokąty każdej klatki (mozaika wyjścia maluje WSZYSTKIE
// komórki co klatkę, więc po nich liczymy pokrycie viewporta) oraz liczba aplikacji transformu.
// drawImage rejestruje ONLY wywołania pięcioargumentowe (drawImage(source, x, y, w, h)) — to rysunki
// loga na canvasie tranzycji; wycinki offscreen (3/9 argumentów) są poza kontraktem. `ops` to
// kolejność operacji w klatce — sprawdza, że logo jest rysowane PO kafelkach tła.
function stubDrawContext(getImageData?: (w: number, h: number) => Uint8ClampedArray) {
  let frame: number[][] = [];
  let draws: LogoDraw[] = [];
  let ops: string[] = [];
  const setTransform = vi.fn();
  const ctx: Record<string, unknown> = {
    fillRect: vi.fn((x: number, y: number, w: number, h: number) => {
      frame.push([x, y, w, h]);
      ops.push("rect");
    }),
    clearRect: vi.fn(() => {
      ops.push("clear");
    }),
    setTransform,
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    drawImage: vi.fn((...args: unknown[]) => {
      if (args.length === 5) {
        draws.push({
          x: args[1] as number,
          y: args[2] as number,
          w: args[3] as number,
          h: args[4] as number,
          alpha: ctx.globalAlpha as number,
          smoothing: ctx.imageSmoothingEnabled as boolean,
          quality: ctx.imageSmoothingQuality as string,
        });
        ops.push("draw");
      }
    }),
    imageSmoothingEnabled: false,
    imageSmoothingQuality: "low",
    globalAlpha: 1,
    fillStyle: "",
  };
  if (getImageData) {
    ctx.getImageData = vi.fn((_x: number, _y: number, w: number, h: number) => ({
      data: getImageData(w, h),
    }));
  }
  stubGetContext(ctx);
  return {
    nextFrame(): number[][] {
      const taken = frame;
      frame = [];
      return taken;
    },
    nextDraws(): LogoDraw[] {
      const taken = draws;
      draws = [];
      return taken;
    },
    nextOps(): string[] {
      const taken = ops;
      ops = [];
      return taken;
    },
    setTransform,
  };
}

// rAF na uchwycie: test sam pcha klatki, a `delta` liczymy od startu animacji (ten sam zegar co
// `performance.now()` w komponencie) — bez realnych 830 ms czekania.
function stubFrames() {
  let queue: FrameRequestCallback[] = [];
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    queue.push(callback);
    return queue.length;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  return {
    pump(delta: number): void {
      const now = performance.now() + delta;
      const batch = queue;
      queue = [];
      for (const callback of batch) callback(now);
    },
  };
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

  describe("responsywna siatka i rebuild viewportu w trakcie tranzycji", () => {
    afterEach(() => {
      // Tutejsze testy zostawiają wyjściowe canvasy w DOM (dokument „odchodzi") oraz fałszywe
      // timery z pending 470 ms nawigacją — sprzątamy wszystko zanim outer afterEach coś odmontuje.
      vi.useRealTimers();
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
      restoreViewport();
      document.querySelectorAll("canvas.tr-canvas").forEach((el) => el.remove());
    });

    function clickInternal(container: HTMLElement): void {
      const anchor = container.querySelector("a") as HTMLAnchorElement;
      anchor.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          button: 0,
          clientX: 120,
          clientY: 300,
        }),
      );
    }

    it("resolveCellSize zwraca 22 dla wąskich ekranów i 30 od progu 900px", () => {
      expect(resolveCellSize(390)).toBe(22);
      expect(resolveCellSize(899)).toBe(22);
      expect(resolveCellSize(900)).toBe(30);
      expect(resolveCellSize(1280)).toBe(30);
    });

    it("na wąskim viewportie kratka wyjścia ma rozmiar 22px", () => {
      vi.useFakeTimers();
      setViewport(390, 844);
      const draw = stubDrawContext();
      const raf = stubFrames();
      gateMatches(false);

      const { container, unmount } = render(
        <>
          <PageTransition />
          <a href="/o-mnie/">link</a>
        </>,
      );
      clickInternal(container);
      raf.pump(0);

      const rects = draw.nextFrame();
      expect(rects.length).toBeGreaterThan(0);
      for (const [, , w, h] of rects) {
        expect(w).toBe(22);
        expect(h).toBe(22);
      }
      unmount();
    });

    it("resize powiększający w trakcie wyjścia: canvas, transform i siatka pokrywają nowy obszar", () => {
      vi.useFakeTimers();
      setViewport(390, 640);
      const draw = stubDrawContext();
      const raf = stubFrames();
      gateMatches(false);

      const { container, unmount } = render(
        <>
          <PageTransition />
          <a href="/o-mnie/">link</a>
        </>,
      );
      clickInternal(container);
      raf.pump(0);

      const canvas = document.querySelector("canvas.tr-canvas") as HTMLCanvasElement;
      expect(canvas.getAttribute("width")).toBe("390");
      expect(canvas.getAttribute("height")).toBe("640");
      draw.setTransform.mockClear();

      // Scenariusz mobilny: pasek adresu chowa się w połowie animacji → viewport rasta.
      setViewport(390, 844);
      window.dispatchEvent(new Event("resize"));

      expect(canvas.getAttribute("width")).toBe("390");
      expect(canvas.getAttribute("height")).toBe("844");

      raf.pump(0);
      expect(draw.setTransform).toHaveBeenCalled();

      const rects = draw.nextFrame();
      expect(rects.length).toBeGreaterThan(0);
      let maxX = 0;
      let maxY = 0;
      for (const [x, y, w, h] of rects) {
        maxX = Math.max(maxX, x + w);
        maxY = Math.max(maxY, y + h);
      }
      expect(maxX).toBeGreaterThanOrEqual(390);
      expect(maxY).toBeGreaterThanOrEqual(844);
      unmount();
    });

    it("resize zmniejszający w trakcie wyjścia: atrybuty canvasa dopasowane, klatki bez błędu", () => {
      vi.useFakeTimers();
      setViewport(800, 800);
      const draw = stubDrawContext();
      const raf = stubFrames();
      gateMatches(false);

      const { container, unmount } = render(
        <>
          <PageTransition />
          <a href="/o-mnie/">link</a>
        </>,
      );
      clickInternal(container);
      raf.pump(0);

      const canvas = document.querySelector("canvas.tr-canvas") as HTMLCanvasElement;
      expect(canvas.getAttribute("width")).toBe("800");
      expect(canvas.getAttribute("height")).toBe("800");

      setViewport(800, 500);
      window.dispatchEvent(new Event("resize"));
      expect(canvas.getAttribute("height")).toBe("500");

      raf.pump(0);
      raf.pump(0);
      expect(() => draw.nextFrame()).not.toThrow();
      unmount();
    });

    it("orientationchange w trakcie wejścia: canvas dopasowany do nowych wymiarów", () => {
      vi.useFakeTimers();
      setViewport(390, 844);
      const draw = stubDrawContext();
      const raf = stubFrames();
      gateMatches(false);
      sessionStorage.setItem("cs-tr", "0.5,0.5");
      document.documentElement.classList.add("tr-in");

      render(<PageTransition />);
      raf.pump(0);

      const canvas = document.querySelector("canvas.tr-canvas") as HTMLCanvasElement;
      expect(canvas.getAttribute("width")).toBe("390");
      expect(canvas.getAttribute("height")).toBe("844");
      draw.setTransform.mockClear();

      setViewport(844, 390);
      window.dispatchEvent(new Event("orientationchange"));

      expect(canvas.getAttribute("width")).toBe("844");
      expect(canvas.getAttribute("height")).toBe("390");
      expect(draw.setTransform).toHaveBeenCalled();
    });

    it("po zamknięciu wejścia (drop) nasłuch viewportu jest odpięty", () => {
      vi.useFakeTimers();
      setViewport(390, 844);
      stubDrawContext();
      const raf = stubFrames();
      const addSpy = vi.spyOn(window, "addEventListener");
      const removeSpy = vi.spyOn(window, "removeEventListener");
      gateMatches(false);
      sessionStorage.setItem("cs-tr", "0.5,0.5");
      document.documentElement.classList.add("tr-in");

      render(<PageTransition />);
      raf.pump(0);

      const addedResize = addSpy.mock.calls.filter((c) => c[0] === "resize").length;
      const addedOrient = addSpy.mock.calls
        .filter((c) => c[0] === "orientationchange")
        .length;
      expect(addedResize).toBe(1);
      expect(addedOrient).toBe(1);

      // Pcha zegar ponad ENTER_TOTAL_MS i wypompowuje ostatnią klatkę → drop().
      vi.advanceTimersByTime(900);
      raf.pump(0);

      const removedResize = removeSpy.mock.calls.filter((c) => c[0] === "resize").length;
      const removedOrient = removeSpy.mock.calls
        .filter((c) => c[0] === "orientationchange")
        .length;
      expect(removedResize).toBe(addedResize);
      expect(removedOrient).toBe(addedOrient);
      expect(document.querySelector("canvas.tr-canvas")).toBeNull();
    });

    it("po odmontowaniu wychodzącego dokumentu nasłuch viewportu jest odpięty", () => {
      vi.useFakeTimers();
      setViewport(390, 844);
      stubDrawContext();
      const raf = stubFrames();
      const addSpy = vi.spyOn(window, "addEventListener");
      const removeSpy = vi.spyOn(window, "removeEventListener");
      gateMatches(false);

      const { container, unmount } = render(
        <>
          <PageTransition />
          <a href="/o-mnie/">link</a>
        </>,
      );
      clickInternal(container);
      raf.pump(0);

      const addedResize = addSpy.mock.calls.filter((c) => c[0] === "resize").length;
      const addedOrient = addSpy.mock.calls
        .filter((c) => c[0] === "orientationchange")
        .length;
      expect(addedResize).toBe(1);
      expect(addedOrient).toBe(1);

      unmount();

      const removedResize = removeSpy.mock.calls.filter((c) => c[0] === "resize").length;
      const removedOrient = removeSpy.mock.calls
        .filter((c) => c[0] === "orientationchange")
        .length;
      expect(removedResize).toBe(addedResize);
      expect(removedOrient).toBe(addedOrient);
    });
  });

  // bbox tuszu loga (fix: PNG 1600×400 z ogromnym przezroczystym marginesem — siatka liczona
  // z wymiarów płótna dawała ~31px wysokości napisu na telefonie, nieczytelnie przy any sampling)
  describe("logoInkBox", () => {
    // Syntetyczny bufor RGBA (jsdom-safe, zero canvas API): w domenie realnej dane pochodzą z getImageData.
    const makeRgba = (w: number, h: number): Uint8ClampedArray => new Uint8ClampedArray(w * h * 4);
    const putPixel = (
      data: Uint8ClampedArray,
      w: number,
      x: number,
      y: number,
      r: number,
      g: number,
      b: number,
      a: number,
    ): void => {
      const i = (y * w + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    };

    it("bufor całkowicie przezroczysty: null", () => {
      expect(logoInkBox(makeRgba(10, 10), 10, 10)).toBeNull();
    });

    it("zwiera ciasny prostokąt wokół pikseli tuszu (poza progiem ALPHA_CUTOFF)", () => {
      const data = makeRgba(10, 10);
      // Blokowisko tuszu x∈2..5, y∈3..6 → bbox 4×4 przesunięty od środka płótna.
      for (let y = 3; y <= 6; y += 1) {
        for (let x = 2; x <= 5; x += 1) putPixel(data, 10, x, y, 250, 250, 250, 200);
      }
      expect(logoInkBox(data, 10, 10)).toEqual({ x: 2, y: 3, w: 4, h: 4 });
    });

    it("alfa równa ALPHA_CUTOFF (110) liczy się jako brak tuszu, alfa 111 już tak", () => {
      const atCutoff = makeRgba(10, 10);
      putPixel(atCutoff, 10, 5, 5, 250, 250, 250, 110);
      expect(logoInkBox(atCutoff, 10, 10)).toBeNull();

      const aboveCutoff = makeRgba(10, 10);
      putPixel(aboveCutoff, 10, 5, 5, 250, 250, 250, 111);
      expect(logoInkBox(aboveCutoff, 10, 10)).toEqual({ x: 5, y: 5, w: 1, h: 1 });
    });
  });

  // geometria bitmapy loga (brief #11): METRYKA, gdzie i jak dużo rysujemy ostrego obrazu —
  // szerokość renderu min(0.7 viewportu, naturalny tusz), wysokość zachowuje proporcje tuszu.
  // Kwantyzacja na płytki (cell/cols/rows) jest USUNIĘTA — logo to JEDEN ostry drawImage.
  describe("logoGeometry", () => {
    // Wymary rzeczywistego tuszu calmsoft-logo.png: bbox 948×162 px PNG.
    it("telefon 412px: renderW = 0.7 viewportu, renderH = renderW × 162/948", () => {
      const geo = logoGeometry(412, 948, 162);
      expect(geo.renderW).toBeCloseTo(288.4, 6); // 412 * 0.7
      expect(geo.renderH).toBeCloseTo((288.4 * 162) / 948, 6); // ≈ 49.318
    });

    it("desktop 1280px: renderW 896 (0.7 viewportu), proporcje tuszu 948:162 zachowane", () => {
      const geo = logoGeometry(1280, 948, 162);
      expect(geo.renderW).toBeCloseTo(896, 6);
      expect(geo.renderH).toBeCloseTo((896 * 162) / 948, 6); // ≈ 153.116
      expect(geo.renderW / geo.renderH).toBeCloseTo(948 / 162, 6);
    });

    it("szeroki viewport 2560px: render nigdy nie skaluje ponad naturalną szerokość tuszu", () => {
      const geo = logoGeometry(2560, 948, 162);
      expect(geo.renderW).toBe(948); // cap: min(1792, 948)
      expect(geo.renderH).toBe(162);
    });

    it("proporcje tuszu zachowane dla każdej szerokości 320/412/1280/2560", () => {
      for (const innerW of [320, 412, 1280, 2560]) {
        const geo = logoGeometry(innerW, 948, 162);
        expect(geo.renderW / geo.renderH).toBeCloseTo(948 / 162, 6);
      }
    });
  });

  // wyrównanie geometrii do siatki pikseli urządzenia — fix: ułamkowe pozycje płytek antyaliasują
  // krawędzie (rozmazane płytki mozaiki loga: y0 = (innerH − renderH)/2 wypada na ułamkowy piksel
  // urządzenia, a canvas wygładza każdą fillRect bez krawędzi na granicy pikseli)
  describe("snapToPixelGrid", () => {
    it("dpr 1 — desktop 1280×800: y0 = 323.443 pada na 323 (pełny piksel urządzenia)", () => {
      expect(snapToPixelGrid(323.44303797468353, 1)).toBe(323);
    });

    it("dpr 2 — telefon 440×956: y0 = 451.684 pada na 451.5 (903 piksele urządzenia)", () => {
      expect(snapToPixelGrid(451.6835443037975, 2)).toBe(451.5);
    });

    it("wartości już na siatce nie zmieniają się (66 przy dpr 2 i dpr 3)", () => {
      expect(snapToPixelGrid(66, 2)).toBe(66);
      expect(snapToPixelGrid(66, 3)).toBe(66);
    });

    it("ułamkowe dpr (1.5): wynik pada na wielokrotność 1/dpr", () => {
      expect(snapToPixelGrid(100.4, 1.5)).toBeCloseTo(Math.round(150.6) / 1.5, 10);
    });

    it("ujemne wartości: -0.2 przy dpr 2 daje -0 (zero siatki), 0 zostaje 0", () => {
      expect(snapToPixelGrid(-0.2, 2)).toBe(-0); // Object.is(-0, -0) — znak zera zachowany
      expect(snapToPixelGrid(0, 2)).toBe(0);
    });
  });

  // Ostre logo w tranzycji (brief #11): napis „calm_soft" to JEDEN ostry bitmap rysowany
  // drawImage z wygładzaniem (imageSmoothingEnabled), NIE siatka wyciętych płytek. Mozaika
  // TŁA (fillRect) bez zmian — liczba fillRect dotyczy wyłącznie kafli tła.
  describe("logo jako ostry bitmap (drawImage)", () => {
    const PNG_W = 1600;
    const PNG_H = 400;
    const INK_W = 948; // realny bbox tuszu /calmsoft-logo.png (alfy > ALPHA_CUTOFF)
    const INK_H = 162;

    // Fixtura getImageData: blok tuszu (0,0)..(948,162) z alfą 200, resztą płótna przezroczystą
    // — realny PNG ma ~3/4 pola jako przezroczysty margines.
    function inkFixture(w: number, h: number): Uint8ClampedArray {
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < Math.min(INK_H, h); y += 1) {
        for (let x = 0; x < Math.min(INK_W, w); x += 1) {
          const i = (y * w + x) * 4;
          data[i] = 124;
          data[i + 1] = 227;
          data[i + 2] = 139;
          data[i + 3] = 200;
        }
      }
      return data;
    }

    // jsdom nie ładuje obrazów z public/ — mock odpala onload synchronicznie przy przypisaniu
    // src, więc logo jest gotowe przed pierwszą wypompowaną klatką.
    class FakeLogoImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      readonly naturalWidth = PNG_W;
      readonly naturalHeight = PNG_H;
      private _src = "";

      get src(): string {
        return this._src;
      }

      set src(value: string) {
        this._src = value;
        this.onload?.();
      }
    }

    afterEach(() => {
      // Wyjściowe canvasy zostają w DOM (dokument „odchodzi"), timery fałszywe z pending
      // nawigacją 470 ms i stub Image/devicePixelRatio — sprzątamy przed kolejnym testem.
      vi.useRealTimers();
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
      restoreViewport();
      document.querySelectorAll("canvas.tr-canvas").forEach((el) => el.remove());
    });

    function armExitScenario(): {
      draw: ReturnType<typeof stubDrawContext>;
      raf: ReturnType<typeof stubFrames>;
      click: () => void;
      unmount: () => void;
    } {
      vi.useFakeTimers();
      const draw = stubDrawContext(inkFixture);
      vi.stubGlobal("Image", FakeLogoImage);
      const raf = stubFrames();
      gateMatches(false);
      const { container, unmount } = render(
        <>
          <PageTransition />
          <a href="/o-mnie/">link</a>
        </>,
      );
      const click = () => {
        (container.querySelector("a") as HTMLAnchorElement).dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            button: 0,
            clientX: 120,
            clientY: 300,
          }),
        );
      };
      return { draw, raf, click, unmount };
    }

    it("exit: logo rysowane jako pojedynczy drawImage PO kafelkach tła, w każdej klatce z pełną alfą", () => {
      setViewport(1280, 800);
      const { draw, raf, click, unmount } = armExitScenario();
      click();

      for (const delta of [0, 150, 300]) {
        raf.pump(delta);
        const rects = draw.nextFrame();
        const logoDraws = draw.nextDraws();
        const ops = draw.nextOps();

        expect(rects.length).toBeGreaterThan(0);
        // jedyne fillRect to kafle tła (CELL 30 dla viewportu ≥900) — logo nie pikluje
        for (const [, , w, h] of rects) {
          expect(w).toBe(30);
          expect(h).toBe(30);
        }
        // dokładnie jeden ostry bitmap na klatkę, rysowany po ostatnim kafelku tła
        expect(logoDraws).toHaveLength(1);
        expect(ops.filter((op) => op === "draw")).toHaveLength(1);
        expect(ops.indexOf("draw")).toBeGreaterThan(0);
        expect(ops[ops.length - 1]).toBe("draw");

        const logo = logoDraws[0];
        // metryczne wymiary z logoGeometry: renderW = 0.7 viewportu, proporcje tuszu 948:162
        expect(logo.w).toBeCloseTo(896, 6);
        expect(logo.h).toBeCloseTo((896 * INK_H) / INK_W, 6);
        expect(logo.alpha).toBe(1); // exit: pełna alpha — zawsze czytelne nad rozpadającym się tłem
        expect(logo.smoothing).toBe(true);
        expect(logo.quality).toBe("high");
      }
      unmount();
    });

    it("pozycja i wymiary drawImage: wyśrodkowane, snapped do siatki pikseli urządzenia (412×915 @ dpr 3)", () => {
      setViewport(412, 915);
      vi.stubGlobal("devicePixelRatio", 3);
      const { draw, raf, click, unmount } = armExitScenario();
      click();
      raf.pump(0);

      const [logo] = draw.nextDraws();
      expect(logo.w).toBeCloseTo(288.4, 6); // 412 * 0.7
      expect(logo.h).toBeCloseTo((288.4 * INK_H) / INK_W, 6); // ≈ 49.318
      // geometrycznie tam gdzie dziś: środek viewportu (bbox tuszu wyśrodkowany), z odchyleniem
      // najwyżej o pół piksela urządzenia — tyle właśnie wynosi snapping do siatki 1/dpr
      expect(Math.abs(logo.x - (412 - logo.w) / 2)).toBeLessThanOrEqual(0.5 / 3 + 1e-9);
      expect(Math.abs(logo.y - (915 - logo.h) / 2)).toBeLessThanOrEqual(0.5 / 3 + 1e-9);
      // pozycja na siatce pikseli urządzenia: x*dpr i y*dpr są całkowite
      expect(Math.abs(Math.round(logo.x * 3) - logo.x * 3)).toBeLessThan(1e-9);
      expect(Math.abs(Math.round(logo.y * 3) - logo.y * 3)).toBeLessThan(1e-9);

      // bitmapa canvasa tranzycji nadal 1:1 z pikselami fizycznymi (resolveRasterRatio bez zmian)
      const canvas = document.querySelector("canvas.tr-canvas") as HTMLCanvasElement;
      expect(canvas.getAttribute("width")).toBe("1236"); // 412 * 3
      expect(canvas.getAttribute("height")).toBe("2745"); // 915 * 3
      unmount();
    });

    it("enter: logo wjeżdża rampą alfy 0→1 (globalAlpha monotoniczną w [0,1]), nadal jeden drawImage", () => {
      setViewport(412, 915);
      vi.stubGlobal("devicePixelRatio", 3);
      vi.useFakeTimers();
      const draw = stubDrawContext(inkFixture);
      vi.stubGlobal("Image", FakeLogoImage);
      const raf = stubFrames();
      gateMatches(false);
      sessionStorage.setItem("cs-tr", "0.5,0.5");
      document.documentElement.classList.add("tr-in");

      render(<PageTransition />);

      // przed startem rampy (ENTER_BASE_DELAY_MS + LOGO_SPREAD_MS = 170) logo jeszcze nie widać
      raf.pump(0); // t=0
      expect(draw.nextDraws()).toHaveLength(0);
      vi.advanceTimersByTime(170);
      raf.pump(0); // t=170: p=0 → rampa nierozpoczęta
      expect(draw.nextDraws()).toHaveLength(0);

      // próbki w oknie LOGO_RAMP_MS=120 (t=200..290) + jedna po rampie (t=350)
      const alphas: number[] = [];
      for (const stepMs of [30, 30, 30, 30, 60]) {
        vi.advanceTimersByTime(stepMs);
        raf.pump(0);
        const logoDraws = draw.nextDraws();
        expect(logoDraws).toHaveLength(1);
        expect(logoDraws[0].smoothing).toBe(true);
        expect(logoDraws[0].quality).toBe("high");
        alphas.push(logoDraws[0].alpha);

        const rects = draw.nextFrame();
        // fillRect wyłącznie kafle tła (CELL_NARROW 22 dla viewportu <900) — zero płytek logo
        for (const [, , w, h] of rects) {
          expect(w).toBe(22);
          expect(h).toBe(22);
        }
      }
      expect(alphas).toHaveLength(5);
      for (const a of alphas) {
        expect(a).toBeGreaterThanOrEqual(0);
        expect(a).toBeLessThanOrEqual(1);
      }
      // monotonicznie nie malejąco i realnie rośnie (rampa w toku), po rampie pełna alfa
      for (let i = 1; i < alphas.length; i += 1) {
        expect(alphas[i]).toBeGreaterThanOrEqual(alphas[i - 1]);
      }
      expect(alphas[0]).toBeGreaterThan(0);
      expect(alphas[alphas.length - 1]).toBeCloseTo(1, 6);
    });
  });

  // Rasteryzacja 1:1 z pikselami fizycznymi — fix: klampa dpr 2 na telefonach DPR3 powodowała
  // biliniowe skalowanie całego bufora przez kompozytor (rozmycie).
  describe("resolveRasterRatio", () => {
    it("telefon DPR3 oddaje 3 bez klamry (stara klampa Math.min(...,2) dawała 2 = RED)", () => {
      expect(resolveRasterRatio(3)).toBe(3);
    });

    it("ułamkowe DPR (2.625 — Android) przechodzi bez zaokrągleń i klamry", () => {
      expect(resolveRasterRatio(2.625)).toBe(2.625);
    });

    it("DPR 2 (desktop Retina) przechodzi bez zmian", () => {
      expect(resolveRasterRatio(2)).toBe(2);
    });

    it("DPR 1 (zwykły ekran) przechodzi bez zmian", () => {
      expect(resolveRasterRatio(1)).toBe(1);
    });

    it("brak devicePixelRatio (undefined) daje fallback 1", () => {
      expect(resolveRasterRatio(undefined)).toBe(1);
    });

    it("dpr 0 (jsdom/awaria) daje fallback 1", () => {
      expect(resolveRasterRatio(0)).toBe(1);
    });

    it("NaN daje fallback 1 (NaN || 1 === 1)", () => {
      expect(resolveRasterRatio(Number.NaN)).toBe(1);
    });
  });
});

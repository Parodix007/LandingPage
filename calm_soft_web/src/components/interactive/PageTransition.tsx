"use client";

import { useEffect } from "react";

// Tranzycja strony (brief #9): klik w link wewnętrzny odpala pełnoekranową mozaikę „wyjścia",
// a nowy dokument startuje pod kurtyną CSS i odtwarza „wejście" z fizyką. Mechanizm jest
// liściem bez własnego DOM (wzorzec PointerFx/RevealOnScroll) — canvas powstaje imperatywnie,
// bo na czas wychodzenia strony nie ma sensu trzymać warstwy w drzewie Reacta, a przy wejściu
// kurtynę musi postawić inline script w <head> przed pierwszym paintem.
//
// Bramą JEST WYŁĄCZNIE prefers-reduced-motion (decyzja właściciela brief #9) — nie ujednolicać
// z bramą pointer. Tranzycja nie zależy od wskaźnika: działa tak na desktopie, jak i na dotyku.
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

// Klucz jednorazowy: zapisuje go wychodzący dokument, czyta wchodzący i natychmiast usuwa,
// żeby odświeżenie (F5) nie odpalało kurtyny.
const TR_KEY = "cs-tr";

// Kontrakt timingów (brief #9) — wartości są częścią umowy z recenzją, nie dopasowywać „na ucho".
const NAVIGATE_AFTER_MS = 470;
const CELL = 30;
const EXIT_SPREAD_MS = 150;
const EXIT_RAMP_MS = 300;
const LOGO_EXIT_CELL = 18;
const LOGO_ENTER_CELL = 14;
const LOGO_SPREAD_MS = 100;
const LOGO_RAMP_MS = 120;
const ENTER_BASE_DELAY_MS = 70;
const ENTER_EDGE_SPREAD_MS = 240;
const ENTER_DURATION_MS = 520;
const ENTER_TOTAL_MS = ENTER_BASE_DELAY_MS + ENTER_EDGE_SPREAD_MS + ENTER_DURATION_MS;
const DRAG = 0.985;
const GRAVITY = 14;
const ALPHA_CUTOFF = 110;
const LOGO_SRC = "/calmsoft-logo.png";

// canvas 2D nie czyta zmiennych CSS — kolory powtarzają tokeny z globals.css (@theme).
const ACCENT_RGB: Rgb = { r: 0x7c, g: 0xe3, b: 0x8b }; // = --color-accent (#7ce38b)
const CANVAS_RGB: Rgb = { r: 0, g: 0, b: 0 }; // = --color-canvas (#000)

type Point = { x: number; y: number };
type Cell = { x: number; y: number; base: Rgb; delay: number };
type Rgb = { r: number; g: number; b: number };
type Tile = { x: number; y: number; color: string; delay: number };

export function qualifyTransitionHref(
  href: string | null,
  origin: string,
  currentPath: string,
): string | null {
  // Null dla wszystkiego, co ma nawigować natywnie: mailto:/tel:, zewnętrzne (Calendly),
  // ta sama ścieżka (kotwice) i trasy bez kończącego ukośnika (output: 'export' + trailingSlash).
  if (!href) return null;
  if (href.startsWith("#")) return null; // goły `#...` nigdy nie zmienia dokumentu, a rozwiązywany
  // do korzenia zrzucałby z podstrony na jej odpowiednik w stronie głównej → natywny scroll w kadrze
  try {
    const url = new URL(href, origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.origin !== new URL(origin).origin) return null;
    const path = url.pathname;
    if (!path.endsWith("/") || path === currentPath) return null;
    // Zwracamy pełny cel (pathname + search + hash), nie sam pathname: linki kotwiczące DO
    // INNEJ ścieżki (nav „Kontakt" z podstron, stopka) to główne CTA, a hash zachowujemy, bo
    // przeglądarka sama doscrolluje po załadowaniu (scroll-margin-top + kotwice) — utrata
    // kotwicy łamałaby je. Porównanie „ta sama ścieżka" liczy się BEZ hasha (path powyżej).
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}

export function resolveClickPoint(
  clientX: number,
  clientY: number,
  target: HTMLElement,
  innerW: number,
  innerH: number,
): Point {
  // Klik myszą/ dotykiem ma koordynaty viewportowe; klawiaturowy Enter daje (0,0), więc wtedy
  // liczymy środek samego <a> — inaczej mozaika zalewałaby się z górnego rogu strony.
  const clamp = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);
  const realClick =
    Number.isFinite(clientX) &&
    Number.isFinite(clientY) &&
    clientX > 0 &&
    clientY > 0 &&
    innerW > 0 &&
    innerH > 0;
  if (realClick) {
    return { x: clamp(clientX / innerW), y: clamp(clientY / innerH) };
  }
  const rect = target.getBoundingClientRect();
  if (innerW <= 0 || innerH <= 0) return { x: 0.5, y: 0.5 };
  return {
    x: clamp((rect.left + rect.width / 2) / innerW),
    y: clamp((rect.top + rect.height / 2) / innerH),
  };
}

function reducedMotion(): boolean {
  // Brak matchMedia traktujemy jak reduce: awaryjna nawigacja bez animacji.
  if (typeof window.matchMedia !== "function") return true;
  return window.matchMedia(REDUCED_QUERY).matches;
}

function readStoredPoint(): Point {
  // Klucz jest jednorazowy — usuwamy go przy odczycie, żeby F5 nie powtórzył kurtyny.
  try {
    const raw = sessionStorage.getItem(TR_KEY);
    sessionStorage.removeItem(TR_KEY);
    if (!raw) return { x: 0.5, y: 0.5 };
    const [x, y] = raw.split(",");
    const px = Number.parseFloat(x);
    const py = Number.parseFloat(y);
    if (!Number.isFinite(px) || !Number.isFinite(py)) return { x: 0.5, y: 0.5 };
    return { x: Math.min(1, Math.max(0, px)), y: Math.min(1, Math.max(0, py)) };
  } catch {
    return { x: 0.5, y: 0.5 };
  }
}

function clearStoredPoint(): void {
  try {
    sessionStorage.removeItem(TR_KEY);
  } catch {
    /* prywatny tryb / brak dostępu — kurtynę i tak zdejmujemy */
  }
}

function parseRgb(value: string): Rgb | null {
  const match = value.match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  // Jeden separator łapie obie składnie: `rgba(0, 0, 0, 0)` i `rgba(0 0 0 / 0)`.
  const parts = match[1].trim().split(/[\s,/]+/).map(Number);
  if (parts.length < 3 || parts.some((n) => !Number.isFinite(n))) return null;
  // Alfa ≈ 0 (tło przezroczyste) to BRAK tła, a nie czerń — bez tego odrzucenia kratki
  // lądowałyby czarne na czarnej kurtynie zamiast szukać tła głębiej w stosie.
  if (parts.length >= 4 && parts[3] < 0.01) return null;
  return { r: parts[0], g: parts[1], b: parts[2] };
}

// Tło kratki: dokładnie jak strona referencyjna — próbkujemy piksel pod środkiem kratki
// i jeśli jest zielonkowaty (G>R i G>B) używamy akcentu, inaczej tła strony.
function sampleBase(x: number, y: number): Rgb {
  // elementsFromPoint (nie elementFromPoint): przy aktywnym `tr-in` hit-test trafia zawsze w
  // pseudo-kurtynę `body::before`, więc elementFromPoint zwraca tylko body i kratki wyszłyby
  // czarne na czarnej kurtynie. elementsFromPoint daje pełny stos trafień pod spodem.
  // jsdom nie implementuje tego API — brak traktujemy jak brak trafień (token tła).
  const stack =
    typeof document.elementsFromPoint === "function" ? document.elementsFromPoint(x, y) : [];
  for (const node of stack) {
    // Kurtyna to pseudo-element body, a sam dokument nie ma własnego tła — oba pomijamy;
    // pomijamy też nasz canvas tranzycji (próbkujemy PRZED wpięciem, ale przy restorze
    // bfcache może wciąż siedzieć w DOM).
    if (node === document.documentElement || node === document.body) continue;
    if (node.matches("canvas.tr-canvas")) continue;
    const bg = parseRgb(window.getComputedStyle(node).backgroundColor);
    if (!bg) continue; // tło przezroczyste → następny element w stosie
    // Zielonkawe tło elementu → kratka w akcencie; w innym razie realne tło, a na końcu token.
    if (bg.g > bg.r && bg.g > bg.b) return { ...ACCENT_RGB };
    return bg;
  }
  return { ...CANVAS_RGB };
}

function colorOf(rgb: Rgb): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

// Lerp start → tło strony (koniec kroki = #000): kratka „zalewa się" tłem zamiast znikać skokiem.
function lerpToBase(rgb: Rgb, back: Rgb, t: number): Rgb {
  return {
    r: Math.round(rgb.r + (back.r - rgb.r) * t),
    g: Math.round(rgb.g + (back.g - rgb.g) * t),
    b: Math.round(rgb.b + (back.b - rgb.b) * t),
  };
}

// Odległość euklidesowa w jednostkach viewporta (0..~1,42) — przycięta do [0,1], bo dalsze
// kratki nie mogą opóźniać się ponad budżet tranzycji.
function normalizedDistance(x: number, y: number, point: Point, innerW: number, innerH: number): number {
  if (innerW <= 0 || innerH <= 0) return 0;
  const dx = (x - point.x * innerW) / innerW;
  const dy = (y - point.y * innerH) / innerH;
  return Math.min(1, Math.hypot(dx, dy));
}

function buildGrid(innerW: number, innerH: number, delayFor: (cell: { x: number; y: number }) => number): Cell[] {
  const cells: Cell[] = [];
  for (let y = 0; y < innerH; y += CELL) {
    for (let x = 0; x < innerW; x += CELL) {
      const cell = { x, y };
      cells.push({ ...cell, base: sampleBase(x + CELL / 2, y + CELL / 2), delay: delayFor(cell) });
    }
  }
  return cells;
}

type LogoTiles = { tiles: Tile[] };

// Mozaika loga z PNG: kratka bierze kolor piksela, przezroczyste piksele (alfa ≤ progu) są
// pomijane, więc logotyp zachowuje kształt zamiast prostokątnej planszy.
function buildLogoTiles(img: HTMLImageElement, cell: number, innerW: number, innerH: number): LogoTiles | null {
  const naturalW = img.naturalWidth;
  const naturalH = img.naturalHeight;
  if (!naturalW || !naturalH) return null;
  const off = document.createElement("canvas");
  off.width = naturalW;
  off.height = naturalH;
  const offCtx = off.getContext("2d");
  if (!offCtx) return null;
  offCtx.drawImage(img, 0, 0);
  let data: Uint8ClampedArray;
  try {
    data = offCtx.getImageData(0, 0, naturalW, naturalH).data;
  } catch {
    return null; // canvas zablokowany (np. CORS) — mozaika jest opcjonalna
  }

  const width = Math.min(innerW * 0.7, naturalW);
  const height = width * (naturalH / naturalW);
  const x0 = (innerW - width) / 2;
  const y0 = (innerH - height) / 2;
  const scale = width / naturalW;
  const cols = Math.max(1, Math.ceil(width / cell));
  const rows = Math.max(1, Math.ceil(height / cell));
  const tiles: Tile[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const px = (col + 0.5) * cell; // lokalnie względem lewej krawędzi mozaiki
      const py = (row + 0.5) * cell;
      const sx = Math.floor(px / scale); // mapa z powrotem na naturalne piksele PNG
      const sy = Math.floor(py / scale);
      if (sx < 0 || sy < 0 || sx >= naturalW || sy >= naturalH) continue;
      const i = (sy * naturalW + sx) * 4;
      if (data[i + 3] <= ALPHA_CUTOFF) continue;
      tiles.push({
        x: x0 + px,
        y: y0 + py,
        color: `rgb(${data[i]}, ${data[i + 1]}, ${data[i + 2]})`,
        delay: (col / cols) * LOGO_SPREAD_MS,
      });
    }
  }
  return { tiles };
}

export function PageTransition() {
  useEffect(() => {
    const root = document.documentElement;
    let navigating = false;
    let frame: number | null = null;
    let canvas: HTMLCanvasElement | null = null;

    const makeCanvas = (): CanvasRenderingContext2D | null => {
      const next = document.createElement("canvas");
      next.className = "tr-canvas";
      const innerW = window.innerWidth;
      const innerH = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      next.width = Math.round(innerW * dpr);
      next.height = Math.round(innerH * dpr);
      document.body.appendChild(next);
      canvas = next;
      const ctx = next.getContext("2d");
      if (!ctx) return null;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return ctx;
    };

    const drop = () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
        frame = null;
      }
      if (canvas) {
        canvas.remove();
        canvas = null;
      }
      root.classList.remove("tr-in");
    };

    const loadLogo = (onReady: (img: HTMLImageElement) => void) => {
      // Obraz jest w public/ — ładowanie startuje PRZED animacją, błąd tylko pomija mozaikę.
      const img = new window.Image();
      img.onload = () => onReady(img);
      img.onerror = () => undefined;
      img.src = LOGO_SRC;
    };

    // ---------- WEJŚCIE ----------
    if (root.classList.contains("tr-in")) {
      const point = readStoredPoint(); // klucz jest natychmiast kasowany
      if (reducedMotion()) {
        // Awaryjnie: zero canvasa, kurtyna CSS zdjęta.
        root.classList.remove("tr-in");
      } else {
        const innerW = window.innerWidth;
        const innerH = window.innerHeight;
        // Próbka tła PRZED wpięciem canvasa — elementy z `canvas.tr-canvas` są co prawda
        // pomijane w stosie, ale próbka przed wpięciem jest jednoznaczna.
        const cells = buildGrid(innerW, innerH, (cell) =>
          ENTER_BASE_DELAY_MS + normalizedDistance(cell.x + CELL / 2, cell.y + CELL / 2, point, innerW, innerH) * ENTER_EDGE_SPREAD_MS,
        );
        const ctx = makeCanvas();
        if (ctx) {
          let logo: LogoTiles | null = null;
          loadLogo((img) => {
            logo = buildLogoTiles(img, LOGO_ENTER_CELL, innerW, innerH);
          });

          const scatter = Math.max(innerW, innerH);
          const state = cells.map((cell) => {
            const angle = Math.random() * Math.PI * 2;
            const speed = 18 + Math.random() * 47;
            // Kierunek prędkości „od punktu" wejścia (brief §Wejście); gdy kratka leży dokładnie
            // w punkcie — fallback na kierunek rozrzutu.
            let dirX = cell.x + CELL / 2 - point.x * innerW;
            let dirY = cell.y + CELL / 2 - point.y * innerH;
            const len = Math.hypot(dirX, dirY);
            if (len > 0.001) {
              dirX /= len;
              dirY /= len;
            } else {
              dirX = Math.cos(angle);
              dirY = Math.sin(angle);
            }
            return {
              cell,
              offX: Math.cos(angle) * (0.3 + 0.6 * Math.random()) * scatter,
              offY: Math.sin(angle) * (0.3 + 0.6 * Math.random()) * scatter,
              rot: (Math.random() - 0.5) * Math.PI,
              scale: 0.6 + 0.7 * Math.random(),
              vx: dirX * speed,
              vy: dirY * speed,
            };
          });

          let start = 0;
          let last = 0;
          const step = (now: number) => {
            frame = null;
            const elapsed = now - start;
            const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
            last = now;
            if (elapsed >= ENTER_TOTAL_MS) {
              // Kurtyna zdjęta dopiero po ostatniej klatce — bez błysku.
              drop();
              return;
            }
            ctx.clearRect(0, 0, innerW, innerH);
            for (const s of state) {
              const p = (elapsed - s.cell.delay) / ENTER_DURATION_MS;
              if (p <= 0 || p >= 1) continue; // poza [0,1] alfa = 0 → kratka niewidoczna
              s.vx *= DRAG;
              s.vy = s.vy * DRAG + GRAVITY * dt;
              s.offX += s.vx * dt;
              s.offY += s.vy * dt;
              const k = 1 - p;
              ctx.globalAlpha = p;
              ctx.fillStyle = colorOf(s.cell.base);
              ctx.save();
              ctx.translate(s.cell.x + s.offX * k, s.cell.y + s.offY * k);
              ctx.rotate(s.rot * k);
              ctx.scale(s.scale, s.scale);
              ctx.fillRect(-CELL / 2, -CELL / 2, CELL, CELL);
              ctx.restore();
            }
            if (logo) {
              for (const tile of logo.tiles) {
                const p = (elapsed - (ENTER_BASE_DELAY_MS + tile.delay)) / ENTER_DURATION_MS;
                if (p <= 0 || p >= 1) continue;
                ctx.globalAlpha = p;
                ctx.fillStyle = tile.color;
                ctx.fillRect(tile.x, tile.y, LOGO_ENTER_CELL, LOGO_ENTER_CELL);
              }
            }
            ctx.globalAlpha = 1;
            frame = window.requestAnimationFrame(step);
          };
          start = performance.now();
          last = start;
          frame = window.requestAnimationFrame(step);
        } else {
          // Brak kontekstu 2d (jsdom / brak 2d): kurtynę zdejmujemy od razu, strona jest gotowa.
          drop();
        }
      }
    }

    // ---------- bfcache ----------
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted !== true) return;
      // Strona przywrócona z bfcache: żadnej animacji, sprzątamy martwy klucz i warstwy.
      clearStoredPoint();
      // Pętla wyjścia nie ma warunku końcowego (dokument miał odejść) — po restorze rAF
      // wznawia klatki w nieskończoność, więc ramkę trzeba anulować tak jak w drop().
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
        frame = null;
      }
      document.querySelectorAll("canvas.tr-canvas").forEach((el) => el.remove());
      canvas = null;
      root.classList.remove("tr-in");
      // Flaga „tranzycja w toku" z resetowanej strony nie może zostać — przywrócona strona
      // ma się zachowywać jak świeżo załadowana, z tranzycją uzbrojoną ponownie.
      navigating = false;
    };
    window.addEventListener("pageshow", onPageShow);

    // ---------- WYJŚCIE ----------
    const onClick = (event: MouseEvent) => {
      if (navigating) return;
      if (reducedMotion()) return; // awaryjnie: nieczyszczone, natywna nawigacja
      if (event.button !== 0) return; // middle/extra button — otwarcia w tle
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a") : null;
      if (!anchor) return;
      const target = anchor.getAttribute("target");
      if (target !== null && target !== "_self") return;
      const href = qualifyTransitionHref(
        anchor.getAttribute("href"),
        window.location.origin,
        window.location.pathname,
      );
      if (!href) return;
      const point = resolveClickPoint(
        event.clientX,
        event.clientY,
        anchor,
        window.innerWidth,
        window.innerHeight,
      );
      try {
        sessionStorage.setItem(TR_KEY, `${point.x.toFixed(2)},${point.y.toFixed(2)}`);
      } catch {
        /* bez kurtyny na nowym dokumencie — tranzycja i tak dokończy wyjście */
      }
      event.preventDefault();
      navigating = true;

      const innerW = window.innerWidth;
      const innerH = window.innerHeight;
      const cells = buildGrid(innerW, innerH, (cell) =>
        normalizedDistance(cell.x + CELL / 2, cell.y + CELL / 2, point, innerW, innerH) * EXIT_SPREAD_MS,
      );
      const ctx = makeCanvas();
      if (!ctx) {
        // Brak 2d: wychodzimy bez animacji, ale z kluczem, żeby wejście też nie startowało.
        clearStoredPoint();
        window.location.assign(href);
        return;
      }

      let logo: LogoTiles | null = null;
      loadLogo((img) => {
        logo = buildLogoTiles(img, LOGO_EXIT_CELL, innerW, innerH);
      });

      let start = 0;
      const step = (now: number) => {
        frame = null;
        const elapsed = now - start;
        ctx.clearRect(0, 0, innerW, innerH);
        ctx.globalAlpha = 1;
        for (const cell of cells) {
          const p = (elapsed - cell.delay) / EXIT_RAMP_MS;
          const t = p < 0 ? 0 : p > 1 ? 1 : p;
          ctx.fillStyle = colorOf(lerpToBase(cell.base, CANVAS_RGB, t));
          ctx.fillRect(cell.x, cell.y, CELL, CELL);
        }
        if (logo) {
          for (const tile of logo.tiles) {
            const p = (elapsed - (LOGO_SPREAD_MS + tile.delay)) / LOGO_RAMP_MS;
            const a = p < 0 ? 0 : p > 1 ? 1 : p;
            if (a === 0) continue;
            ctx.globalAlpha = a;
            ctx.fillStyle = tile.color;
            ctx.fillRect(tile.x, tile.y, LOGO_EXIT_CELL, LOGO_EXIT_CELL);
          }
        }
        frame = window.requestAnimationFrame(step);
      };
      start = performance.now();
      frame = window.requestAnimationFrame(step);
      window.setTimeout(() => window.location.assign(href), NAVIGATE_AFTER_MS);
      // Canvas wychodzącej strony zostaje w DOM — dokument i tak odchodzi.
    };
    document.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("click", onClick);
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
        frame = null;
      }
    };
  }, []);

  return null;
}

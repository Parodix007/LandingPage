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
// Wąskie viewporth (telefon) dostają mniejszą kratkę — 30-px okna na telefonie są za duże.
const CELL_NARROW = 22;
const NARROW_VIEWPORT_PX = 900;
const EXIT_SPREAD_MS = 150;
const EXIT_RAMP_MS = 300;
// Rampa wejścia ostrego bitmapy loga (brief #11): logo startuje po bazowym opóźnieniu tła
// plus rozrzucie LOGO_SPREAD_MS i wjeżdża alfą 0→1 przez LOGO_RAMP_MS.
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
type Cell = { x: number; y: number; size: number; base: Rgb; delay: number };
type Rgb = { r: number; g: number; b: number };

// Rozmiar kratki zależy od szerokości viewporta w starcie tranzycji.
export function resolveCellSize(innerW: number): number {
  return innerW >= NARROW_VIEWPORT_PX ? CELL : CELL_NARROW;
}

// Rasteryzacja canvasa 1:1 z pikselami fizycznymi ekranu (prawdziwe dpr, bez klamry): bitmapa
// 2x na ekranie 3x skalowana przez kompozytor 1.5x = dwuliniowe rozmycie CAŁEJ mozaiki (objaw
// właściciela, telefon DPR3). Bitmapa tranzycji nigdy nie przekracza bufora frames urządzenia,
// który GPU i tak kompozytuje dla samej strony, a tranzycja jest chwilowa (470/830 ms).
export function resolveRasterRatio(rawDpr: number | undefined): number {
  return rawDpr || 1;
}

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

// Pozycje kratki pokrywające viewport od (0,0) krokiem `size` — ostatnia kolumna/wiersz wychodzą
// poza krawędź (canvas przycina), dzięki temu bitmapa jest zamalowana bez luzu na prawej/dolnej krawędzi.
// `growthAreas` z pustą listą zwraca pełną siatkę, więc `buildGrid` buduje się na tym samym kodzie.
function growthAreas(cells: Cell[], innerW: number, innerH: number, size: number): Point[] {
  // Przy zmianie viewporta (pasek adresu przeglądarki mobilnej, obrót urządzenia) w trakcie
  // animacji dokładamy kratki TYLKO na nowo odkrytym pasie L — istniejące zachowują fizykę,
  // opóźnienia i kolory, więc pomalowane już klatki nie migają przy przebudowie.
  let coverW = 0;
  let coverH = 0;
  for (const cell of cells) {
    coverW = Math.max(coverW, cell.x + cell.size);
    coverH = Math.max(coverH, cell.y + cell.size);
  }
  const grown: Point[] = [];
  for (let y = coverH; y < innerH; y += size) {
    for (let x = 0; x < innerW; x += size) grown.push({ x, y });
  }
  for (let y = 0; y < coverH; y += size) {
    for (let x = coverW; x < innerW; x += size) grown.push({ x, y });
  }
  return grown;
}

function buildGrid(innerW: number, innerH: number, size: number, delayFor: (cell: Point) => number): Cell[] {
  return growthAreas([], innerW, innerH, size).map((cell) => ({
    ...cell,
    size,
    base: sampleBase(cell.x + size / 2, cell.y + size / 2),
    delay: delayFor(cell),
  }));
}

// Stan fizyki kratki wejścia: prędkość „od punktu" wejścia (brief §Wejście); gdy kratka leży
// dokładnie w punkcie — fallback na kierunek rozrzutu.
function makeEnterState(cell: Cell, point: Point, innerW: number, innerH: number, scatter: number) {
  const angle = Math.random() * Math.PI * 2;
  const speed = 18 + Math.random() * 47;
  let dirX = cell.x + cell.size / 2 - point.x * innerW;
  let dirY = cell.y + cell.size / 2 - point.y * innerH;
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
}

// Ciasny prostokąt tuszu: piksele z alfą > ALPHA_CUTOFF. PNG loga ma ogromny przezroczysty
// margines (canvas 1600×400, tusz ~948×162) — cała geometria bitmapy loga liczy się od tego bboxa.
export function logoInkBox(
  data: Uint8ClampedArray,
  naturalW: number,
  naturalH: number,
): { x: number; y: number; w: number; h: number } | null {
  let minX = naturalW;
  let minY = naturalH;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < naturalH; y += 1) {
    for (let x = 0; x < naturalW; x += 1) {
      if (data[(y * naturalW + x) * 4 + 3] > ALPHA_CUTOFF) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX || maxY < minY) return null; // brak tuszu — mozaika jest opcjonalna
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

// Metryka ostrego bitmapu loga (brief #11): render szerokości min(0.7 viewportu, naturalny tusz)
// bez skalowania w górę, wysokość zachowuje proporcje tuszu. To JEDYNA geometria napisu — logo
// nie jest już kwantyzowane na płytki, więc nie ma cell/cols/rows.
export function logoGeometry(
  innerW: number,
  inkW: number,
  inkH: number,
): { renderW: number; renderH: number } {
  const renderW = Math.min(innerW * 0.7, inkW);
  const renderH = renderW * (inkH / inkW);
  return { renderW, renderH };
}

// Wyrównanie do siatki pikseli urządzenia: pozycja pada na wielokrotność 1/dpr, inaczej krawędzie
// rysunku antyaliasują (ułamkowy piksel urządzenia przy krawędzi bitmapy loga = widoczna rampa AA).
export function snapToPixelGrid(value: number, dpr: number): number {
  return Math.round(value * dpr) / dpr;
}

type LogoBitmap = { source: HTMLCanvasElement; x: number; y: number; w: number; h: number };

// Przygotowanie ostrej bitmapy loga (brief #11): z PNG wycinamy SAM prostokąt tuszu (bbox alf >
// ALPHA_CUTOFF — przezroczysty margines pliku nigdy nie trafia na ekran), a potem rysujemy go
// JEDNYM drawImage z wygładzaniem na metryczne wymiary (logoGeometry), wyśrodkowany w viewporcie.
// Pozycja snapped do siatki pikseli urządzenia (canvas 1:1 z pikselami fizycznymi,
// resolveRasterRatio). Brak tuszu lub zablokowany canvas (CORS) → logo opcjonalne, tło działa.
function prepareLogo(img: HTMLImageElement, innerW: number, innerH: number): LogoBitmap | null {
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
    return null; // canvas zablokowany (np. CORS) — logo jest opcjonalne
  }

  const ink = logoInkBox(data, naturalW, naturalH);
  if (!ink) return null; // plik bez tuszu (np. uszkodzony) — logo jest opcjonalne
  const cropped = document.createElement("canvas");
  cropped.width = ink.w;
  cropped.height = ink.h;
  const cropCtx = cropped.getContext("2d");
  if (!cropCtx) return null;
  cropCtx.drawImage(off, ink.x, ink.y, ink.w, ink.h, 0, 0, ink.w, ink.h);

  const geo = logoGeometry(innerW, ink.w, ink.h);
  // Rastrowanie canvasa dzieje się przy prawdziwym dpr (jak makeCanvas) — siatka snappingu to
  // siatka rasteryzacji, więc pozycja bitmapy wyrównana jest do pikseli urządzenia.
  const rdpr = resolveRasterRatio(window.devicePixelRatio);
  return {
    source: cropped,
    x: snapToPixelGrid((innerW - geo.renderW) / 2, rdpr),
    y: snapToPixelGrid((innerH - geo.renderH) / 2, rdpr),
    w: geo.renderW,
    h: geo.renderH,
  };
}

// Rysowanie ostrego loga: pełna rozdzielczość wyciętego tuszu skalowana wygładzaniem (high) —
// zero piklowania i zero szwów siatki. Zawsze wywoływane PO kafelkach tła (zawsze czytelne).
function drawLogo(ctx: CanvasRenderingContext2D, logo: LogoBitmap, alpha: number): void {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.globalAlpha = alpha;
  ctx.drawImage(logo.source, logo.x, logo.y, logo.w, logo.h);
}

export function PageTransition() {
  useEffect(() => {
    const root = document.documentElement;
    let navigating = false;
    let frame: number | null = null;
    let canvas: HTMLCanvasElement | null = null;

    // Rebuild viewporta (fix: pasek adresu mobilnej przeglądarki / obrót urządzenia w trakcie
    // animacji zostawiał niepomalowany pas ekranu): bitmapa canvasa i siatka liczone są w starcie,
    // więc podczas aktywnej animacji muszą nadążać za oknem. Nasłuch istnieje TYLKO w trakcie
    // trwania tranzycji — poza nią nic nie nasłuchuje.
    let viewportListener: (() => void) | null = null;
    function armRebuild(rebuild: () => void) {
      disarmRebuild();
      viewportListener = rebuild;
      window.addEventListener("resize", viewportListener);
      window.addEventListener("orientationchange", viewportListener);
    }
    function disarmRebuild() {
      if (!viewportListener) return;
      window.removeEventListener("resize", viewportListener);
      window.removeEventListener("orientationchange", viewportListener);
      viewportListener = null;
    }

    const fitCanvas = (ctx: CanvasRenderingContext2D) => {
      // Ten sam schemat skalowania co w makeCanvas: bitmapa w pikselach urządzenia, transform
      // mapuje na piksele CSS. Ustawienie width/height czyści bitmapę — następna klatka maluje ją w całości.
      if (!canvas) return;
      const dpr = resolveRasterRatio(window.devicePixelRatio);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const makeCanvas = (): CanvasRenderingContext2D | null => {
      const next = document.createElement("canvas");
      next.className = "tr-canvas";
      const innerW = window.innerWidth;
      const innerH = window.innerHeight;
      const dpr = resolveRasterRatio(window.devicePixelRatio);
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
      disarmRebuild();
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
        let innerW = window.innerWidth;
        let innerH = window.innerHeight;
        let cellSize = resolveCellSize(innerW);
        // Próbka tła PRZED wpięciem canvasa — elementy z `canvas.tr-canvas` są co prawda
        // pomijane w stosie, ale próbka przed wpięciem jest jednoznaczna.
        const cells = buildGrid(innerW, innerH, cellSize, (cell) =>
          ENTER_BASE_DELAY_MS + normalizedDistance(cell.x + cellSize / 2, cell.y + cellSize / 2, point, innerW, innerH) * ENTER_EDGE_SPREAD_MS,
        );
        const ctx = makeCanvas();
        if (ctx) {
          let logo: LogoBitmap | null = null;
          loadLogo((img) => {
            logo = prepareLogo(img, innerW, innerH);
          });

          let scatter = Math.max(innerW, innerH);
          const state = cells.map((cell) => makeEnterState(cell, point, innerW, innerH, scatter));

          const rebuild = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            if (w === innerW && h === innerH) return;
            innerW = w;
            innerH = h;
            cellSize = resolveCellSize(w);
            scatter = Math.max(innerW, innerH);
            fitCanvas(ctx);
            for (const pos of growthAreas(cells, innerW, innerH, cellSize)) {
              const cell: Cell = {
                x: pos.x,
                y: pos.y,
                size: cellSize,
                base: sampleBase(pos.x + cellSize / 2, pos.y + cellSize / 2),
                delay:
                  ENTER_BASE_DELAY_MS +
                  normalizedDistance(pos.x + cellSize / 2, pos.y + cellSize / 2, point, innerW, innerH) *
                    ENTER_EDGE_SPREAD_MS,
              };
              cells.push(cell);
              state.push(makeEnterState(cell, point, innerW, innerH, scatter));
            }
          };
          armRebuild(rebuild);

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
              ctx.fillRect(-s.cell.size / 2, -s.cell.size / 2, s.cell.size, s.cell.size);
              ctx.restore();
            }
            if (logo) {
              // Ostrzejsza warstwa (brief #11): JEDEN ostry bitmap po kaflach tła, rampa alfy
              // 0→1 przez LOGO_RAMP_MS po bazowym opóźnieniu wejścia plus rozrzucie loga.
              const p = (elapsed - (ENTER_BASE_DELAY_MS + LOGO_SPREAD_MS)) / LOGO_RAMP_MS;
              const a = p < 0 ? 0 : p > 1 ? 1 : p;
              if (a > 0) drawLogo(ctx, logo, a);
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
      disarmRebuild();
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

      let innerW = window.innerWidth;
      let innerH = window.innerHeight;
      let cellSize = resolveCellSize(innerW);
      const cells = buildGrid(innerW, innerH, cellSize, (cell) =>
        normalizedDistance(cell.x + cellSize / 2, cell.y + cellSize / 2, point, innerW, innerH) * EXIT_SPREAD_MS,
      );
      const ctx = makeCanvas();
      if (!ctx) {
        // Brak 2d: wychodzimy bez animacji, ale z kluczem, żeby wejście też nie startowało.
        clearStoredPoint();
        window.location.assign(href);
        return;
      }

      let logo: LogoBitmap | null = null;
      loadLogo((img) => {
        logo = prepareLogo(img, innerW, innerH);
      });

      const rebuild = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        if (w === innerW && h === innerH) return;
        innerW = w;
        innerH = h;
        cellSize = resolveCellSize(w);
        fitCanvas(ctx);
        for (const pos of growthAreas(cells, innerW, innerH, cellSize)) {
          cells.push({
            x: pos.x,
            y: pos.y,
            size: cellSize,
            base: sampleBase(pos.x + cellSize / 2, pos.y + cellSize / 2),
            delay:
              normalizedDistance(pos.x + cellSize / 2, pos.y + cellSize / 2, point, innerW, innerH) *
              EXIT_SPREAD_MS,
          });
        }
      };
      armRebuild(rebuild);

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
          ctx.fillRect(cell.x, cell.y, cell.size, cell.size);
        }
        if (logo) {
          // Napis jest rysowany PO rozpadającym się tle z pełną alfą — w każdej klatce czytelny
          // (brief #11: ostry bitmap zamiast siatki płytek).
          drawLogo(ctx, logo, 1);
        }
        frame = window.requestAnimationFrame(step);
      };
      start = performance.now();
      frame = window.requestAnimationFrame(step);
      window.setTimeout(() => {
        // Nawigacja odsłania nowy dokument — nasłuch viewportu nie może przeżyć tranzycji.
        disarmRebuild();
        window.location.assign(href);
      }, NAVIGATE_AFTER_MS);
      // Canvas wychodzącej strony zostaje w DOM — dokument i tak odchodzi.
    };
    document.addEventListener("click", onClick);

    return () => {
      disarmRebuild();
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

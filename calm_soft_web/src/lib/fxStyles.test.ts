import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Kontrakt warstw FX w globals.css (spec 2026-11-06 §4.2–§4.4, §5):
// ziarno, poświata pointer-glow, tilt, paralaksa i sticky-stos #process.
// Bramki: efekty wskaźnikowe tylko dla (prefers-reduced-motion: no-preference)
// i (pointer: fine); killswitch reduced-motion dezaktywuje także sticky.
const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

const FX_GATE = "@media (prefers-reduced-motion: no-preference) and (pointer: fine)";

describe("globals.css — warstwy FX i sticky stack", () => {
  it("deklaruje zmienne pozycji wskaźnika na :root", () => {
    for (const prop of ["--mx", "--my", "--px", "--py"]) {
      expect(css).toContain(`${prop}:`);
    }
  });

  it("nakłada statyczne ziarno przez body::after bez webfontu i bez obrazów sieciowych", () => {
    expect(css).toContain("body::after");
    expect(css).toContain("feTurbulence");
    expect(css).toContain("data:image/svg+xml");
    // Ziarno nie może przechwytywać zdarzeń wskaźnika ani animować się.
    const grainBlock = css.slice(css.indexOf("body::after"));
    expect(grainBlock).toContain("pointer-events: none");
  });

  it("wszystkie efekty wskaźnikowe mieszą się pod wspólną bramą FX", () => {
    expect(css).toContain(FX_GATE);
    const gateCount = css.split(FX_GATE).length - 1;
    // poświata + tilt + paralaksa + pętla cząstek (canvas animowany) — minimum 3 bloki
    expect(gateCount).toBeGreaterThanOrEqual(3);
  });

  it("pointer-glow pozycjonuje .card-glow na wskaźniku tylko po najechaniu na [data-glow]", () => {
    expect(css).toMatch(/\[data-glow\]:hover\s+\.card-glow/);
    const glowRule = css.slice(css.indexOf("[data-glow]:hover .card-glow"));
    expect(glowRule.slice(0, 400)).toContain("left: var(--mx");
    expect(glowRule.slice(0, 400)).toContain("top: var(--my");
    expect(glowRule.slice(0, 400)).toContain("translate(-50%, -50%)");
  });

  it("tilt [data-tilt] nie przekracza 4 stopni (użyj 3°)", () => {
    const tiltRule = css.slice(css.indexOf("[data-tilt]:hover"));
    const block = tiltRule.slice(0, 400);
    expect(block).toContain("perspective");
    expect(block).toMatch(/rotateX\(calc\(var\(--py/);
    expect(block).toMatch(/rotateY\(calc\(var\(--px/);
    const degrees = [...block.matchAll(/(\d+(?:\.\d+)?)deg/g)].map((m) =>
      Number(m[1]),
    );
    expect(degrees.length).toBeGreaterThan(0);
    for (const deg of degrees) {
      expect(deg).toBeLessThanOrEqual(4);
    }
  });

  it("paralaksa warstwy tła hero [data-parallax] zużywa wyłącznie translate", () => {
    const rule = css.slice(css.indexOf("[data-parallax]"));
    const block = rule.slice(0, 300);
    expect(block).toContain("transform: translate");
    expect(block).toContain("var(--px");
    expect(block).toContain("var(--py");
  });

  it("sticky stack #process: pozycja sticky z kaskadowymi offsetami top", () => {
    const stack = css.slice(css.indexOf(".process-stack"));
    expect(stack).toContain("position: sticky");
    // brief #10B: selektor uogólniony — kafle podstron noszą .stack-item
    expect(stack).toMatch(/\.stack-item:nth-child\(1\)\s*\{\s*top:/);
    expect(stack).toMatch(/:nth-child\(5\)/);
    // brief #10B: cap dla list dłuższych niż 5 kafle
    expect(stack).toMatch(/\.stack-item:nth-child\(n\+6\)\s*\{\s*top:/);
  });

  it("killswitch reduced-motion dezaktywuje sticky i efekt ziarna", () => {
    const killIndex = css.lastIndexOf(
      "@media (prefers-reduced-motion: reduce)",
    );
    expect(killIndex).toBeGreaterThan(-1);
    const killSwitch = css.slice(killIndex);
    // brief #10B + #11-fix2: nadpisanie musi mieć swoistość (0,2,0), więc selektor to
    // `.stack-item:nth-child(n)` — przy (0,1,0) przegrywałby z offsetami 629–635
    const stackOverride = killSwitch.match(
      /\.stack-item:nth-child\(n\)\s*\{([^}]*)\}/,
    )?.[1] as string;
    // brak takiego nadpisania = czerwono (regex nie licuje się z nth-child(n+6))
    expect(stackOverride).toBeDefined();
    // kotwica absolutnych dekoracji kafli (brief #11); `static` cofnąłby ją
    expect(stackOverride).toContain("position: relative");
    // neutralizacja offsetów 84–148px z 629–635 (bez niej kafle zjeżdżają pod reduce)
    expect(stackOverride).toContain("top: auto");
    // w bloku nadpisania nie ma innego `top:` niż neutralizujące `auto`
    const tops = stackOverride.match(/top:\s*[^;]+/g) ?? [];
    expect(tops).toEqual(["top: auto"]);
  });

  it("html przycina poziome przepełnienie przez overflow-x: clip (nie hidden)", () => {
    const htmlRule = css.slice(css.indexOf("html {"));
    const block = htmlRule.slice(0, 400);
    expect(block).toContain("overflow-x: clip");
    // hidden utworzyłby scroll-container i złamał sticky stosu #process i pływającego CTA
    expect(block).not.toContain("overflow-x: hidden");
  });

  it("baza [data-tilt] pod bramą FX daje miękki powrót tiltu (transition transform ≥500ms)", () => {
    // reguła musi leżeć wewnątrz pierwszego bloku pod bramą pointer-FX — wyniesienie jej
    // poza bramę (lub usunięcie) daje czerwony sygnał
    const blocks = css.split(FX_GATE).slice(1);
    const tiltBase = blocks.find((b) => /^\s*\{\s*\[data-tilt\]\s*\{/.test(b));
    expect(tiltBase).toBeDefined();
    const baseBlock = (tiltBase as string).match(
      /\[data-tilt\]\s*\{[^}]*\}/,
    )?.[0] as string;
    expect(baseBlock).toContain("transition:");
    expect(baseBlock).toContain("transform");
    const ms = [...baseBlock.matchAll(/(\d+(?:\.\d+)?)ms/g)].map((m) =>
      Number(m[1]),
    );
    expect(ms.length).toBeGreaterThan(0);
    expect(Math.max(...ms)).toBeGreaterThanOrEqual(500);
  });
});

// Tranzycja strony (brief #9): kurtyna wejściowa i canvas zawsze nad nawigacją; killswitch
// reduce chowa obie warstwy (reguła musi leżeć w PIERWSZYM bloku reduce w pliku — regex-pin
// niżej czyta `css.match`, czyli pierwsze dopasowanie).
describe("tranzycja strony (brief #9)", () => {
  it("kurtyna wejściowa jest przymocowana nad nawigacją", () => {
    expect(css).toMatch(/html\.tr-in body::before\s*{[^}]*position: fixed/);
    expect(css).toMatch(/html\.tr-in body::before\s*{[^}]*z-index: 100/);
  });
  it("canvas tranzycji jest nad kurtyną", () => {
    expect(css).toMatch(/\.tr-canvas\s*{[^}]*position: fixed/);
    expect(css).toMatch(/\.tr-canvas\s*{[^}]*z-index: 101/);
  });
  it("canvas tranzycji ma box rozciągnięty na viewport (fix DPR: canvas replaced nie jest rozciągany przez inset:0)", () => {
    expect(css).toMatch(/\.tr-canvas\s*{[^}]*width: 100%/);
    expect(css).toMatch(/\.tr-canvas\s*{[^}]*height: 100%/);
  });
  it("killswitch reduce chowa kurtynę i canvas", () => {
    const block = css.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/);
    expect(block?.[1]).toContain("html.tr-in body::before");
    expect(block?.[1]).toContain(".tr-canvas");
  });
});

import type { ReactElement } from "react";

import { RichText } from "@/components/ui/RichText";
import type { AboutValue, AboutValueIcon } from "@/content/types";

// Manifest wartości /o-mnie/ (spec 2026-11-07 decyzja 6, brief #15; makieta kontraktowa
// wartosci-manifest-glify-v3, Rzemiosło = wariant A „przekrój warstw"). Server component —
// układ edytorskiego manifestu: pełnoszerokościowe rzędy (idx 01–04 + h3 + akapit przez
// RichText, copy wyłącznie z propsów z site.ts) z dekoracyjnym glifem pod tekstem.
// Pusta tablica = brak renderu (wzorzec featuredCaseSlugs). Rzędy NIEklikalne: zero
// zagnieżdżonych interakcji; glify aria-hidden — znaczenie niesie h3/akapit. Fokus-blur
// rzędów, kolory glifów i keyframes (nazwy 1:1 z makiety; kursor i `_` wordmarku używają
// ISTNIEJĄCEGO keyframes `blink`) — blok brief #15 w globals.css. Od briefu #19 ogólny
// fokus-blur rzędów daje wzorzec .focus-dim (klasa na `ul`), a blok brief #15 trzyma tylko
// nadpisania swoiste (opacity .32, przesunięcie 6px, kolory, glify, keyframes).

// Pseudokod w glifach to dekoracja (rodzic aria-hidden), NIE copy marketingowe — dlatego
// stałe są w komponencie, a nie w site.ts (AGENTS.md dotyczy copy). Linie logów powtarzają
// się 2×: strumień zapętla translateY(-48px) = 3 linie × 16px line-height, drugi komplet
// musi być lustrzany (pętla bezszwowa).
const TERM_PROMPT = "$ npm test";
const TERM_RESULT = "✓ all passed";
const LOG_LINES = ["backup ok", "deploy przeszedł", "system stabilny"];
// Rzemiosło (wariant A): etykiety warstw od góry do dołu + ich klasy animacji (dim1–dim3, deep).
const LAYER_CLASSES = ["l-a", "l-b", "l-c", "l-d"] as const;
const LAYER_LABELS = ["UI", "API", "domena", "dane"];
// Partnerstwo: podpis grafu git (dekoracyjna etykieta schematu, nie copy).
const GIT_CAPTION = "Twój proces";

// Mapa klucz→JSX glifu (brief #15): lokalna w komponencie — zastępuje usuniętą mapę
// ABOUT_VALUE_ICON_COMPONENTS z icons.tsx. Record po zunionizowanych ABOUT_VALUE_ICONS
// z content/types, więc brak pokrycia któregokolwiek klucza = błąd typu (kompilator pilnuje 1:1).
const VALUE_GLYPHS: Record<AboutValueIcon, ReactElement> = {
  // Spokój — strumień INFO-logów (spokojna, powtarzalna pętla 12 s).
  calm: (
    <div className="log">
      <div className="stream">
        {[...LOG_LINES, ...LOG_LINES].map((line, index) => (
          <div key={index} className="ln">
            <b>INFO</b> {line}
          </div>
        ))}
      </div>
    </div>
  ),
  // Jakość — terminal: prompt → wynik → migający kursor (cykl 7 s, seq1/seq2/seq3).
  quality: (
    <div className="term">
      <span className="l l1">{TERM_PROMPT}</span>
      <span className="l l2">{TERM_RESULT}</span>
      <span className="l l3">
        $ <i>▮</i>
      </span>
    </div>
  ),
  // Rzemiosło A — przekrój warstw: blask schodzi UI→API→domena→dane, najgłębsza pulsuje.
  craft: (
    <div className="layers">
      {LAYER_CLASSES.map((cls, index) => (
        <div key={cls} className={`lb ${cls}`}>
          {LAYER_LABELS[index]}
        </div>
      ))}
    </div>
  ),
  // Partnerstwo — graf git: linia główna + branch, commity zapalają się seq (opóźnienia w CSS),
  // puls na mergu, podpis i wordmark `calm_soft` (fill wordmarku near-white 1:1 z makietą;
  // `_` dostaje accent + blink z CSS, font mono z globals — poza tym geometria 1:1).
  partnership: (
    <svg viewBox="0 0 200 56" className="gitg">
      <path d="M6 18 H140" stroke="currentColor" strokeWidth="1.4" opacity=".55" />
      <path d="M26 42 C52 42 58 18 82 18" stroke="currentColor" strokeWidth="1.4" opacity=".55" fill="none" />
      <circle className="d d1" cx="14" cy="18" r="3" fill="currentColor" />
      <circle className="d d2" cx="44" cy="18" r="3" fill="currentColor" />
      <circle className="d d3" cx="26" cy="42" r="3" fill="currentColor" />
      <circle className="d d4" cx="64" cy="18" r="3" fill="currentColor" />
      <circle className="d d5" cx="82" cy="18" r="3.8" fill="currentColor" />
      <circle className="pulse" cx="82" cy="18" r="7" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <text x="106" y="10" fontSize="9" fill="currentColor" opacity=".85">
        {GIT_CAPTION}
      </text>
      <text className="wm" x="42" y="52" fontSize="11" fontWeight="600" fill="#eef3f0">
        calm<tspan className="us">_</tspan>soft
      </text>
    </svg>
  ),
};

export function ValuesGrid({ values }: { values: AboutValue[] }) {
  if (values.length === 0) return null;

  return (
    <ul role="list" className="values-manifest focus-dim m-0 mt-16 list-none p-0">
      {values.map((value, index) => (
        <li
          key={index}
          className="grid grid-cols-[44px_1fr] gap-x-[18px] border-t border-border-08 py-7 last:border-b"
        >
          {/* Numeracja z indeksu rzędu (nie z danych) — dekoracyjna, znaczenie niesie h3. */}
          <span aria-hidden="true" className="pt-[8px] font-mono text-[12px] text-ink-50">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <h3 className="text-[clamp(28px,3.5vw,34px)] font-semibold leading-none tracking-[-.01em] text-ink">
              {value.title}
            </h3>
            <p className="mt-[6px] max-w-[640px] text-[13.5px] leading-[1.65] text-ink-70">
              <RichText>{value.text}</RichText>
            </p>
            <div aria-hidden="true" className={`value-glyph value-glyph--${value.icon} mt-[14px]`}>
              {VALUE_GLYPHS[value.icon]}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

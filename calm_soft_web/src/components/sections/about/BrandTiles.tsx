import type { BrandTilesGroup } from "@/content/types";

// Kafle marek /o-mnie/ (brief #13, spec 2026-11-07; makieta kafle-final — kontrakt 1:1).
// Server component — dane wyłącznie z site.about (BrandTilesGroup). Pusty items = brak bloku
// (wzorzec featuredCaseSlugs). Nazwy pracodawców/instytucji WYŁĄCZNIE tekstowo (uppercase
// CSS-em) — bez graficznych logo pracodawców, decyzja prawna: znaki towarowe; jedyna geometria
// w barwach to okienko Microsoft (użycie opisowe nominatywne). Piguły wariantu "short" są w
// About.tsx (brief #12) — tutaj pełne kafle z washem i hover-glow.
// Glow: .card-glow niewidoczny w spoczynku, wjaśnia się tylko na hover (reguła .brand-tile w
// globals.css, brief #13); PointerFx pisze --mx/--my na [data-glow], więc poświata podąża za
// kursorem wyłącznie przy wskaźniku precyzyjnym i dozwolonym ruchu (brama wskaźnika).

// Kolory okienka Microsoft 2×2 (makieta kafle-final). Znak towarowy Microsoft — użycie opisowe
// nominatywne (nazwa + geometria w barwach, bez logotypu jako znaku towarowego pracodawcy).
const MS_MARK_COLORS = ["#f25022", "#7fba00", "#00a4ef", "#ffb900"] as const;

// group.columns → LITERALNE klasy Tailwinda (v4 skanuje źródło — klasy dynamiczne znikają).
// Sane mobile: wąskie kafle dwukolumnowe dopiero od 600px; docelowa liczba kolumn od 900px.
const GRID_BY_COLUMNS: Record<BrandTilesGroup["columns"], string> = {
  2: "grid-cols-1 min-[600px]:grid-cols-2",
  3: "grid-cols-1 min-[600px]:grid-cols-2 min-[900px]:grid-cols-3",
  4: "grid-cols-1 min-[600px]:grid-cols-2 min-[900px]:grid-cols-4",
};

export function BrandTiles({ group }: { group: BrandTilesGroup }) {
  if (group.items.length === 0) return null;

  return (
    <div className="mt-16">
      <p className="m-0 font-mono text-[11px] tracking-[.06em] text-ink-50">{group.label}</p>
      <ul
        role="list"
        className={`m-0 mt-2 grid list-none gap-4 p-0 ${GRID_BY_COLUMNS[group.columns]}`}
      >
        {group.items.map((tile) => (
          <li
            key={tile.name}
            data-glow
            className="brand-tile relative overflow-hidden rounded-[12px] border p-[14px]"
            style={{ borderColor: tile.border, background: tile.wash }}
          >
            {/* Dekoracyjna poświata (jeden kolor kafla, --glow-color z danych). Pozycja
                spoczynkowa poza kaflem — niewidoczna i tak do hovera (reguła .brand-tile
                .card-glow w globals.css); na hover pozycję przejmuje PointerFx (--mx/--my). */}
            <span
              aria-hidden="true"
              className="card-glow -left-[140px] -top-[140px] h-[280px] w-[280px]"
              style={{ ["--glow-color" as string]: tile.glow }}
            />
            {tile.mark === "microsoft" ? (
              // Okienko 2×2 wg makiety (.msq): right 14px, pionowy środek, 40×40, gap 4px.
              <span
                aria-hidden="true"
                className="ms-mark absolute right-[14px] top-1/2 grid h-[40px] w-[40px] -translate-y-1/2 grid-cols-2 grid-rows-2 gap-1"
              >
                {MS_MARK_COLORS.map((color) => (
                  <span key={color} className="rounded-[2px]" style={{ background: color }} />
                ))}
              </span>
            ) : null}
            {/* Nazwa w naturalnej formie (site.ts) — uppercase robi klasa CSS (brief #12). */}
            <span
              className="relative font-mono text-[14px] font-bold uppercase tracking-[.02em] text-ink"
              style={tile.titleColor ? { color: tile.titleColor } : undefined}
            >
              {tile.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

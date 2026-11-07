import { site } from "@/content/site";
import type { BrandTilesGroup } from "@/content/types";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RichText } from "@/components/ui/RichText";
import { HOVER_BORDER } from "@/components/ui/cardHover";
import { TechStack } from "@/components/ui/TechStack";
import { FactStrip } from "@/components/sections/about/FactStrip";
import { BrandTiles } from "@/components/sections/about/BrandTiles";
import { ValuesGrid } from "@/components/sections/about/ValuesGrid";

// Server component (SPEC §16 client/server boundary) — the section renders static content.
// Brief #12 (spec 2026-11-07): oba warianty renderują JEDEN tile — zdjęcie full-bleed w lewej
// komórce (img absolute inset-0, komórka zdjęcia bez paddingu), prawa komórka z paddingiem:
// tekst + (short) rzędy piguł marek + FactStrip na dole nad hairline. Mobile (<900px): zdjęcie
// nad treścią. Watermark usunięty z About (zaakceptowana makieta home-about-final-v2); ambient
// card-glow zostaje. CTA kafla About skasowana razem z polem site.about.cta. No 'use client'.
type AboutVariant = "short" | "long";

// Brief #17 (discoveries 2026-11-07): dwa warianty zdjęcia wymuszone pomiarami Lighthouse
// (TBT/dekod webp): oryginał 1100×1467 (104 KB) pod lazy na stronie głównej (short), mniejszy
// 1050×1400 (77 KB) pod preload+LCP na /o-mnie/ (long) — asymetria pomiarowa, nie estetyczna.
const PHOTO_BY_VARIANT: Record<AboutVariant, string> = {
  short: "/about-photo.webp",
  long: "/about-photo-wide.webp",
};

interface AboutProps {
  variant?: AboutVariant;
}

// Wspólny blok tekstu dla obu wariantów — brief #12: bez CTA (pole about.cta usunięte).
// Copy wyłącznie z site.about.
function renderAboutText(text: string | string[]) {
  return (
    <div className="relative">
      {Array.isArray(text)
        ? text.map((p, i) => (
            <p key={i} className="text-[16px] leading-[1.65] text-ink-70">
              <RichText>{p}</RichText>
            </p>
          ))
        : (
            <p className="text-[16px] leading-[1.65] text-ink-70">
              <RichText>{text}</RichText>
            </p>
          )}
    </div>
  );
}

// Rząd piguł marek (wariant "short", brief #12): nadpisek mono + lista statycznych nazw z
// site.about. Piguły NIE są interaktywne (li > span, zero linków/buttonów); kafle marek
// (wash/glow, wariant "long") renders sections/about/BrandTiles (brief #13). Pusta tablica =
// brak rzędu (wzorzec featuredCaseSlugs).
// Brief #20 (makieta about-chips-photo-v1): piguły → chipsy credential — zmienna --chip-glow z
// danych site.ts (item.glow, inline style); border, tint tła i poświata hover wylicza CSS w
// globals.css (.credential-chip). Brief #20d: sans-serif semibold bez leading-none — wierność
// `.after .chip`. Brief #20e: border z danych (item.chipBorder ?? item.border, inline) — formuła
// color-mix nie daje alfa >.28 premultiplikowanego glow, a makieta chce .5–.7. Semantyka
// li > span i brak interaktywności bez zmian.
function BrandPillRow({ group }: { group: BrandTilesGroup }) {
  if (group.items.length === 0) return null;
  return (
    <div className="mt-8">
      <p className="m-0 font-mono text-[12px] tracking-[.06em] text-ink-50">{group.label}</p>
      <ul role="list" className="m-0 mt-3 list-none flex flex-wrap gap-[10px] p-0">
        {group.items.map((item) => (
          <li key={item.name}>
            <span
              className="credential-chip w-fit inline-flex rounded-[var(--radius-pill)] border px-3.5 py-2 font-semibold text-[14px] text-ink-85"
              style={{ borderColor: item.chipBorder ?? item.border, ['--chip-glow' as string]: item.glow }}
            >
              {item.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function About({ variant = "short" }: AboutProps) {
  const copy = site.about;
  const text = variant === "short" ? copy.short : copy.long;

  // Brief #23: właściciel cofnął poszerzenie #18 (max-w-[1500px]); kafelek short = kolumna
  // 1200 px = geometria makiet about-chips-photo-v1 (frame 1200, grid 1fr 1fr), spójna z
  // resztą sekcji home i wariantem long; przy 1500 px zdjęcie skalowało się do szerokości
  // komórki (~22% zoom względem makiet).
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="mx-auto max-w-[1200px] px-6 py-[72px] min-[900px]:py-[110px]"
    >
      <SectionHeading id="about-heading" line1={copy.heading} line2="" />

      {/* Brief #12: wspólny tile dla obu wariantów (makiety home-about-final-v2 / omnie-klad-1280).
          Zdjęcie full-bleed w lewej komórce bez paddingu; padding wyłącznie w prawej komórce. */}
      <div className={`card-host relative mt-10 grid grid-cols-1 overflow-hidden rounded-[var(--radius-card)] border border-border-10 bg-surface min-[900px]:grid-cols-2 ${HOVER_BORDER}`}>
        {/* Decorative glow — purely presentational, hidden from AT (watermark usunięty, brief #12). */}
        <span
          aria-hidden="true"
          className="card-glow -right-40 -top-40 h-[460px] w-[460px] [--glow-color:color-mix(in_oklch,var(--color-accent)_16%,transparent)]"
        />
        {/* Photo — lewa komórka (DOM: pierwsza = nad treścią na mobile). min-h-[320px] dla
            stacka mobile; w siatce desktop komórka rozciąga się do wysokości wiersza, a img
            absolute inset-0 wypełnia ją w pełni (full-bleed, bez paddingu). */}
        <div className="relative min-h-[320px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PHOTO_BY_VARIANT[variant]}
            alt={copy.photoAlt}
            className="absolute inset-0 h-full w-full object-cover object-top"
            // Brief #6: w wariancie "long" (/o-mnie/) zdjęcie jest LCP above-the-fold —
            // eager (loading=undefined → atrybut znika) + fetchPriority="high" (React 19
            // camelCase → atrybut fetchpriority). W "short" (strona główna) pod foldem — lazy.
            loading={variant === "long" ? undefined : "lazy"}
            fetchPriority={variant === "long" ? "high" : undefined}
          />
          {/* Brief #20 (makieta about-chips-photo-v1): object-top — głowa nigdy ucięta, bez
              wymuszania wysokości (obydwa warianty korzystają z tej samej klasy). */}
        </div>
        {/* Treść — prawa komórka (jedyna z paddingiem); flex-col, FactStrip doklejony na dół
            nad hairline (mt-auto wg speca 2026-11-07). */}
        <div className="relative flex flex-col p-6 min-[900px]:p-[44px_48px]">
          {renderAboutText(text)}
          {variant === "short" ? (
            <>
              <BrandPillRow group={copy.experience} />
              <BrandPillRow group={copy.certifications} />
            </>
          ) : null}
          {copy.stats?.length ? (
            // Brief #20: hairline nad FactStrip zostaje; oddech ~32px (pt-8) nad kreską i ~28px
            // (pt-7) pod nią — border rysuje się na wewnętrznym divie, zewnętrzny niesie mt-auto.
            <div className="mt-auto pt-8">
              <div className="border-t border-white/8 pt-7">
                <FactStrip stats={copy.stats} />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Wariant "long" (/o-mnie/): pod kaflem kafle marek (brief #13) w kolejności speca
          2026-11-07: BrandTiles(experience) → BrandTiles(certifications) → ValuesGrid → TechStack.
          FactStrip jest już wewnątrz tile (brief #12). Warunkowe bloki: pusta tablica = brak
          bloku (wzorzec featuredCaseSlugs) — BrandTiles pilnuje tego sam. Odstępy: BrandTiles/ValuesGrid
          mt-16 (w swoich komponentach), TechStack mt-20 (brief #18b) — celowo większy oddech przed
          marquee. Etykieta sekcji pozostaje about-heading — TechStack to lista technologii. */}
      {variant === "long" ? (
        <>
          <BrandTiles group={copy.experience} />
          <BrandTiles group={copy.certifications} />
          {copy.values?.length ? <ValuesGrid values={copy.values} /> : null}
          <div className="mt-20">
            <TechStack withNames />
          </div>
        </>
      ) : null}
    </section>
  );
}

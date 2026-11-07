import type { AboutStat } from "@/content/types";

// Pasek faktów wewnątrz kafla About (spec 2026-11-07 brief #12; pierwotnie spec 2026-11-06
// §4.3, brief 3, wzorzec "facts" biteoft.pl). Server component — statyczne dane z
// site.about.stats płyną wyłącznie przez propsy (zero literałów copy). Pusta tablica = brak
// renderu (filtrowanie braków, wzorzec featuredCaseSlugs). Lista bez punktów w konwencji
// TechStack (list-none p-0 m-0).
// Brief #12: siatka 2 kolumn (dokładnie 2 fakty) oraz m-0 — spacyning i hairline nad paskiem
// kontroluje rodzic (wrapper mt-auto pt-[18px] border-t w About.tsx).
// Liczby w mono/akcencie (eyebrow repo), etykiety ink-70 — kontrast WCAG AA nietknięty.
export function FactStrip({ stats }: { stats: AboutStat[] }) {
  if (stats.length === 0) return null;

  return (
    <ul
      role="list"
      className="m-0 grid list-none grid-cols-2 gap-x-8 gap-y-6 p-0"
    >
      {stats.map((stat, index) => (
        <li key={index} className="flex flex-col gap-2">
          <span className="font-mono text-[clamp(28px,3.5vw,40px)] font-semibold leading-none tracking-[-0.02em] text-accent">
            {stat.value}
          </span>
          <span className="text-[15px] leading-[1.5] text-ink-70">{stat.label}</span>
        </li>
      ))}
    </ul>
  );
}

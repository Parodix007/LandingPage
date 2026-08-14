import type { PricingPage } from "./types";

// Polska wersja cennika — 2026-08-11 decyzją właściciela zwinięta z 20 kart w 6 grupach + dwóch
// zestawów filtrów do jednej stawki godzinowej. Model rozliczeń to Time & Material. Każde pole
// niesie inną informację, więc przy edycji nie wolno powtarzać tego samego zdania w dwóch
// miejscach: `lead` opisuje model rozliczeń, `rate` liczbę i sposób wyliczenia pełnej ceny,
// `badges` buduje zaufanie. Markery `**...**` renderuje `ui/RichText` — patrz
// src/app/pricing/page.tsx.
export const pricing: PricingPage = {
  heading: { line1: "Ile to kosztuje?", line2: "Jedna stawka, bez cennikowej układanki." },
  lead: "Rozliczam się w modelu Time & Material — płacisz za **realnie przepracowane godziny**. Bez pakietów, bez progów cenowych i bez stawki zależnej od tego, jak duża jest Twoja firma.",
  rate: {
    amount: "od 150 zł",
    unit: "netto / godz.",
    note: "Pełną cenę poznajesz **przed startem** — zakres przeliczam na roboczogodziny. Jeśli w trakcie zakres się zmieni, zmianę też wyceniam w godzinach, **zanim ją zrobię**.",
  },
  badges: [
    "**Bezpłatna** rozmowa wstępna (30 min)",
    "Wycena na piśmie w **24 h**",
    "NDA na życzenie",
  ],
};

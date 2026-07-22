import type { PricingPage } from "./types";

// Polska wersja cennika (2026-07-22 handoff pl-copy) — źródło kwot i opisów: ..\cennik.html
// (polski oryginał, poza tym repo), z pierwszoosobowym passem tam, gdzie oryginał mówił
// bezosobowo o zespole ("poznaj nas" → "poznaj mnie", "od inżyniera" → "ode mnie" itd.).
// Kwoty w formacie `3 200 zł`, "netto" bez zmian. Ton zgodny z resztą strony: spokojny,
// konkretny, bez hype'u. Wizualny spec: ..\cennik-design-handoff.md, renderowany przez
// src/app/pricing/page.tsx (2026-07-20 pricing/Calendly/reorder design doc).
export const pricing: PricingPage = {
  heading: { line1: "Ile to kosztuje?", line2: "Bez ukrywania cen za formularzem." },
  lead: "Realne widełki startowe poniżej. Dokładną wycenę dostaniesz na piśmie w 24 godziny — ode mnie, nie od skryptu.",
  badges: ["Ceny „od\" · netto", "Wycena na piśmie w 24 h", "NDA na życzenie", "Stawka bazowa od 150 zł/h"],
  groups: [
    {
      eyebrow: "Zacznij bez ryzyka",
      sub: "Niski próg wejścia — poznaj mnie, zanim zaczniesz duży projekt.",
      tone: "accent",
      cards: [
        {
          title: "Rozmowa wstępna (30 min)",
          tag: "Bez zobowiązań",
          desc: "Rozmowa z inżynierem, nie z handlowcem. Mówisz, co chcesz zbudować — dostajesz szczerą pierwszą ocenę i kierunek.",
          price: { kind: "free", label: "bezpłatnie" },
        },
        {
          title: "Konsultacja techniczna (2–3 h)",
          desc: "Pogłębiona sesja: przegląd pomysłu lub systemu, rekomendacje i kierunek techniczny.",
          price: { kind: "from", amount: "400 zł" },
          note: "Odliczana od projektu.",
        },
        {
          title: "Warsztat Discover (1 dzień)",
          desc: "Dzień wspólnej pracy w metodzie Domain-Driven Design. Wychodzisz z zakresem, makietą i wyceną — zanim powstanie kosztowny kod.",
          price: { kind: "from", amount: "1 600 zł" },
          note: "Odliczany od projektu.",
        },
        {
          title: "Klikalna makieta projektu",
          tag: "Promocja czasowa",
          desc: "Interaktywny prototyp Twojej aplikacji — przeklikasz cały przepływ, zanim powstanie linijka kodu. Powstaje po warsztacie lub dostarczeniu danych.",
          price: { kind: "promo", old: "od 1 200 zł", now: "teraz za darmo" },
          note: "Oferta ograniczona czasowo.",
        },
      ],
    },
    {
      eyebrow: "Rozwiązania webowe",
      icon: "🌐",
      sub: "Platformy, portale i produkty — budowane, by skalować.",
      tone: "accent",
      cards: [
        {
          title: "MVP prostej aplikacji / sklepu",
          desc: "Pierwsza działająca wersja produktu — szybko na rynek, zanim zainwestujesz cały budżet.",
          price: { kind: "from", amount: "3 200 zł" },
        },
        {
          title: "Aplikacja webowa / platforma",
          desc: "Pełny produkt webowy z logiką biznesową, panelami i integracjami.",
          price: { kind: "from", amount: "11 500 zł" },
        },
        {
          title: "API / integracje / cloud & DevOps",
          desc: "API, połączenia z zewnętrznymi systemami, wdrożenia chmurowe i CI/CD.",
          price: { kind: "from", amount: "5 600 zł" },
        },
      ],
    },
    {
      eyebrow: "Automatyzacja",
      icon: "⚙️",
      sub: "Powtarzalna robota — zdjęta z barków zespołu.",
      tone: "accent2",
      cards: [
        {
          title: "Prosta automatyzacja",
          desc: "Obiegi dokumentów, powiadomienia, chatboty — proste procesy działające same.",
          price: { kind: "from", amount: "1 600 zł" },
        },
        {
          title: "Średnia integracja",
          desc: "Połączenie wielu systemów: ERP, CRM, bazy danych — spójny przepływ danych.",
          price: { kind: "from", amount: "8 000 zł" },
        },
        {
          title: "Zaawansowany system automatyzacji / AI",
          desc: "Dedykowane rozwiązania z logiką biznesową i komponentami AI.",
          price: { kind: "from", amount: "18 000 zł" },
        },
      ],
    },
    {
      eyebrow: "Systemy centralne i integracje",
      icon: "🔗",
      sub: "Systemy, które gadają z systemami.",
      tone: "accent2",
      cards: [
        {
          title: "Integracje B2B / systemy rozproszone / event-driven",
          desc: "Architektura zdarzeniowa i integracje między firmami — odporne na skalę.",
          price: { kind: "from", amount: "16 000 zł" },
        },
        {
          title: "Profiling środowiska",
          desc: "Load balancing, health-checki i konfiguracja infrastruktury pod stabilny ruch.",
          price: { kind: "from", amount: "1 600 zł" },
        },
        {
          title: "Wysokodostępne API (HA)",
          desc: "Architektura wysokiej dostępności: redundancja, failover, brak pojedynczego punktu awarii.",
          price: { kind: "from", amount: "6 000 zł" },
          note: "Wymaga aplikacji przygotowanej pod skalowanie.",
        },
      ],
    },
    {
      eyebrow: "Refactor & rescue",
      icon: "🛟",
      sub: "Systemy legacy — drugie życie.",
      tone: "accent",
      cards: [
        {
          title: "Audyt kodu / długu technologicznego",
          desc: "Przegląd systemu i kodu + raport: co działa, co jest ryzykiem, co zrobić najpierw.",
          price: { kind: "from", amount: "1 600 zł" },
        },
        {
          title: "Modernizacja / migracja systemu legacy",
          desc: "Przeniesienie starego systemu na nowoczesny stack — bez utraty danych i przestoju.",
          price: { kind: "from", amount: "24 000 zł" },
        },
        {
          title: "Praca na poziomie senior (rescue / performance / security)",
          desc: "Ratowanie projektów, optymalizacja wydajności, bezpieczeństwo — sytuacje o najwyższej stawce.",
          price: { kind: "individual", label: "wycena indywidualna" },
        },
      ],
    },
    {
      eyebrow: "Utrzymanie po wdrożeniu",
      icon: "🔧",
      sub: "Wsparcie, które zostaje po zakończeniu projektu.",
      tone: "accent",
      cards: [
        {
          title: "Administracja",
          desc: "Przegląd logów, monitoring statusu, drobne poprawki — spokój po wdrożeniu.",
          price: { kind: "from", amount: "200 zł", unit: "/ mies." },
        },
        {
          title: "Wsparcie i rozwój",
          desc: "Dalszy rozwój produktu w modelu godzinowym lub abonamentowym.",
          price: { kind: "individual", label: "wycena indywidualna" },
        },
      ],
    },
  ],
  filters: {
    categoryLegend: "Kategoria",
    priceLegend: "Cena",
    clearLabel: "Wyczyść filtry",
    countLabel: "widocznych",
    emptyTitle: "Nic nie pasuje do tych filtrów",
    emptyBody: "Zdejmij któryś filtr — albo wyczyść wszystkie, żeby zobaczyć pełną ofertę.",
    tiers: [
      { id: "free", label: "Bezpłatne" },
      { id: "lt5k", label: "Do 5 tys. zł" },
      { id: "mid", label: "5–15 tys. zł" },
      { id: "high", label: "15 tys. zł +" },
      { id: "custom", label: "Wycena indywidualna" },
    ],
  },
  foot: {
    billing:
      "Jak rozliczam: Time & Material tam, gdzie zakres się zmienia (płacisz za realną pracę), Fixed Price tam, gdzie zakres jest jasny (znasz cenę z góry). Model dobieram do ryzyka — uczciwie.",
    fine: "Wszystkie kwoty netto, orientacyjne. Finalną wycenę dostajesz na piśmie w 24 h. NDA na życzenie.",
  },
  ctaLabel: "Umów bezpłatną rozmowę wstępną (30 min) ›",
  disclaimer: "Ceny w formacie „od\" — każda finalna wycena przygotowywana jest indywidualnie.",
};

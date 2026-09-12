import { site } from "./site";
import type { KsefContent, KsefErpPage, KsefPlan, KsefTableRow } from "./types";

const plans: KsefPlan[] = [
  {
    id: "standard",
    name: "Standard",
    price: "249 zł",
    audience: "KSeF ma działać, a dodatkowe zmiany są potrzebne od czasu do czasu.",
    highlights: ["dodatkowe prace wyceniane osobno", "indywidualny rozwój na zamówienie"],
    cta: "Wybieram Standard",
    prefill: "Interesuje mnie plan Standard dla Comarch ERP Optima.",
  },
  {
    id: "pro",
    name: "PRO",
    price: "od 699 zł",
    audience: "Dla firm, które regularnie rozwijają rozwiązanie i chcą mieć zarezerwowany czas na zmiany.",
    highlights: [
      "od 2 godzin miesięcznie zarezerwowanych na rozwój rozwiązania",
      "pierwszeństwo w planowaniu prac rozwojowych",
      "możliwość zwiększenia miesięcznego zakresu",
      "rozszerzona opieka nad indywidualnymi elementami",
    ],
    noteLabel: "Warunki planu PRO",
    note: "Zarezerwowany zakres obowiązuje w danym okresie rozliczeniowym i nie przechodzi na kolejne okresy. Większe prace i dodatkowy zakres ustalam przed rozpoczęciem realizacji.",
    cta: "Dobierz wariant PRO",
    prefill: "Interesuje mnie plan PRO dla Comarch ERP Optima i regularny rozwój rozwiązania.",
    featured: true,
    badge: "Polecany",
  },
];

const table: KsefTableRow[] = [
  { label: "Rozwój rozwiązania", cells: { standard: "wycena osobno", pro: "od 2 godzin miesięcznie" } },
  { label: "Planowanie prac", cells: { standard: "według dostępności", pro: "pierwszeństwo" } },
  { label: "Zwiększenie zakresu", cells: { standard: false, pro: true } },
  { label: "Opieka nad zmianami", cells: { standard: "standardowa", pro: "rozszerzona" } },
  { label: "Wsparcie techniczne", cells: { standard: true, pro: true } },
  { label: "Obsługa starszych wersji Optimy", cells: { standard: true, pro: true } },
  { label: "Aktualizacje i utrzymanie", cells: { standard: true, pro: true } },
  { label: "Monitoring działania", cells: { standard: true, pro: true } },
];

const comarchOptima: KsefErpPage = {
  slug: "comarch-erp-optima",
  name: "Comarch ERP Optima",
  metaTitle: "KSeF w Comarch ERP Optima bez limitu | calm_soft",
  metaDescription: "KSeF dla Comarch ERP Optima bez limitu dokumentów. Obsługa starszych wersji, wiele firm, monitoring, wsparcie i możliwość indywidualnego rozwoju rozwiązania.",
  contactHref: "/ksef/comarch-erp-optima/#contact",
  hero: {
    eyebrow: "Comarch ERP Optima + KSeF",
    h1: "KSeF w Comarch ERP Optima dopasowany do Twojej firmy",
    lead: "Wysyłaj i odbieraj dokumenty bez limitu. Korzystaj z obecnej wersji Optimy — również starszej. A jeśli Twój proces wymaga czegoś więcej, mogę dopasować rozwiązanie do sposobu pracy Twojej firmy.",
    note: "Od 249 zł netto / miesiąc",
    bullets: ["dokumenty bez limitu", "wiele obsługiwanych firm", "wsparcie starszych wersji Optimy", "indywidualne rozwiązania w każdym planie"],
    cta: "Sprawdź zgodność mojej Optimy",
    pricingCta: "Zobacz cennik",
  },
  legacy: {
    title: "Masz starszą wersję Optimy? Zostań przy niej, jeśli nadal spełnia potrzeby firmy.",
    body: "Wdrożenie KSeF nie musi oznaczać aktualizacji całego ERP. Najpierw sprawdzam używaną wersję Optimy i Twoje środowisko. Jeśli mogę uruchomić integrację w obecnej konfiguracji, nie musisz zmieniać działającego systemu tylko ze względu na KSeF.",
    steps: [
      { title: "Sprawdzam zgodność Twojej wersji", body: "Weryfikuję, czy mogę uruchomić integrację w obecnym środowisku." },
      { title: "Uruchamiam standardową integrację", body: "Jeśli wersja jest obsługiwana, przechodzę do wdrożenia." },
      { title: "Informuję wcześniej o dostosowaniu", body: "Zakres i koszt ustalam przed rozpoczęciem prac." },
    ],
    claim: "Starsza wersja Optimy nie oznacza automatycznie wyższego abonamentu.",
    cta: "Sprawdź moją wersję Optimy",
  },
  development: {
    title: "Integracja KSeF, którą można rozwijać",
    intro: "Twój proces działa inaczej? Mogę dopasować integrację. Standardowa obsługa KSeF wystarczy wielu firmom, ale nie każda firma pracuje tak samo.",
    items: [
      { title: "Dodatkowe automatyzacje", body: "Mogę opracować automatyzacje dopasowane do sposobu pracy firmy." },
      { title: "Własne reguły obsługi dokumentów", body: "Ustalam reguły, które odpowiadają Twojemu procesowi." },
      { title: "Niestandardowy obieg faktur", body: "Mogę odwzorować obieg dokumentów, którego nie obejmuje standard." },
      { title: "Dodatkowe statusy i działania", body: "Rozszerzam informacje i akcje potrzebne pracownikom." },
      { title: "Połączenie z innymi systemami", body: "Mogę połączyć KSeF z CRM, WMS, sklepem lub innym systemem." },
      { title: "Rozwój pod proces firmy", body: "Indywidualne rozwiązania są dostępne w każdym planie." },
    ],
    standardNote: "W planie Standard dodatkowe prace wyceniam osobno.",
    proNote: "Plan PRO wybierasz wtedy, gdy regularnie rozwijasz rozwiązanie i chcesz mieć co miesiąc zarezerwowany czas na takie prace.",
  },
  coverage: {
    title: "Pełna obsługa KSeF",
    intro: "KSeF działa w tle. Ty pracujesz dalej w swoim ERP.",
    tiles: [
      { title: "Wysyłka i odbiór bez limitu", body: "Nie kupujesz kolejnych paczek dokumentów wraz ze wzrostem firmy." },
      { title: "Statusy i UPO", body: "Wiesz, czy dokument został przyjęty i jaki jest jego aktualny status." },
      { title: "Obsługa korekt", body: "Korekty są częścią tego samego procesu." },
      { title: "Automatyczne ponowienia", body: "Czasowy problem po stronie KSeF nie musi oznaczać ręcznego rozpoczynania procesu od początku." },
      { title: "Wiele firm", body: "Jedno rozwiązanie może obsługiwać wiele podmiotów." },
      { title: "Praca w Optimie", body: "Nie dokładamy użytkownikom kolejnego programu do codziennej obsługi faktur." },
    ],
  },
  monitoring: {
    title: "Integracja nie kończy się w dniu wdrożenia",
    intro: "KSeF jest usługą, która musi działać również po uruchomieniu. Dlatego rozwiązanie pozostaje objęte utrzymaniem i monitoringiem technicznym.",
    items: [
      { title: "Monitoring działania", body: "Kontroluję pracę integracji i zdarzenia wymagające diagnostyki." },
      { title: "Obsługa błędów", body: "Problemy z komunikacją pozostawiają informacje potrzebne do szybkiego ustalenia przyczyny." },
      { title: "Aktualizacje", body: "Utrzymuję standardową integrację wraz ze zmianami wymaganymi przez KSeF." },
      { title: "Wsparcie techniczne", body: "W razie problemu masz konkretnego dostawcę odpowiedzialnego za rozwiązanie." },
    ],
    claim: "Nie zostajesz sam z wdrożeniem po jego uruchomieniu.",
  },
  pricing: {
    title: "Cennik",
    includesTitle: "Prosty abonament. Bez progów dokumentowych.",
    includes: ["nielimitowana wysyłka do KSeF", "nielimitowany odbiór z KSeF", "wiele obsługiwanych firm", "statusy, UPO i korekty", "automatyczna synchronizacja"],
    includesNote: "Możliwość indywidualnego rozwoju rozwiązania pozostaje dostępna w każdym planie.",
    unit: "netto / miesiąc",
    plans,
    table,
    tableCaption: "Porównanie planów KSeF dla Comarch ERP Optima",
    yesLabel: "w planie",
    noLabel: "brak w planie",
    badge: "Utrzymanie, aktualizacje i wsparcie w cenie.",
  },
  comparison: {
    title: "Standard czy PRO?",
    intro: "Wybierz model współpracy dopasowany do tego, jak często rozwijasz rozwiązanie.",
    standard: { title: "Standard", body: "KSeF ma działać, a dodatkowych zmian potrzebujesz od czasu do czasu. Korzystasz z rozwiązania, a indywidualne prace zamawiasz wtedy, gdy są potrzebne." },
    pro: { title: "PRO", body: "Regularnie rozwijasz procesy i chcesz mieć co miesiąc zarezerwowany czas na zmiany. Zakres miesięcznej dostępności mogę zwiększać wraz z potrzebami Twojej firmy." },
    note: "W obu planach możesz zamawiać indywidualne rozwiązania. PRO rezerwuje czas na ich regularny rozwój.",
  },
  otherErp: {
    title: "Potrzebujesz KSeF również w innym ERP?",
    body: ["Nie ograniczam indywidualnych wdrożeń wyłącznie do Comarch ERP Optima.", "Jeśli korzystasz z innego systemu, sprawdzę możliwości jego połączenia z KSeF i ocenię, czy mogę opracować odpowiednie rozwiązanie.", "Możliwe jest również połączenie kilku systemów w jeden proces, jeżeli pozwalają na to możliwości danego oprogramowania."],
    cta: "Zapytaj o mój ERP",
    prefill: "Chcę zapytać o możliwość integracji KSeF z moim ERP.",
  },
  howItWorks: {
    title: "Od obecnej Optimy do działającego KSeF",
    steps: [
      { title: "Sprawdzam środowisko", body: "Poznaję wersję Optimy, sposób pracy i potrzeby firmy." },
      { title: "Konfiguruję rozwiązanie", body: "Podłączam KSeF i ustawiam sposób obsługi dokumentów." },
      { title: "Testuję", body: "Sprawdzam wysyłkę, odbiór, statusy, UPO i najważniejsze scenariusze." },
      { title: "Uruchamiam", body: "Przechodzę na środowisko produkcyjne." },
      { title: "Utrzymuję", body: "Po wdrożeniu rozwiązanie pozostaje objęte monitoringiem, aktualizacjami i wsparciem." },
    ],
  },
  audience: {
    title: "Dla kogo jest ta oferta?",
    intro: "Najwięcej zyskasz, jeśli:",
    items: [
      { title: "Masz starszą wersję Optimy", body: "Nie chcesz aktualizować całego ERP tylko ze względu na KSeF." },
      { title: "Obsługujesz dużo dokumentów lub wiele firm", body: "Zależy Ci na stałym koszcie bez kolejnych progów." },
      { title: "Masz własny sposób pracy", body: "Standardowy moduł nie obejmuje całego procesu." },
      { title: "Potrzebujesz dodatkowych automatyzacji lub integracji", body: "Chcesz rozwijać rozwiązanie razem z potrzebami firmy." },
      { title: "Korzystasz z kilku systemów", body: "KSeF powinien być częścią większego procesu, a nie kolejnym osobnym programem." },
    ],
  },
  faq: {
    title: "Pytania i odpowiedzi",
    items: [
      { question: "Czy muszę mieć najnowszą wersję Comarch ERP Optima?", answer: "Nie zawsze. Najpierw sprawdzam używaną wersję i możliwości Twojego środowiska. Jeżeli mogę uruchomić integrację bez aktualizacji ERP, nie musisz zmieniać wersji tylko ze względu na KSeF." },
      { question: "Czy liczba dokumentów wpływa na wysokość abonamentu?", answer: "Nie. Abonament nie jest uzależniony od liczby wysyłanych i odbieranych dokumentów." },
      { question: "Czy mogę obsługiwać wiele firm?", answer: "Tak. Rozwiązanie obsługuje również wiele podmiotów." },
      { question: "Czy w Standardzie mogę zamówić indywidualną funkcję?", answer: "Tak. Indywidualne rozwiązania są dostępne niezależnie od planu. W Standardzie zakres dodatkowych prac wyceniam osobno." },
      { question: "Czym Standard różni się od PRO?", answer: "W Standardzie dodatkowe prace zamawiasz wtedy, gdy ich potrzebujesz. PRO zapewnia dodatkowo zarezerwowany miesięczny czas na regularny rozwój rozwiązania." },
      { question: "Czy niewykorzystany zakres PRO przechodzi na kolejny miesiąc?", answer: "Nie. PRO rezerwuje określony czas na prace w danym okresie rozliczeniowym. Niewykorzystany zakres nie przechodzi na kolejne okresy i nie podlega zwrotowi." },
      { question: "Co jeśli potrzebuję większej zmiany?", answer: "Najpierw ustalam zakres i opracowuję wycenę. Prace rozpoczynam dopiero po jej zaakceptowaniu." },
      { question: "Czy możesz podłączyć KSeF do innego ERP?", answer: "W wielu przypadkach tak. Najpierw sprawdzam możliwości danego systemu i na tej podstawie określam zakres integracji." },
      { question: "Czy poprawki błędów zużywają zakres PRO?", answer: "Nie. Poprawki standardowego rozwiązania wynikające z jego prawidłowego utrzymania są częścią obsługi produktu. Pula PRO dotyczy nowych funkcji i indywidualnych zmian." },
      { question: "Co obejmuje monitoring?", answer: "Monitoring obejmuje techniczne działanie integracji, procesy komunikacji z KSeF oraz zdarzenia wymagające diagnostyki." },
    ],
  },
  finalCta: {
    title: "Sprawdź, jak KSeF może działać w Twojej Optimie",
    body: "Napisz, z jakiej wersji Optimy korzystasz i czego potrzebujesz. Sprawdzę zgodność środowiska oraz najlepszy wariant wdrożenia.",
    cta: "Sprawdź moją Optimę",
  },
  contact: {
    title: "Porozmawiajmy o KSeF w Twojej Optimie",
    intro: "Napisz, z jakiej wersji Optimy korzystasz i czego potrzebujesz. Odpowiadam osobiście.",
    checks: site.contact.checks,
    calendlyTitle: site.contact.talk.title,
    calendlyBody: site.contact.talk.body,
    calendlyCta: site.contact.talk.cta,
    form: { title: "Zapytanie o KSeF", intro: "Napisz, z jakiej wersji Optimy korzystasz i czego potrzebujesz.", messageLabel: "Wiadomość", messagePlaceholder: "Np. Korzystam z wersji Optimy ___ i potrzebuję obsługi KSeF.", submit: "Wyślij zapytanie" },
    cta: "Sprawdź moją Optimę",
    stickyCta: "Sprawdź moją Optimę",
  },
};

export const ksef: KsefContent = {
  teaser: {
    id: "ksef",
    heading: "KSeF w Twoim ERP. Dopasowany do sposobu pracy firmy.",
    body: ["Wysyłaj i odbieraj dokumenty bez limitu. Korzystaj z obecnej wersji ERP, również starszej, jeśli środowisko spełnia warunki integracji.", "Mogę dopasować rozwiązanie do sposobu pracy Twojej firmy i połączyć je z innymi systemami."],
    tagline: "Bez limitu dokumentów. Starsze wersje Optimy. Możliwość indywidualnego rozwoju.",
    cta: "Sprawdź swój ERP",
    erpListLabel: "Obsługiwane systemy",
    erpCta: "Zobacz ofertę ›",
  },
  nav: { triggerLabel: "KSeF w ERP", overviewHref: "/#ksef", overviewLabel: "O produkcie KSeF" },
  erps: [comarchOptima],
};

export const getKsefErpBySlug = (slug: string) => ksef.erps.find((e) => e.slug === slug);

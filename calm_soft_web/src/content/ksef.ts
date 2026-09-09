import { site } from "./site";
import type { KsefContent, KsefErpPage, KsefPlan, KsefTableRow } from "./types";

// Produkt KSeF (2026-09-09 ksef-product-pages design, rev. 3: coverage + reliability, comparison
// usunięte) — zajawka na stronie głównej (`#ksef`) + jedna podstrona `/ksef/comarch-erp-optima/`.
// Zero kalkulatora, zero liczb Comarch (świadome decyzje właściciela z Fazy 0 specu, podtrzymane
// w rev. 2 i rev. 3). `contact` czyta `checks`/`calendly*` z `site.contact`, żeby nie duplikować
// tych samych fraz w drugim pliku contentu.

const plans: KsefPlan[] = [
  {
    id: "firma",
    name: "Firma",
    price: "499 zł",
    audience: "Dla jednej firmy korzystającej z Comarch ERP Optima.",
    highlights: ["jedna firma", "standardowe wsparcie"],
    cta: "Wybieram pakiet Firma",
    prefill: "Interesuje mnie pakiet Firma (Comarch ERP Optima).",
  },
  {
    id: "biuro",
    name: "Biuro rachunkowe",
    price: "699 zł",
    audience: "Dla biur, które chcą obsługiwać wiele firm w ramach jednego rozwiązania.",
    highlights: ["obsługa wielu firm", "standardowe wsparcie"],
    badge: "Polecany",
    cta: "Wybieram pakiet dla biura",
    prefill: "Interesuje mnie pakiet Biuro rachunkowe (Comarch ERP Optima).",
    featured: true,
  },
  {
    id: "pro",
    name: "PRO",
    price: "1 499 zł",
    audience: "Dla firm i biur, które potrzebują rozwiązania dopasowanego do własnych procesów.",
    highlights: [
      "obsługa wielu firm",
      "priorytetowe wsparcie",
      "dopasowanie do procesów firmy",
      "dodatkowe funkcje",
      "automatyzacja pracy",
    ],
    note: "**Potrzebujesz dodatkowej funkcji w ERP, KSeF albo automatyzacji pracy? Mogę rozwinąć rozwiązanie pod sposób działania Twojej firmy.** Indywidualne prace rozwojowe dostępne na preferencyjnych warunkach.",
    cta: "Porozmawiaj o pakiecie PRO",
    prefill: "Chcę porozmawiać o pakiecie PRO (Comarch ERP Optima).",
  },
];

const table: KsefTableRow[] = [
  { label: "Dla kogo", cells: { firma: "jedna firma", biuro: "biuro obsługujące wiele firm", pro: "firmy i biura z indywidualnymi potrzebami" } },
  { label: "Obsługa wielu firm", cells: { firma: false, biuro: true, pro: true } },
  { label: "Wsparcie", cells: { firma: "standardowe", biuro: "standardowe", pro: "priorytetowe" } },
  { label: "Dopasowanie do procesów firmy", cells: { firma: false, biuro: false, pro: true } },
  { label: "Dodatkowe funkcje", cells: { firma: false, biuro: false, pro: true } },
  { label: "Automatyzacja pracy", cells: { firma: false, biuro: false, pro: true } },
];

const comarchOptima: KsefErpPage = {
  slug: "comarch-erp-optima",
  name: "Comarch ERP Optima",
  metaTitle: "KSeF w Comarch ERP Optima taniej — stały abonament | calm_soft",
  metaDescription:
    "Wysyłaj i odbieraj dokumenty KSeF w Comarch ERP Optima w stałym abonamencie, bez limitu dokumentów. Integracja, utrzymanie i wsparcie w cenie.",
  contactHref: "/ksef/comarch-erp-optima/#contact",
  hero: {
    eyebrow: "Comarch ERP Optima + KSeF",
    h1: "KSeF w Comarch ERP Optima. Tylko taniej.",
    lead: "Wysyłaj i odbieraj dokumenty KSeF **bez kosztu rosnącego wraz z liczbą faktur**. Zostajesz przy Comarch ERP Optima, a calm_soft zapewnia pełną obsługę KSeF, utrzymanie rozwiązania i wsparcie w stałym abonamencie.",
    note: "Zmienia się koszt. Nie sposób pracy.",
    cta: "Sprawdź, ile możesz zaoszczędzić",
  },
  problem: {
    title: "Po co płacić więcej za obsługę KSeF?",
    body: [
      "W modelu pakietowym koszt może rosnąć razem z liczbą dokumentów.",
      "W calm_soft płacisz stały abonament niezależnie od tego, czy firma wysyła kilkaset, kilka tysięcy czy więcej dokumentów.",
    ],
    badge: "Stały koszt. Bez limitu dokumentów.",
    punchline: "Twoja firma może rosnąć. Koszt obsługi KSeF nie musi rosnąć razem z nią.",
  },
  coverage: {
    title: "Pełna obsługa KSeF bez dokładania pracy po stronie firmy",
    intro:
      "Nie chodzi tylko o wysłanie faktury. Rozwiązanie obsługuje cały codzienny proces związany z KSeF — od wysyłki dokumentu po potwierdzenie jego przyjęcia.",
    tiles: [
      {
        title: "Wiesz, czy faktura została przyjęta",
        body: "Po wysłaniu dokumentu otrzymujesz informację o jego przyjęciu, numer KSeF oraz UPO.",
        highlight: "Nie musisz ręcznie sprawdzać, co stało się z dokumentem.",
      },
      {
        title: "Faktury zakupowe trafiają do Twojego procesu",
        body: "Dokumenty z KSeF są pobierane i przekazywane do dalszej obsługi w Optimie.",
        highlight: "Mniej ręcznego przenoszenia dokumentów.",
      },
      {
        title: "Korekty są częścią tego samego rozwiązania",
        body: "Nie potrzebujesz osobnego procesu ani dodatkowego narzędzia do obsługi faktur korygujących.",
      },
      {
        title: "Problemy z KSeF nie muszą zatrzymywać pracy",
        body: "W przypadku czasowej niedostępności systemu dokumenty mogą zostać obsłużone i przesłane po przywróceniu działania KSeF.",
        highlight: "Firma może pracować dalej, nawet gdy KSeF ma problem.",
      },
    ],
  },
  reliability: {
    title: "Nie musisz pilnować KSeF. Pilnuję go za Ciebie.",
    body: [
      "KSeF jest zewnętrznym systemem i jego działanie nie zawsze zależy od Twojej firmy.",
      "Dlatego calm_soft odpowiada za działanie rozwiązania po stronie integracji, obsługę problemów z wysyłką oraz dostosowanie do zmian po stronie KSeF.",
    ],
    claim: "Mniej ręcznego pilnowania. Mniej ryzyka, że dokument utknie bez wiedzy pracownika.",
    items: [
      "dokument został wysłany — wiesz o tym",
      "dokument został przyjęty — masz potwierdzenie",
      "pojawił się problem — rozwiązanie może go obsłużyć",
      "KSeF się zmienia — dostosowanie rozwiązania jest po mojej stronie",
    ],
  },
  legacy: {
    title: "Masz starszą Optimę? Nie musisz jej aktualizować tylko dla KSeF.",
    body: "Jeżeli korzystasz ze stacjonarnej Comarch ERP Optima w klasycznym modelu licencyjnym i Twoja obecna wersja nadal działa, możesz korzystać z integracji calm_soft **bez przechodzenia na nowszą wersję wyłącznie ze względu na KSeF**.",
    claim: "Zostań na wersji, która działa. Nie płać za upgrade tylko dlatego, że potrzebujesz KSeF.",
    notice: {
      label: "Ważne: model subskrypcyjny",
      body: [
        "Dotyczy klasycznego modelu licencyjnego Comarch ERP Optima.",
        "W przypadku Optimy działającej w modelu subskrypcyjnym aktywna subskrypcja Comarch jest nadal wymagana do korzystania z samego programu. Integracja calm_soft tego wymogu nie zastępuje.",
      ],
    },
  },
  howItWorks: {
    title: "Pracujesz w Optimie tak jak dotychczas",
    steps: [
      { title: "Pracujesz w swoim ERP", body: "Dokumenty nadal tworzysz i obsługujesz w Comarch ERP Optima." },
      { title: "Ja zajmuję się KSeF", body: "calm_soft odpowiada za wysyłanie i odbieranie dokumentów oraz ich poprawną obsługę." },
      { title: "Wiesz, co dzieje się z każdą fakturą", body: "Informacje o przyjęciu dokumentu, numerze KSeF i UPO wracają do Twojego procesu." },
      { title: "Ja utrzymuję rozwiązanie", body: "Zmiany KSeF, utrzymanie i wsparcie pozostają po stronie calm_soft." },
    ],
    punchline: "Nie zmieniasz ERP. Nie zmieniasz procesu pracy. Zmieniasz koszt i przenosisz odpowiedzialność za obsługę KSeF na mnie.",
  },
  pricing: {
    title: "Cennik",
    includesTitle: "Co firma dostaje w każdym pakiecie",
    includes: [
      "pełną codzienną obsługę KSeF",
      "wysyłanie i odbieranie dokumentów",
      "informację, czy dokument został poprawnie przyjęty",
      "numer KSeF i UPO",
      "obsługę korekt",
      "brak limitu dokumentów",
      "utrzymanie rozwiązania",
      "dostosowanie do zmian KSeF",
      "wsparcie calm_soft",
    ],
    includesNote: "Płacisz mniej, ale nie dostajesz okrojonego rozwiązania.",
    unit: "netto / miesiąc",
    plans,
    table,
    tableCaption: "Porównanie pakietów KSeF dla Comarch ERP Optima",
    yesLabel: "w pakiecie",
    noLabel: "brak w pakiecie",
    badge: "Utrzymanie, aktualizacje i wsparcie w cenie.",
  },
  savings: {
    title: "Im więcej dokumentów, tym więcej zostaje w Twojej firmie",
    body: "W calm_soft koszt nie rośnie razem z liczbą faktur. Dzięki stałemu abonamentowi łatwiej przewidzieć koszt KSeF i uniknąć przechodzenia na kolejne progi cenowe wraz ze wzrostem działalności.",
    claim: "Więcej faktur nie oznacza wyższego abonamentu.",
    cta: "Sprawdź swoją oszczędność",
    prefill:
      "Proszę o wyliczenie oszczędności na KSeF w Comarch ERP Optima. Miesięcznie wystawiam ok. ___ faktur sprzedażowych i otrzymuję ok. ___ faktur zakupowych.",
  },
  support: {
    title: "Taniej nie oznacza bez wsparcia",
    body: [
      "Nie zostajesz sam z rozwiązaniem po wdrożeniu.",
      "calm_soft odpowiada za utrzymanie integracji, dostosowanie jej do zmian KSeF i wsparcie w przypadku problemów.",
    ],
    claim: "Ty korzystasz z KSeF. Ja dbam, żeby rozwiązanie działało.",
  },
  faq: {
    title: "Pytania i odpowiedzi",
    items: [
      {
        question: "Czy muszę zmienić Comarch ERP Optima?",
        answer: "Nie. Rozwiązanie działa z Twoją obecną Optimą.",
      },
      {
        question: "Czy potrzebuję najnowszej wersji Optimy?",
        answer:
          "Nie zawsze. W przypadku klasycznych licencji możliwe jest pozostanie na starszej wersji, jeśli jest ona wspierana przez moje rozwiązanie.",
      },
      {
        question: "Co jeśli KSeF chwilowo nie działa?",
        answer: "Rozwiązanie obsługuje sytuacje niedostępności i może przekazać dokumenty po przywróceniu działania systemu.",
      },
      {
        question: "Czy dostanę potwierdzenie, że faktura została przyjęta?",
        answer: "Tak. Obsługiwane są informacje o statusie dokumentu, numer KSeF oraz UPO.",
      },
      {
        question: "Czy liczba dokumentów wpływa na cenę?",
        answer: "Nie. Abonament calm_soft nie rośnie wraz z liczbą faktur.",
      },
      {
        question: "Czy obsługiwane są korekty?",
        answer: "Tak. Korekty są częścią obsługi KSeF.",
      },
      {
        question: "Czy biuro rachunkowe może obsługiwać wiele firm?",
        answer: "Tak. Pakiet dla biur jest przeznaczony właśnie do takiego modelu pracy.",
      },
    ],
  },
  finalCta: {
    title: "Zostań przy Optimie. Płać mniej za KSeF.",
    body: "Pełna codzienna obsługa KSeF, brak limitu dokumentów, utrzymanie i wsparcie — bez zmiany ERP.",
    claim: "Mniej kosztów. Mniej ręcznej pracy. Mniej rzeczy do pilnowania.",
    cta: "Sprawdź, ile możesz zaoszczędzić",
  },
  contact: {
    title: "Porozmawiajmy o KSeF w Twojej Optimie",
    intro: "Napisz, którego pakietu potrzebujesz i ile dokumentów obsługujesz miesięcznie. Odpowiadam osobiście.",
    checks: site.contact.checks,
    calendlyTitle: site.contact.talk.title,
    calendlyBody: site.contact.talk.body,
    calendlyCta: site.contact.talk.cta,
    form: {
      title: "Zapytanie o KSeF",
      intro: "Napisz, którego pakietu potrzebujesz i ile dokumentów obsługujesz miesięcznie.",
      messageLabel: "Wiadomość",
      messagePlaceholder: "Np. Interesuje mnie pakiet Firma dla jednej firmy na Comarch ERP Optima.",
      submit: "Wyślij zapytanie",
    },
    cta: "Sprawdź, ile możesz zaoszczędzić",
    stickyCta: "Sprawdź, ile zaoszczędzisz",
  },
};

export const ksef: KsefContent = {
  teaser: {
    id: "ksef",
    heading: "KSeF w Twoim ERP. Po prostu taniej.",
    body: [
      "Nie musisz zmieniać systemu ani sposobu pracy, żeby obniżyć koszt obsługi KSeF.",
      "calm_soft łączy Twój obecny ERP z KSeF i zapewnia wysyłanie oraz odbieranie dokumentów w stałym abonamencie, **bez kosztu rosnącego wraz z liczbą faktur**.",
    ],
    tagline: "Ta sama codzienna obsługa KSeF. Niższy koszt. Utrzymanie i wsparcie w cenie.",
    cta: "Sprawdź swój ERP",
    erpListLabel: "Obsługiwane systemy",
    erpCta: "Zobacz ofertę ›",
  },
  nav: {
    triggerLabel: "KSeF w ERP taniej",
    overviewHref: "/#ksef",
    overviewLabel: "O produkcie KSeF",
  },
  erps: [comarchOptima],
};

export const getKsefErpBySlug = (slug: string) => ksef.erps.find((e) => e.slug === slug);

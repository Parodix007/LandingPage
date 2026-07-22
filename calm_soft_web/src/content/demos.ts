import type { Demo } from "./types";

// Zatwierdzone copy dla siedmiu klikalnych makiet pod public/demo/<slug>/ (pięć klinik —
// nietykane, verbatim-assets contract, patrz docs/superpowers/specs/
// 2026-07-20-demo-section-design.md — plus dwie nowe marki własne, cadence i airlift).
// Zrzuty ekranu w /demo-shots/<slug>.webp. Kolejność: merdi zostaje pierwszy (test modala
// używa demos[0]), potem pozostała czwórka klinik, na końcu cadence i airlift. Wyróżniona
// trójka (homepage) pochodzi z site.featuredDemoSlugs, rozwiązywana przez getDemoBySlug
// (nigdy przez indeks).
export const demos: Demo[] = [
  {
    slug: "merdi",
    name: "Merdi",
    tag: "Klinika weterynaryjna",
    description:
      "Cała klinika przyjazna opiekunom zwierząt: usługi z cenami podanymi z góry, zespół, umawianie wizyty w pięciu krokach i konto z profilem zdrowia każdego pupila.",
    tagline: "Weterynaria, która rozumie opiekunów zwierząt.",
    detail:
      "Merdi to klinika weterynaryjna w nowoczesnym wydaniu: przejrzysty cennik usług, ciepła strona zespołu i pięciokrokowe umawianie wizyt, które zamienia „dzwoń w godzinach otwarcia\" w zadanie na 30 sekund. Każdy klient dostaje konto z profilem zdrowia dla każdego pupila — historia, wizyty i przypomnienia w jednym miejscu.",
    features: [
      "Usługi z cenami z góry",
      "Strona zespołu",
      "Umawianie wizyty w 5 krokach",
      "Konto klienta",
      "Profil każdego pupila",
    ],
    shot: "/demo-shots/merdi.webp",
    shotAlt: "Strona kliniki weterynaryjnej Merdi — strona główna",
    href: "/demo/merdi/index.html",
    uiLang: "pl",
  },
  {
    slug: "vitalab",
    name: "VitaLab",
    tag: "Klinika + laboratorium",
    description:
      "Klinika i własne laboratorium w jednym: badania zamówisz w pięciu krokach, umówisz lekarza, porównasz badania i pakiety, znajdziesz punkt pobrań — a wszystko śledzisz z konta pacjenta.",
    tagline: "Badania i wizyty lekarskie w jednym spokojnym przepływie.",
    detail:
      "VitaLab łączy dwie ścieżki, które większość klinik trzyma osobno: umawianie lekarza i zamawianie badań. Pacjent wybiera badania lub pakiety w pięciu prowadzonych krokach, wskazuje punkt pobrań, umawia wizyty i śledzi wyniki z jednego konta — a klinika ma jedno źródło prawdy.",
    features: [
      "Zamawianie badań w 5 krokach",
      "Umawianie wizyt w 5 krokach",
      "Szczegóły badań i pakietów",
      "Wyszukiwarka punktów pobrań",
      "Konto pacjenta z wynikami",
    ],
    shot: "/demo-shots/vitalab.webp",
    shotAlt: "Strona kliniki i laboratorium VitaLab — strona główna",
    href: "/demo/vitalab/index.html",
    uiLang: "pl",
  },
  {
    slug: "primavita",
    name: "Primavita",
    tag: "Klinika medyczna",
    description:
      "Prywatna klinika medyczna online: wyszukiwarka 36 lekarzy w 12 specjalizacjach, przejrzysty cennik, pakiety opieki i umawianie w pięciu krokach — wyniki czekają w panelu pacjenta.",
    tagline: "Umów specjalistę bez dzwonienia i czekania.",
    detail:
      "Primavita to doświadczenie prywatnej kliniki, jakiego pacjenci naprawdę chcą: przeszukiwalny katalog 36 lekarzy w 12 specjalizacjach, czytelny cennik, pakiety opieki i pięciokrokowe umawianie z pominięciem kolejki telefonicznej. Po wizycie wyniki i historia trafiają do przejrzystego panelu pacjenta.",
    features: [
      "36 lekarzy, 12 specjalizacji",
      "Przeszukiwalny cennik",
      "Pakiety opieki",
      "Umawianie w 5 krokach",
      "Panel pacjenta z wynikami",
    ],
    shot: "/demo-shots/primavita.webp",
    shotAlt: "Strona kliniki medycznej Primavita — strona główna",
    href: "/demo/primavita/index.html",
    uiLang: "pl",
  },
  {
    slug: "healthlab",
    name: "HealthLab",
    tag: "Zaplecze laboratorium",
    description:
      "Konsola, na której działa laboratorium diagnostyczne: pacjenci, przyjmowanie zleceń, wprowadzanie i wydawanie wyników oraz jeden czytelny obieg każdej próbki — bez arkuszy.",
    tagline: "Zaplecze, które prowadzi laboratorium.",
    detail:
      "HealthLab to laboratorium diagnostyczne od strony personelu: jedna konsola do kartotek pacjentów, przychodzących zleceń, wprowadzania wyników i kontrolowanego ich wydawania. Zastępuje żonglowanie arkuszami i mailami jednym obiegiem, więc technicy i kierownicy zawsze wiedzą, co czeka, co jest gotowe i co zostało wysłane.",
    features: [
      "Zarządzanie pacjentami",
      "Przyjmowanie zleceń badań",
      "Wprowadzanie i wydawanie wyników",
      "Obieg próbki",
      "Pulpit personelu",
    ],
    shot: "/demo-shots/healthlab.webp",
    shotAlt: "Konsola zaplecza laboratorium HealthLab",
    href: "/demo/healthlab/index.html",
    desktopOnly: true,
    uiLang: "pl",
  },
  {
    slug: "merdi-panel",
    name: "Merdi Panel",
    tag: "Panel personelu wet.",
    description:
      "Strona zespołu Merdi: kalendarz wizyt, plan dnia i grafik, kartoteki klientów i pupili oraz szybkie umawianie — wszystko, czego potrzebuje recepcja i lekarze, w jednym panelu.",
    tagline: "Cały dzień kliniki z jednego kalendarza.",
    detail:
      "Za przyjazną stroną Merdi siedzi panel, w którym żyje personel: wspólny kalendarz wizyt, plan dnia i grafik oraz szybki dostęp do kartotek klientów i pupili. Recepcja umawia i przekłada wizyty w sekundy; lekarze widzą swój dzień jednym rzutem oka — bez podwójnych rezerwacji i papierowego zeszytu.",
    features: [
      "Kalendarz wizyt",
      "Plan dnia i grafik",
      "Kartoteki klientów i pupili",
      "Umawianie i przekładanie",
      "Pulpit recepcji",
    ],
    shot: "/demo-shots/merdi-panel.webp",
    shotAlt: "Panel personelu kliniki weterynaryjnej Merdi",
    href: "/demo/merdi-panel/index.html",
    desktopOnly: true,
    uiLang: "pl",
  },
  {
    slug: "cadence",
    name: "Cadence",
    tag: "Platforma automatyzacji",
    description:
      "Panel, z którego zarządzasz automatyzacjami firmy: przepływy odczytujące faktury z maili, cotygodniowe podsumowania, alerty awarii i pełna historia uruchomień — wszystko w jednym miejscu.",
    tagline: "Automatyzacje firmy pod kontrolą, w jednym panelu.",
    detail:
      "Cadence pokazuje, jak może wyglądać centrum dowodzenia automatyzacjami: lista przepływów ze statusami i filtrami, podgląd ostatnich wyników — odczytana faktura z załącznika, wysłane podsumowanie, szkic odpowiedzi na maila — historia uruchomień oraz kanały alertów na wypadek, gdyby automatyzacja zawiodła. Dokładnie ten rodzaj pracy, który opisuję w usłudze Automatyzacja — tu w formie klikalnego produktu.",
    features: [
      "Lista automatyzacji ze statusami i filtrami",
      "Podgląd wyników uruchomień (np. odczyt faktur)",
      "Historia uruchomień",
      "Alerty awarii na wybrane kanały",
      "Konfiguracja i test powiadomień",
    ],
    shot: "/demo-shots/cadence.webp",
    shotAlt: "Panel platformy automatyzacji Cadence — lista przepływów",
    href: "/demo/cadence/index.html",
    uiLang: "en",
    logoId: "cadence",
  },
  {
    slug: "airlift",
    name: "AIRLIFT",
    tag: "Konsola migracji danych",
    description:
      "Konsola operatora dużej migracji plików: postęp sesji na żywo, checkpointy i wznowienia, podgląd workerów, ciągła weryfikacja integralności i pełny dziennik zdarzeń.",
    tagline: "Ciężkie dane, bezpieczne lądowanie.",
    detail:
      "AIRLIFT to interfejs, jakiego potrzebuje migracja milionów plików: pasek postępu sesji produkcyjnej, kontrola uruchomienia — start, pauza, wznowienie — checkpointy z możliwością powrotu do dowolnego punktu, ciągła weryfikacja sum kontrolnych, podgląd workerów i przeszukiwalny „flight recorder\" z logami. Zbudowany na motywach prawdziwej migracji ~2,5 mln plików opisanej w moich case studies.",
    features: [
      "Postęp migracji i kontrola sesji (start / pauza / wznowienie)",
      "Checkpointy i wznawianie od dowolnego punktu",
      "Ciągła weryfikacja integralności (sumy kontrolne)",
      "Podgląd i szczegóły workerów",
      "Przeszukiwalny dziennik zdarzeń (flight recorder)",
    ],
    shot: "/demo-shots/airlift.webp",
    shotAlt: "Konsola migracji danych AIRLIFT — postęp sesji produkcyjnej",
    href: "/demo/airlift/index.html",
    uiLang: "en",
    logoId: "airlift",
  },
];

export const getDemoBySlug = (slug: string) => demos.find((d) => d.slug === slug);

import type { CaseStudy } from "./types";

// Pierwszoosobowa wersja z uczciwą atrybucją (2026-07-22 handoff pl-copy): zero "my"/"nasz
// zespół" tam, gdzie pracowałem sam; tam, gdzie praca była zespołowa (automotive, e-Doręczenia,
// legacy modernisation) — jawne "pracowałem w zespole…"/"współtworzyłem…", nigdy zawyżona rola.
// Tylko zweryfikowane liczby z tabeli marketingu (patrz handoff §Zasady globalne) — bez lat
// doświadczenia, bez wartości, których nie da się obronić na rozmowie z klientem.
export const cases: CaseStudy[] = [
  {
    slug: "public-sector-poland",
    serviceId: "web",
    tone: "a",
    tag: "Sektor publiczny",
    client: "Platforma dla sektora publicznego · 20 administracji miejskich",
    headline: "Jedna platforma dla 20 administracji miejskich",
    teaser:
      "Około 20 tys. osób korzysta z jednego miejsca do obsługi spraw pracowniczych. Platforma uwzględnia różnice między miastami i wymienia dane ze starszym systemem kadrowo-płacowym.",
    m1v: "20",
    m1l: "administracji miejskich",
    m2v: "~20 tys.",
    m2l: "użytkowników",
    challenge:
      "Każde miasto pracuje trochę inaczej, ale wszystkie korzystają z jednej platformy. System musiał obsługiwać różne zasady i jednocześnie wymieniać dane o czasie pracy, nieobecnościach i wypłatach ze starszym rozwiązaniem kadrowo-płacowym.",
    approach:
      "Przejąłem odpowiedzialność za architekturę działającej platformy. Uprościłem sposób włączania funkcji dla poszczególnych miast i zbudowałem brakujące połączenie z systemem kadrowo-płacowym — od projektu po wdrożenie.",
    results:
      "Platforma działa w 20 administracjach miejskich i obsługuje około 20 tys. użytkowników. Konfiguracja kolejnego miasta nie wymaga już wiedzy eksperckiej, a nowa integracja weszła do oferty handlowej produktu.",
    tags: ["Sektor publiczny", "Integracja legacy", "Java · Angular · Oracle", "Jedyny architekt"],
  },
  {
    slug: "e-delivery-platform-nationwide",
    serviceId: "core",
    tone: "b",
    tag: "Systemy centralne",
    client: "Regulowana platforma dokumentowa",
    headline: "Około 2,5 mln plików przeniesionych bez utraty danych",
    teaser:
      "Migrację podzieliłem na bezpieczne, możliwe do wznowienia etapy. Każdy z nich potwierdzał kompletność danych, a finałowe przełączenie zakończyło się w jeden weekend.",
    m1v: "~2,5 mln",
    m1l: "plików, we wznawialnych sesjach",
    m2v: "0",
    m2l: "utraconych plików",
    challenge:
      "Regulowana platforma dokumentowa musiała przenieść około 2,5 mln plików, czyli blisko 500 GB danych. Utrata nawet części dokumentów oznaczałaby konsekwencje wykraczające poza zwykłą awarię techniczną.",
    approach:
      "Zaprojektowałem i zbudowałem proces, który można było zatrzymać, sprawdzić i bezpiecznie wznowić. Każdy etap zapisywał postęp i kontrolował zgodność przeniesionych danych.",
    results:
      "Wszystkie pliki zostały przeniesione bez utraty danych. Migrację można było prowadzić etapami, a jej końcowy przebieg produkcyjny zamknął się w jednym weekendzie.",
    tags: ["Migracja danych", "NFS → MinIO/S3", "Sumy kontrolne", "Finał w jeden weekend"],
  },
  {
    slug: "localhost-academy",
    serviceId: "automation",
    tone: "b",
    tag: "Automatyzacja",
    client: "Localhost Academy · szkoła programowania (mentoring 1:1)",
    headline: "Codzienna obsługa szkoły bez dokładania ręcznej administracji",
    teaser:
      "Automatyzacje wspierają płatności, komunikację, przypomnienia, notatki i onboarding. Korzysta z nich 150–200 uczniów, pracowników i osób zarządzających dziennie.",
    m1v: "150",
    m1l: "uczniów w modelu 1:1",
    m2v: "150–200",
    m2l: "użytkowników dziennie",
    challenge:
      "Szkoła prowadzi mentoring jeden na jeden, dlatego każde administracyjne przeoczenie bezpośrednio wpływa na doświadczenie ucznia. Płatności, komunikacja, przypomnienia i onboarding były obsługiwane ręcznie, a wraz ze wzrostem szkoły zabierały coraz więcej czasu.",
    approach:
      "Zamiast budować kosztowny system od zera, wykorzystałem narzędzia, które organizacja już znała: Make, Airtable, Notion, Discord i usługi Google. Zaprojektowałem cały przepływ i poprowadziłem wdrożenie realizowane wspólnie z dwoma inżynierami.",
    results:
      "Z automatyzacji korzysta codziennie 150–200 osób. Powtarzalna administracja nie ogranicza już w takim stopniu liczby obsługiwanych uczniów, a zespół może samodzielnie zmieniać część reguł bez edycji kodu.",
    tags: ["Automatyzacja procesów", "Make · Airtable · Notion", "CTO wewnętrznego IT", "EdTech"],
  },
  {
    slug: "enterprise-30-years-in-production",
    serviceId: "refactor",
    tone: "a",
    tag: "Refactor & rescue",
    client: "Enterprise · dekady w produkcji",
    headline: "Nowoczesna platforma bez zatrzymywania działającego systemu",
    teaser:
      "Rdzeń systemu obsługującego około 20 tys. użytkowników został przeniesiony na współczesną platformę webową w mniej niż rok i bez nieplanowanych przestojów.",
    m1v: "<1 rok",
    m1l: "dostarczona migracja rdzenia",
    m2v: "~20 tys.",
    m2l: "użytkowników platformy",
    challenge:
      "System działał od dekad i nadal był potrzebny około 20 tys. użytkowników. Starzejąca się technologia utrudniała rozwój i utrzymanie, ale jednorazowe przepisanie całości stwarzało zbyt duże ryzyko dla działającego biznesu.",
    approach:
      "Pracując w zespole, współtworzyłem kierunek stopniowej migracji. Nowa platforma powstawała obok istniejącego systemu, dzięki czemu kolejne elementy można było wymieniać bez zatrzymywania codziennej pracy.",
    results:
      "Migracja rdzenia została dostarczona w mniej niż rok, bez nieplanowanych przestojów. Użytkownicy otrzymali nowoczesny interfejs, a system stał się prostszy w utrzymaniu i gotowy na kolejne integracje.",
    tags: ["Modernizacja legacy", "4GL → nowoczesny stack", "Architektura", "~20 tys. użytkowników"],
  },
  {
    slug: "public-sector-eu",
    serviceId: "core",
    tone: "b",
    tag: "Systemy centralne",
    client: "Regulowany program sektora publicznego",
    headline: "Integracja e-doręczeń zweryfikowana na 50 tys. użytkowników na godzinę",
    teaser:
      "Warstwa integracyjna połączyła systemy krajowe i transgraniczne, zachowując wymagania bezpieczeństwa, weryfikowalności i zgodności prawnej.",
    m1v: "50 tys./h",
    m1l: "użytkowników — zweryfikowana przepustowość",
    challenge:
      "Każda wiadomość w systemie e-doręczeń ma znaczenie prawne. Platforma musiała połączyć wiele zewnętrznych systemów działających według różnych standardów, bez osłabienia bezpieczeństwa i możliwości potwierdzenia przebiegu doręczenia.",
    approach:
      "Jako członek zespołu współtworzyłem usługi odpowiedzialne za wymianę danych z systemami zewnętrznymi. Bezpieczeństwo, zgodność i zakładane obciążenie były uwzględniane na każdym etapie projektu.",
    results:
      "Warstwa integracyjna została zaprojektowana i zweryfikowana dla obciążenia 50 tys. użytkowników na godzinę. Powstała infrastruktura przygotowana do obsługi usługi o ogólnokrajowej skali.",
    tags: ["Systemy rozproszone", "Zgodność regulacyjna", "Usługi reaktywne", "Integracje"],
  },
  {
    slug: "software-delivery-org-50-people",
    serviceId: "automation",
    tone: "b",
    tag: "Automatyzacja",
    client: "Organizacja wytwarzająca oprogramowanie",
    headline: "Wdrożenie AI, które naprawdę się przyjęło — kultura, nie hype.",
    teaser:
      "AI naprawdę użyteczne w developmencie, testach i operacjach — wdrożone w ~100-osobowym dziale bez kompromisów w jakości i kontroli.",
    m1v: "~100 osób",
    m1l: "dział pracujący z AI na co dzień",
    challenge:
      "Narzędzia AI zawodzą w firmach wytwarzających oprogramowanie z przewidywalnego powodu: kupuje się licencje, spisuje wytyczne, a pół roku później nikt z nich nie korzysta. Cel: AI naprawdę użyteczne w developmencie, testach i operacjach biznesowych — bez kompromisów w jakości i kontroli.",
    approach:
      "Wdrożenie zbudowałem wokół dedykowanych przepływów dopasowanych do tego, jak organizacja naprawdę pracuje — dobór narzędzi, bariery bezpieczeństwa, warsztaty praktyczne i wpięcie AI w istniejącą kulturę inżynierską: powtarzalna robota schodzi z ludzi, decyzje i jakość zostają w ich rękach.",
    results:
      "W ~100-osobowym dziale AI stało się częścią codziennej pracy inżynierów, testerów i ról biznesowych — przyjęło się, bo pasowało do kultury, a nie dlatego, że było nakazane. Rutynowa praca w kodzie, testach i procesach jest zautomatyzowana, a zespół w pełni kontroluje to, co trafia na produkcję.",
    tags: ["Przepływy AI", "Dedykowane workflow", "Warsztaty", "Human-in-the-loop"],
  },
  {
    slug: "international-automotive-sales-platform",
    serviceId: "web",
    tone: "a",
    tag: "Rozwiązania webowe",
    client: "Globalny producent samochodów · USA i Europa",
    headline: "Ogólnoeuropejska premiera auta z datą, która nie mogła się przesunąć.",
    teaser:
      "Data premiery ogłoszona publicznie na długo, zanim ktokolwiek zapytał inżynierię o wykonalność. Warstwa backend-for-frontend między enterprise'owym CMS-em a nowoczesnym frontem — dostarczona na czas.",
    m1v: "USA + UE",
    m1l: "obsłużone rynki",
    challenge:
      "Nowy model miał trafić do sprzedaży w całej Europie w sztywnym, publicznie ogłoszonym terminie — ustalonym przez marketing, prasę i sieci dealerskie na długo przed pytaniem o wykonalność. Treści żyły w enterprise'owym CMS-ie zbudowanym dla zespołów redakcyjnych, nie dla nowoczesnego frontu — a zespół był rozproszony między Polską, Wielką Brytanią i USA, więc każda decyzja projektowa musiała przetrwać przekazanie na koniec dnia pracy.",
    approach:
      "Pracowałem jako inżynier w międzynarodowym zespole nad warstwą pośrednią: backend-for-frontend przekształcającym dane CMS-a dokładnie w to, czego potrzebował interfejs — bez spowalniania czegokolwiek i bez zmuszania zespołów contentowych do zmiany sposobu pracy. Nest.js, React i Adobe Experience Manager.",
    results:
      "Dostarczone zgodnie z harmonogramem: platforma działała na rynkach europejskich w dniu premiery i wytrzymała ruch tego dnia.",
    tags: ["Projekt międzynarodowy", "Automotive", "Nest.js · React · AEM"],
  },
];

export const getCaseBySlug = (slug: string) => cases.find((c) => c.slug === slug);

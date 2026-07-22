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
    headline: "Dwadzieścia miast, jedna platforma — i legacy, którego nikt nie chciał dotykać.",
    teaser:
      "Platforma, na której pracownicy 20 administracji miejskich codziennie załatwiają swoje sprawy — a pod spodem zbudowana od zera integracja z systemem kadrowo-płacowym, która wcześniej nie istniała.",
    m1v: "20",
    m1l: "administracji miejskich",
    m2v: "~20 tys.",
    m2l: "użytkowników",
    challenge:
      "Administracja publiczna działa na dokumentach — i zaskakująco wiele z nich dotyczy jej samej: wnioski urlopowe, nadgodziny, paski płacowe, obieg pism między wydziałami. Platforma daje pracownikom administracji, od urzędnika po kierownictwo miasta, jedno miejsce do załatwiania tych spraw. Naprawdę trudne były dwie rzeczy: pod spodem pracuje kadrowo-płacowe źródło prawdy o godzinach, nieobecnościach i wypłatach — system zbudowany w innej epoce, z którym nic współczesnego nie miało rozmawiać — a do tego żadne dwa miasta nie są takie same i jedna baza kodu musi zachowywać się jak inny produkt w każdym wdrożeniu.",
    approach:
      "Przejąłem platformę jako działający system produkcyjny i jestem dziś jej jedynym architektem — każda zmiana dzieje się pod ludźmi, którzy nie mogą sobie pozwolić na przestój. Dwie rzeczy zbudowałem w całości, od architektury po wdrożenie: nowy, znacznie prostszy mechanizm zarządzania funkcjami per miasto — konfiguracja kolejnej administracji przestała wymagać wiedzy eksperckiej — oraz zupełnie nową integrację z legacy systemem kadrowo-płacowym. Java, Angular i Oracle.",
    results:
      "Produkcja w 20 administracjach miejskich, około 20 tysięcy osób używających platformy w codziennej pracy. Integracja kadrowo-płacowa weszła do oferty handlowej produktu — praca, która generuje przychód, nie tylko możliwości. Jedno z wymagań klienta poprowadziłem od pomysłu po projekt graficzny — zostało przyjęte, opłacone i dobrze odebrane.",
    tags: ["Sektor publiczny", "Integracja legacy", "Java · Angular · Oracle", "Jedyny architekt"],
  },
  {
    slug: "e-delivery-platform-nationwide",
    serviceId: "core",
    tone: "b",
    tag: "Systemy centralne",
    client: "Regulowana platforma dokumentowa",
    headline: "2,5 miliona plików przeniesionych. Zero utraconych.",
    teaser:
      "Regulowana platforma dokumentowa musiała zejść z NFS na storage obiektowy. Zbudowałem narzędzia migracyjne z checkpointami i ciągłą weryfikacją integralności — ~2,5 mln plików we wznawialnych sesjach, finał w jeden weekend.",
    m1v: "~2,5 mln",
    m1l: "plików, we wznawialnych sesjach",
    m2v: "0",
    m2l: "utraconych plików",
    challenge:
      "Platforma dokumentowa trzymająca około 2,5 miliona plików (~500 GB) na klasycznym NFS potrzebowała przejść na storage obiektowy: właściwe wersjonowanie, prostszy cykl życia i warstwa, którą da się utrzymywać, a nie tylko przeżywać. W środowisku regulowanym utracony dokument to nie bug, tylko incydent z konsekwencjami poza inżynierią — a przy tej skali naiwne podejście zawodzi: proces, który umiera przy 80% bez wiedzy, co już przeszło, jest gorszy niż nierozpoczęty.",
    approach:
      "Ten projekt prowadziłem w całości — architektura i implementacja były po mojej stronie. Prawdziwą pracą nie było kopiowanie, tylko maszyneria wokół niego: silnik transferu, mechanizm checkpointów i wznowień oraz warstwa monitoringu i kontroli, dzięki której proces dało się w każdej chwili zatrzymać, obejrzeć i bezpiecznie kontynuować. Z NFS na obiektowy MinIO — z założeniem, że migrację uruchamia się wielokrotnie i bezpiecznie, a nie raz i nieodwracalnie.",
    results:
      "Około 2,5 miliona plików zmigrowanych bez ani jednej straty — a „zero strat\" nie jest tu deklaracją: sumy kontrolne i metryki rekoncyliacji były wbudowane w proces, więc każda sesja dowodziła, co przeniosła. Migracja działa w sesjach — można ją startować, pauzować i wznawiać — a finałowy przebieg produkcyjny zamknął się w jeden weekend.",
    tags: ["Migracja danych", "NFS → MinIO/S3", "Sumy kontrolne", "Finał w jeden weekend"],
  },
  {
    slug: "localhost-academy",
    serviceId: "automation",
    tone: "b",
    tag: "Automatyzacja",
    client: "Localhost Academy · szkoła programowania (mentoring 1:1)",
    headline: "Localhost Academy: 150 uczniów, zero zespołu operacyjnego.",
    teaser:
      "Szkoła ucząca programowania w modelu mentoringu 1:1 prowadziła całą operację ręcznie. Zaprojektowałem automatyzacje na narzędziach, które szkoła już znała — dziś korzysta z nich 150–200 osób dziennie, przeważnie ich nie zauważając.",
    m1v: "150",
    m1l: "uczniów w modelu 1:1",
    m2v: "150–200",
    m2l: "użytkowników dziennie",
    challenge:
      "Localhost Academy uczy programowania przez mentoring jeden na jeden — dbałość o każdego ucznia jest produktem i jednocześnie ograniczeniem, bo sama z siebie się nie skaluje. Szkoła prowadziła operacje ręcznie: płatności, komunikację między zarządem a uczniami, przypomnienia o zadaniach, notatki przed i po każdej lekcji, onboarding nowych osób. Przy obietnicy „nikt nie wypada z radaru\" administracyjne potknięcie to nie niedogodność, tylko wada produktu — a operacje ręczne mają twardy sufit.",
    approach:
      "Uczyłem w tej szkole i prowadziłem jej wewnętrzne IT jako CTO. Oczywistą odpowiedzią — w szkole pełnej programistów — byłby dedykowany software. I byłaby to zła odpowiedź: organizacja tej wielkości nie uniesie kosztu jego utrzymania. Zamiast tego zaprojektowałem architekturę automatyzacji na narzędziach, które zespół już rozumiał — Make do orkiestracji, Airtable i Notion jako struktura, Discord do komunikacji, ekosystem Google do kalendarza i poczty. Wdrożenie poprowadziłem, kierując dwójką inżynierów — część zbudowałem sam.",
    results:
      "Ze zautomatyzowanych procesów korzysta dziś 150–200 osób dziennie — uczniowie, kadra i zarząd — w większości ich nie zauważając, i właśnie o to chodzi. Zdolność operacyjna szkoły przestała zależeć od liczby godzin, które ludzie mogą poświęcić na administrację, a przypomnienie zmienia się bez otwierania edytora kodu — na narzędziach, które szkoła sama posiada i rozumie.",
    tags: ["Automatyzacja procesów", "Make · Airtable · Notion", "CTO wewnętrznego IT", "EdTech"],
  },
  {
    slug: "enterprise-30-years-in-production",
    serviceId: "refactor",
    tone: "a",
    tag: "Refactor & rescue",
    client: "Enterprise · dekady w produkcji",
    headline: "System sprzed dekad, odrodzony jako nowoczesna platforma webowa.",
    teaser:
      "Krytyczny biznesowo system obsługujący ~20 tys. użytkowników — przeniesiony z technologii legacy na nowoczesny stack webowy, bez nieplanowanych przestojów.",
    m1v: "<1 rok",
    m1l: "dostarczona migracja rdzenia",
    m2v: "~20 tys.",
    m2l: "użytkowników platformy",
    challenge:
      "Rdzeń systemu spędził dekady w produkcji na technologii, która dziś jest legacy. Działał — ale wiązał biznes ze starzejącym się narzędziem, z roku na rok utrudniał utrzymanie i rekrutację, a przestarzały interfejs zaczynał przeszkadzać w zdobywaniu klientów. Przy ~20 tysiącach użytkowników zależnych od systemu rewrite w stylu big-bang nie wchodził w grę.",
    approach:
      "Pracując w zespole dostarczającym, współtworzyłem kierunek techniczny migracji na nowoczesny stack webowy — architekturę docelową, standardy bezpieczeństwa i benchmarki wydajności — zaplanowanej tak, by biznes cały czas działał na istniejącym systemie, podczas gdy powstawała nowa platforma.",
    results:
      "Użytkownicy dostali nowoczesne doświadczenie, którego stara technologia nie była w stanie dać, utrzymanie stało się prostsze i tańsze, a platforma otworzyła się na współczesne integracje — z migracją rdzenia dostarczoną w niecały rok i bez nieplanowanych przestojów.",
    tags: ["Modernizacja legacy", "4GL → nowoczesny stack", "Architektura", "~20 tys. użytkowników"],
  },
  {
    slug: "public-sector-eu",
    serviceId: "core",
    tone: "b",
    tag: "Systemy centralne",
    client: "Regulowany program sektora publicznego",
    headline: "Prawnie wiążące doręczenia elektroniczne, zbudowane pod zgodność.",
    teaser:
      "Platforma bezpiecznych doręczeń elektronicznych, w której każda wiadomość ma wagę prawną — inżynieria pod zgodność regulacyjną i ogólnokrajową skalę.",
    m1v: "50 tys./h",
    m1l: "użytkowników — zweryfikowana przepustowość",
    challenge:
      "Doręczenia elektroniczne to komunikacja z konsekwencjami prawnymi: każda wiadomość musi być bezpieczna, weryfikowalna i zgodna z regulacjami. Platforma potrzebowała warstwy integracyjnej łączącej systemy krajowe i transgraniczne — każdy z własnymi protokołami i standardami — bez jednego słabego ogniwa.",
    approach:
      "Współtworzyłem część platformy integracyjnej jako reaktywne, asynchroniczne usługi budowane pod skalę, integrujące się z systemami zewnętrznymi w rygorze bezpieczeństwa i zgodności regulacyjnej. Compliance kształtował architekturę od pierwszego dnia — nie jako checklista na końcu.",
    results:
      "Warstwa integracyjna zaprojektowana i zweryfikowana na 50 tysięcy użytkowników na godzinę — infrastruktura ogólnokrajowej skali, gotowa rosnąć. Inżynieria backend-to-backend: systemy bez ekranu, w których nie ma miejsca na „prawie działa\".",
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
    archived: true,
  },
];

export const getCaseBySlug = (slug: string) => cases.find((c) => c.slug === slug);

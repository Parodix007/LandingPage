import type { Service, SolutionLineSlug } from "./types";

// Kolejność core → automation → web → refactor oraz tony poniżej to 2026-07-26
// services-solutions crosslink design (owner-ordered reorder). Ton jest właściwością usługi, nie
// jej pozycji, więc po zmianie kolejności tony zostały przypisane na nowo, żeby zachować
// naprzemienny rytm b/a/b/a zamiast b/b/a/a — patrz spec §5.
export const services: Service[] = [
  {
    id: "core",
    tone: "b",
    tag: "Systemy centralne i integracje",
    headline: "Systemy, które gadają z systemami.",
    intro:
      "Systemy, których nikt nie widzi, a od których zależy wszystko. Projektuję kręgosłup — usługi, kolejki i integracje, które pilnują, żeby ERP, partnerzy i platformy widzieli to samo — do zadań, w których poprawność nie podlega negocjacji. W tym integracje, które uchodziły za „niemożliwe\" przez to, co siedzi pod spodem.",
    fit: [
      "Twój ERP, e-commerce i systemy partnerów ciągle się rozjeżdżają",
      "Zadania wsadowe wywracają się przy wolumenach, pod które nikt ich nie projektował",
      "Wymieniasz dane, w których każdy komunikat ma wagę prawną lub finansową",
      "Czas rzeczywisty staje się wymaganiem, a nie miłym dodatkiem",
    ],
    deliver: [
      { n: "Architektura i projekt", d: "Zdarzeniowo i domenowo — zwymiarowane pod obciążenie, które będziesz mieć, nie to, które miałeś." },
      { n: "Integracje B2B", d: "REST, SOAP, kolejki albo pliki płaskie — mówię tym, czym mówią Twoi partnerzy." },
      { n: "Wysokodostępne API", d: "Zaprojektowane, przetestowane obciążeniowo i zweryfikowane na realnych celach ruchu." },
      { n: "Bezstratne migracje danych", d: "Miliony rekordów przeniesione, integralność sprawdzona na każdym kroku." },
      { n: "Bezpieczeństwo klasy compliance", d: "Standardy i ślady audytowe w architekturze — nie doklejone na końcu." },
    ],
    approach:
      "Pracę przy kręgosłupie planuję jak operację: próby na stagingu, testy obciążeniowe, ścieżki rollbacku i okna przełączenia liczone w godzinach — tak, żeby biznes nie zauważył zabiegu.",
    relatedSlugs: ["public-sector-poland", "e-delivery-platform-nationwide", "public-sector-eu"],
    solutionSlugs: ["integracje", "migracje"],
    // slug/metaTitle/metaDescription/pageH1/pageSections: strona /uslugi/<slug>/
    // (docs/superpowers/specs/2026-07-31-service-pages-restructure-design.md). Etap 2: meta/H1
    // podmienione na frazy kampanii, pageSections wypełnione dosłownym copy właściciela.
    slug: "systemy-i-integracje",
    metaTitle: "Integracje ERP — Comarch, Subiekt, enova | calm_soft",
    metaDescription:
      "Spinam Comarch Optima, Subiekt GT, enova365 i WAPRO Mag z e-commerce, KSeF i systemami partnerów. Architektura, API, migracje bez utraty danych.",
    pageH1: "Integracje systemów ERP, które przestają się rozjeżdżać",
    pageSections: [
      {
        heading: "Z jakimi systemami pracuję",
        intro:
          "**Nazwy, nie ogólniki.** Jeśli Twojego systemu tu nie ma — napisz. Sprawdzenie, co udostępnia jego API, zajmuje mi **jeden telefon**.",
        groups: [
          {
            group: "ERP i systemy handlowe",
            items: [
              { n: "Comarch ERP Optima", d: "Najczęstszy przypadek: Optima jako **źródło prawdy o towarze i cenie**, sklep jako kanał sprzedaży. Spinam przez API, z **kolejką na wypadek, gdy jedna strona przestaje odpowiadać**." },
              { n: "Comarch ERP XL", d: "Większa skala i więcej wyjątków niż w Optimie. Tu zwykle chodzi o zamówienia i dokumenty magazynowe, które muszą trafić do XL **bez ręcznego przepisywania**." },
              { n: "Subiekt GT", d: "Integracja przez **Sferę** albo bezpośrednio po bazie — zależnie od licencji. Najczęściej: **stany, ceny i zamówienia** między Subiektem a sklepem." },
              { n: "Subiekt nexo", d: "Nowsze API niż w GT i inne ograniczenia. **Sprawdzam, co Twoja wersja faktycznie udostępnia, zanim podam cenę.**" },
              { n: "enova365", d: "**REST API** i moduły dodatkowe. Typowy zakres: **kontrahenci, dokumenty handlowe, rozrachunki**." },
              { n: "WAPRO Mag", d: "Wymiana przez pliki albo bazę. **Mówię wprost, kiedy to oznacza kompromis w czasie reakcji** — bo oznacza." },
              { n: "Symfonia", d: "Handel i Finanse. Zakres zależy od wersji, więc **ustalam go przed wyceną, nie po**." },
            ],
          },
          {
            group: "Sklepy i marketplace",
            items: [
              { n: "WooCommerce", d: "**Stany, ceny, zamówienia i faktury w obie strony.** Najczęstsza para z Subiektem i Optimą." },
              { n: "PrestaShop", d: "To samo co przy Woo, tylko z inną warstwą API i innymi **pułapkami przy wariantach produktów**." },
              { n: "Allegro", d: "Oferty, zamówienia i wiadomości. **Limity API Allegro planuję w architekturze, a nie odkrywam w trakcie.**" },
              { n: "BaseLinker", d: "Kiedy BaseLinker już u Ciebie jest, zwykle **nie warto go zastępować** — warto go **poprawnie spiąć z ERP**." },
            ],
          },
          {
            group: "Wymiana danych i zgodność",
            items: [
              { n: "KSeF", d: "Buduję integracje wokół KSeF: **wystawianie, odbiór, obsługa błędów**. Jeśli szukasz gotowego modułu KSeF do Comarcha — **kup go u producenta, wyjdzie taniej**. Ja przydaję się tam, gdzie moduł się kończy." },
              { n: "EDI", d: "Komunikaty w formatach, którymi mówią **sieci handlowe**." },
              { n: "REST i SOAP", d: "Także **starsze, słabo udokumentowane API** — od tego zwykle się zaczyna." },
              { n: "Pliki płaskie i FTP", d: "Nadal działa u połowy partnerów B2B. Robię to tak, żeby **dało się zdiagnozować, kiedy przestanie**." },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "automation",
    tone: "a",
    tag: "Automatyzacja",
    headline: "Powtarzalna robota — zdjęta z barków zespołu.",
    intro:
      "Każda firma działa na niewidzialnych rutynach — dane przepisywane między systemami, upominanie się o płatności, ten sam mail wysyłany dziesiąty raz. Mapuję te rutyny i automatyzuję je: ostrożnie, przejrzyście, z Twoimi ludźmi przy sterach. A kiedy dedykowany software byłby złą odpowiedzią — powiem Ci to wprost.",
    fit: [
      "Twój zespół przepisuje te same dane do dwóch albo trzech systemów",
      "Koniec miesiąca to nadgodziny, arkusze i błędy, których dało się uniknąć",
      "Operacje nie urosną bez zatrudniania kolejnych rąk do ręcznej pracy",
      "Chcesz AI w procesach — bez oddawania kontroli nad jakością",
    ],
    deliver: [
      { n: "Mapowanie procesów i audyt", d: "Najpierw znajduję, którędy naprawdę wyciekają godziny — dopiero potem automatyzuję." },
      { n: "Integracje systemów", d: "CRM, ERP, poczta i płatności połączone — zamiast przeklejane." },
      { n: "RPA", d: "Softwarowe roboty do powtarzalnych klików, których nikt nie powinien robić ręcznie." },
      { n: "Przepływy wspierane AI", d: "LLM-y szkicują rutynową robotę; decyzje podejmują Twoi ludzie." },
      { n: "Pipeline'y danych i raporty", d: "Raporty, które składają się same, według harmonogramu, z żywych danych." },
    ],
    approach:
      "Zaczynam celowo od małego: mapuję jeden proces, automatyzuję go, mierzę odzyskane godziny — i dopiero wtedy rozszerzam. Bez wielkiej platformy na start i bez sześciu miesięcy wdrożenia przed pierwszym widocznym efektem.",
    relatedSlugs: ["software-delivery-org-50-people", "localhost-academy"],
    solutionSlugs: ["automatyzacje"],
    slug: "automatyzacja",
    metaTitle: "Automatyzacja procesów firmy — n8n, Make.com, RPA | calm_soft",
    metaDescription:
      "Automatyzuję faktury, obieg dokumentów, raportowanie i onboarding. Buduję na n8n, Make.com i Power Automate albo we własnym kodzie.",
    pageH1: "Automatyzacja procesów w firmie — od mapowania po wdrożenie",
    pageSections: [
      {
        heading: "Co najczęściej automatyzuję",
        intro:
          "Zaczynam od **jednego procesu**, **mierzę odzyskane godziny** i dopiero wtedy rozszerzam. Poniżej te, które wracają najczęściej.",
        groups: [
          {
            items: [
              { n: "Faktury", d: "Odczyt z załącznika albo skanu, uzupełnienie danych kontrahenta, dekretacja i wysyłka do ERP. **Człowiek zatwierdza, nie przepisuje.**" },
              { n: "Obieg dokumentów", d: "**Ścieżka akceptacji, wersje, terminy i archiwum, które da się przeszukać.** Bez pytania na czacie, kto widział to ostatni." },
              { n: "Raportowanie", d: "Raporty składane **z żywych danych według harmonogramu**. **Koniec miesiąca przestaje być osobnym projektem.**" },
              { n: "Onboarding", d: "Konta, uprawnienia, sprzęt i ścieżka pierwszego tygodnia nowej osoby — **uruchamiane z jednego formularza**." },
              { n: "Ofertowanie", d: "Od zapytania do gotowego dokumentu, **z cenami z systemu, a nie z pamięci handlowca**." },
              { n: "Zamówienia", d: "Przepływ między sklepem, magazynem i ERP, **z jedną skrzynką na wyjątki**, które naprawdę wymagają decyzji." },
            ],
          },
        ],
      },
      {
        heading: "Na czym buduję",
        intro:
          "**Narzędzie dobieram do procesu, nie odwrotnie.** A jeśli **taniej wyjdzie zmiana procesu niż jego automatyzacja** — usłyszysz to **przed wyceną, nie po wdrożeniu**.",
        groups: [
          {
            // Właściciel podał dla tej grupy etykietę „Platformy i technologie" — celowo pominięta:
            // przy jednej jedynej grupie powielałaby nagłówek sekcji „Na czym buduję" (2026-07-31
            // service-pages-restructure design, etap 2).
            items: [
              { n: "n8n", d: "**Self-hosted** albo w chmurze. Wybieram, gdy **dane nie mogą wyjść poza Twoją infrastrukturę** albo gdy logika przerasta to, co da się wyklikać." },
              { n: "Make.com", d: "Dawniej Integromat. **Szybkie scenariusze bez utrzymywania serwera.** Dobre na start i przy umiarkowanym wolumenie." },
              { n: "Power Automate", d: "Kiedy firma siedzi w **Microsoft 365**, a akceptacje mają żyć w **Teams i SharePoint**." },
              { n: "Zapier", d: "Proste połączenia dwóch narzędzi. **Uczciwie: przy większym wolumenie i przy historii uruchomień szybko robi się ciasno.**" },
              { n: "Własny kod", d: "**Node.js albo Python**, gdy żadna platforma nie udźwignie wolumenu, liczby wyjątków lub wymagań zgodności." },
              { n: "RPA", d: "Softwarowe roboty tam, gdzie **system nie ma API i nie będzie go miał**." },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "web",
    tone: "b",
    tag: "Rozwiązania webowe",
    headline: "Platformy, portale i produkty — budowane, by skalować.",
    intro:
      "Produkty, których naprawdę dotykają Twoi klienci: portale, e-commerce, SaaS i narzędzia wewnętrzne za nimi. Całość prowadzi jedna osoba — projekt, architektura, kod i chmura — więc nic nie ginie między dostawcami.",
    fit: [
      "Startujesz z produktem, portalem albo sklepem i chcesz go zbudować od A do Z",
      "Istniejąca aplikacja niedomaga — wydajność, UX albo tempo zmian",
      "Wewnętrzne operacje jadą na arkuszach i dobrej woli",
      "Masz pomysł i projekty graficzne, ale nie masz komu ich dowieźć na produkcję",
    ],
    deliver: [
      { n: "Product discovery i UX", d: "Od warsztatu do klikalnego prototypu — uzgodnione, zanim powstanie kosztowny kod." },
      { n: "Frontend i backend", d: "Jeden standard kodu: typowany, testowany, przechodzący code review, wdrażany na bieżąco." },
      { n: "E-commerce i płatności", d: "Od witryny przez checkout po ERP za nim — działające jako jeden przepływ." },
      { n: "API i integracje", d: "Twoja platforma czysto rozmawiająca z CRM, ERP i systemami partnerów." },
      { n: "Chmura i DevOps", d: "CI/CD, monitoring i infrastruktura, która skaluje się z realnym ruchem." },
      { n: "QA wbudowane", d: "Testowanie w każdej iteracji — nie osobna faza na końcu." },
    ],
    approach:
      "Projekty webowe zaczynam od warsztatu Discover i dostarczam w widocznych iteracjach — każda kończy się działającym demo. Patrzysz, jak produkt rośnie, i możesz zmienić kurs, póki zmiana jest tania.",
    relatedSlugs: ["public-sector-poland", "enterprise-30-years-in-production"],
    solutionSlugs: ["weterynaria", "kliniki-laboratoria"],
    slug: "platformy-webowe",
    metaTitle: "Rozwiązania webowe — calm_soft",
    metaDescription:
      "Portale, e-commerce, SaaS i narzędzia wewnętrzne. Projekt, architektura, kod i chmura prowadzone przez jedną osobę — nic nie ginie między dostawcami.",
    pageH1: "Platformy, portale i produkty — budowane, by skalować.",
    pageSections: [],
  },
  {
    id: "refactor",
    tone: "a",
    tag: "Refactor & rescue",
    headline: "Systemy legacy — drugie życie.",
    intro:
      "Od cudzego kodu większość woli trzymać się z daleka. Ja w niego wchodzę: najpierw uczciwy audyt, potem stabilizacja, potem modernizacja kawałek po kawałku — podczas gdy biznes cały czas pracuje na tym systemie. Jestem dziś jedynym architektem żywej platformy używanej w dwudziestu administracjach miejskich, zmienianej pod użytkownikami bez nieplanowanych przestojów.",
    fit: [
      "Wydania są wolne, ryzykowne i zależą od jednej osoby, która zna system",
      "Pierwotny zespół odszedł, a dokumentacja nigdy nie istniała",
      "Twój framework, baza albo platforma dobiegły końca wsparcia",
      "Wyceniono Ci pełny rewrite — i słusznie Cię to przeraża",
    ],
    deliver: [
      { n: "Audyt kodu i architektury", d: "Czytelny raport o tym, co naprawdę tam jest: ryzyka, koszty, opcje. Bez straszenia." },
      { n: "Najpierw stabilizacja", d: "Testy, CI/CD i monitoring wokół obecnego systemu, zanim cokolwiek zostanie przepisane." },
      { n: "Modernizacja przyrostowa", d: "Migracje w duchu strangler pattern: wymiana kawałek po kawałku, na produkcji." },
      { n: "Migracje i upgrade'y", d: "Frameworki, bazy i platformy przywrócone do wspieranych wersji." },
      { n: "Wydajność i bezpieczeństwo", d: "Wąskie gardła i wycieki naprawione przy okazji, skoro już tam jestem." },
    ],
    approach:
      "Rewrite'y wywracają się, bo zaczynają od zera — więc ja zaczynam od tego, co działa: system dalej zarabia, a ja wymieniam go od spodu. Tak system liczący dekady w produkcji stał się nowoczesną platformą webową w niecały rok — bez zatrzymywania biznesu.",
    relatedSlugs: ["enterprise-30-years-in-production", "public-sector-poland"],
    solutionSlugs: [],
    slug: "legacy",
    metaTitle: "Refactor & rescue — calm_soft",
    metaDescription:
      "Uczciwy audyt, stabilizacja, potem modernizacja kawałek po kawałku — podczas gdy biznes cały czas pracuje na tym systemie.",
    pageH1: "Systemy legacy — drugie życie.",
    pageSections: [],
  },
];

// Kierunek odwrotny (linia rozwiązania → usługa) jest wyprowadzany ze `services`, nigdy nie
// duplikowany jako pole na SolutionLine (2026-07-26 services-solutions crosslink design, spec §4).
export function getServiceForLine(lineSlug: SolutionLineSlug): Service | undefined {
  return services.find((s) => s.solutionSlugs.includes(lineSlug));
}

// Adresowanie usługi po stabilnym slugu (segment /uslugi/<slug>/), nigdy po indeksie tablicy —
// ta sama konwencja co getCaseBySlug/getDemoBySlug.
export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}

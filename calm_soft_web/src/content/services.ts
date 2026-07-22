import type { Service } from "./types";

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
  },
  {
    id: "automation",
    tone: "b",
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
  },
  {
    id: "web",
    tone: "a",
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
  },
];

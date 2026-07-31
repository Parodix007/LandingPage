import type { SolutionsContent, SolutionLine } from "./types";

// Treść /rozwiazania/ (2026-07-26 solutions restructure design + dodanie linii "integracje")
// — pięć linii produktowych na dwóch poziomach (branżowe / operacyjne), grupujące osiem
// klikalnych dem z demos.ts (było siedem). Dema adresowane przez stabilny `demoSlug`,
// rozwiązywany przez getDemoBySlug — taksonomia jest osobna od demos.ts i nie modyfikuje go.
// Kolejność grup i linii jest świadoma: operacyjne przed branżowymi, integracje →
// automatyzacje → migracje → weterynaria → kliniki-laboratoria.
export const solutions: SolutionsContent = {
  page: {
    mechanism: {
      heading: "Co jest ustalone, a co dopiero powstanie",
      body: [
        "Standard w tej branży to podpisanie umowy na coś, co obie strony wyobrażają sobie inaczej — i odkrycie tego w czwartym miesiącu. Tutaj zakres jest ustalony przed wyceną.",
        "Ustalone jest co budujemy — nie to, że jest już zbudowane. Makieta to kompletny projekt i przepływy: wszystkie ekrany, logika, obiegi, role. Aplikacja powstaje po Twojej decyzji: backend, dane, integracje, wdrożenie.",
        "Makieta zdejmuje z projektu niepewność, nie pracę. Dostajesz działający system — nie te ekrany podpięte pod nic.",
      ],
      noDiscoverLabel: "Czego przy tym nie potrzebujesz",
      noDiscover: "Warsztatu Discover. On służy ustaleniu, co produkt ma robić. Tu już to widzisz.",
    },
    paths: {
      heading: "Dwie drogi, obie z ceną ustaloną przed startem",
      asIs: {
        title: "Tak, jak widać",
        body: "Bierzesz zakres z makiety bez zmian. Cena stała, termin krótszy — nie ma czego ustalać.",
      },
      custom: {
        title: "Z dopasowaniem",
        body: "Startujemy od makiety, zmieniamy to, co Twoje: usługi, cennik, pola, integracje, wymogi Twojej praktyki. Wycena rośnie tylko o różnicę.",
      },
    },
    clickLabel: "Co przeklikasz teraz",
    audienceLabel: "Dla kogo",
    serviceLabel: "To część usługi",
    proposalLabel: "Propozycja rozwiązania",
  },
  groups: [
    {
      slug: "operacyjne",
      eyebrow: "Panele operacyjne",
      sub: "Punkt startu dla zespołu operacji albo IT — narzędzie do prowadzenia tego, co już działa.",
      tone: "accent2",
      lines: [
        {
          slug: "integracje",
          kicker: "Integracje",
          headline: "Stan w sklepie i stan w ERP to dwie różne liczby. Różnicę płacisz w reklamacjach.",
          intro: [
            "Gotowe platformy dowożą sprzedaż do granicy **ERP** i tam się zatrzymują — integrację z **Comarchem** dopina osobna firma, osobną umową, za osobne pieniądze. Rozliczasz się od zamówienia, więc rachunek rośnie razem ze sprzedażą, a odpowiedzialność za to, co się rozjechało, nie ma jednego adresu.",
            "Puls stoi po drugiej stronie tej granicy: pokazuje, co przeszło z kanału do ERP, co się zatrzymało i dlaczego. Wyjątki trafiają do **skrzynki decyzji** pogrupowane w **klasy błędów** — **brak kartoteki**, **niezmapowana forma płatności**, **stan ujemny**, **duplikat EAN** — a nie do logu, w którym trzeba szukać. Każde zamówienie ma **oś czasu od kanału do dokumentu w ERP**, a **KSeF** siedzi w środku, nie jest doklejony z boku.",
          ],
          items: [
            {
              demoSlug: "puls",
              text: "**Pulpit kanałów** ze **strumieniem zdarzeń**, **skrzynka decyzji** z realnymi **klasami błędów**, **oś czasu zamówienia** od kanału do **ERP**, **mapowanie pól** z **wersjonowaniem konfiguracji**, **KSeF** z **FA(3)**, trybem **offline24** i **UPO**, **widok per klient** dla dostawcy IT",
              openCta: "Otwórz demo ›",
            },
          ],
          audience:
            "**Sklepy i hurtownie** sprzedające w kilku kanałach na **Comarch ERP XL** albo **Optimie**, w których stany i ceny rozjeżdżają się szybciej, niż ktokolwiek nadąża je poprawiać. **Dostawcy IT i partnerzy Comarcha**, którzy prowadzą kilkanaście takich wdrożeń naraz i potrzebują jednego miejsca, żeby zobaczyć, które się dziś pali.",
          caveat: {
            label: "Bez niespodzianek",
            body: "Najdroższa część integracji z Allegro to nie zamówienia, tylko wystawianie ofert. Każda kategoria ma własny zestaw wymaganych parametrów, a wartości muszą pochodzić ze słownika Allegro — nie z pola tekstowego w kartotece ERP. Tego nie da się wygenerować automatem i trzeba to utrzymywać, bo parametry się zmieniają. Mówię o tym przy wycenie, nie w trzecim miesiącu.",
          },
        },
        {
          slug: "automatyzacje",
          kicker: "Automatyzacje",
          headline: "Twoje automatyzacje siedzą w czterech narzędziach. Nikt nie patrzy na wszystkie naraz.",
          intro: [
            "**Make**, **Zapier**, **n8n**, **Power Automate** — każde ma własny panel, własne logi i własny rachunek. Żadne nie pokazuje pozostałych. Kiedy przepływ cicho przestaje działać, dowiadujesz się od klienta, nie od systemu.",
            "Cadence to jeden widok ponad tym wszystkim: **lista przepływów ze statusami**, **historia uruchomień**, **podgląd wyników** — odczytana faktura z załącznika, wysłane podsumowanie, szkic odpowiedzi — i **alerty na wypadek awarii**.",
          ],
          items: [
            {
              demoSlug: "cadence",
              text: "**Lista automatyzacji** ze **statusami i filtrami**, **podgląd wyników uruchomień**, **historia uruchomień**, **alerty awarii** z **testem powiadomień**, **widok per klient**",
              openCta: "Otwórz demo ›",
            },
          ],
          audience:
            "**Firmy z automatyzacjami** w dwóch albo więcej narzędziach. **Agencje i software house’y**, które prowadzą automatyzacje dla wielu klientów i logują się dziś do kilkunastu paneli.",
          caveat: {
            label: "Bez niespodzianek",
            body: "Make i n8n udostępniają pełne API do historii uruchomień — te platformy Cadence czyta bezpośrednio. Zapier nie ma publicznego API do historii; tam potrzebny jest webhook wpięty w przepływ albo plan Enterprise. Mówię to przed wyceną, nie po wdrożeniu.",
          },
        },
        {
          slug: "migracje",
          kicker: "Migracje danych",
          headline: "Migracja bez konsoli to migracja na ślepo.",
          intro: [
            "Przenoszenie milionów plików to nie zadanie, które oddaje się w ciemno i czeka na telefon. AIRLIFT daje operatorowi to, czego naprawdę potrzebuje w trakcie: **postęp sesji na żywo**, **start, pauzę i wznowienie**, **checkpointy** z powrotem do dowolnego punktu, ciągłą **weryfikację sum kontrolnych**, **podgląd workerów** i przeszukiwalny **dziennik zdarzeń**.",
          ],
          items: [
            {
              demoSlug: "airlift",
              text: "**Postęp migracji i kontrola sesji**, **checkpointy** i **wznawianie od dowolnego punktu**, **ciągła weryfikacja integralności**, **podgląd i szczegóły workerów**, przeszukiwalny **dziennik zdarzeń**",
              openCta: "Otwórz demo ›",
            },
          ],
          audience:
            "**Firmy przed dużą migracją danych**, które nie chcą jej robić na ślepo. **Dostawcy IT**, którzy migracje prowadzą regularnie i muszą pokazać klientowi, co się dzieje.",
        },
      ],
    },
    {
      slug: "branzowe",
      eyebrow: "Rozwiązania branżowe",
      sub: "Punkt startu dla praktyki albo placówki — cały obieg zaprojektowany pod jedną branżę.",
      tone: "accent",
      lines: [
        {
          slug: "weterynaria",
          kicker: "Weterynaria",
          headline: "Dwie strony kliniki. Obie zaprojektowane.",
          intro: [
            "Opiekun zwierzęcia widzi stronę, na której sprawdzi **cenę z góry**, umówi wizytę w **pięciu krokach** i znajdzie **profil zdrowia** swojego pupila. Zespół widzi panel: **kalendarz wizyt**, **plan dnia**, grafik, **kartoteki klientów i pupili**, **szybkie umawianie** z recepcji.",
            "Projektowane razem, jako **jeden obieg** — nie dwa systemy zszyte na końcu. To zwykle różnica między „mamy stronę i mamy program” a „to działa”.",
          ],
          items: [
            {
              demoSlug: "merdi",
              text: "**Strona dla opiekuna**: **usługi z cenami**, **zespół**, umawianie w **pięciu krokach**, konto z **profilem zdrowia** pupila",
              openCta: "Otwórz demo dla opiekuna ›",
            },
            {
              demoSlug: "merdi-panel",
              text: "**Zaplecze zespołu**: **kalendarz**, **plan dnia**, **grafik**, **kartoteki**, **umawianie**",
              openCta: "Otwórz panel zespołu ›",
            },
          ],
          audience:
            "**Przychodnie i kliniki weterynaryjne**, które prowadzą wizyty w kalendarzu, a kartoteki w zeszycie, arkuszu albo w programie, z którego nie da się nic wyciągnąć.",
        },
        {
          slug: "kliniki-laboratoria",
          kicker: "Placówki medyczne i laboratoria",
          headline: "Trzy warianty tego samego problemu.",
          intro: [
            "Pacjent chce umówić się i zobaczyć wynik. Zespół chce **jednego miejsca** zamiast arkuszy i maili. Różnica jest w tym, czym jesteś — dlatego są **trzy punkty startu**.",
            "Primavita i VitaLab to front dla pacjenta. HealthLab to zaplecze. Można wziąć jedno albo spiąć oba końce.",
          ],
          items: [
            {
              demoSlug: "primavita",
              text: "**Klinika prywatna**: **wyszukiwarka lekarzy po specjalizacjach**, **przejrzysty cennik**, **pakiety opieki**, wyniki w **panelu pacjenta**",
              openCta: "Otwórz Primavita ›",
            },
            {
              demoSlug: "vitalab",
              text: "**Klinika z własnym laboratorium**: zamawianie badań w **pięciu krokach**, **porównanie badań i pakietów**, **punkty pobrań**, wszystko śledzone z **konta pacjenta**",
              openCta: "Otwórz VitaLab ›",
            },
            {
              demoSlug: "healthlab",
              text: "**Laboratorium od środka**: **kartoteki**, **przyjmowanie zleceń**, **wprowadzanie** i **kontrolowane wydawanie wyników**, **obieg każdej próbki**",
              openCta: "Otwórz HealthLab ›",
            },
          ],
          audience:
            "**Prywatne kliniki**, przychodnie i **laboratoria diagnostyczne**, w których zlecenia i wyniki krążą dziś mailem, telefonem i w arkuszu.",
          caveat: {
            label: "Bez niespodzianek",
            body: "Dane medyczne to dane szczególnej kategorii. Zanim cokolwiek wycenię, ustalamy, co wolno przechowywać, gdzie i kto ma do tego dostęp. Nie doklejam tego na końcu.",
          },
        },
      ],
    },
  ],
};

export const allSolutionLines: SolutionLine[] = solutions.groups.flatMap((g) => g.lines);

export const getSolutionLineBySlug = (slug: string) => allSolutionLines.find((l) => l.slug === slug);

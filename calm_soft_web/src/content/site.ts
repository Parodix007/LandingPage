import type { SiteContent } from "./types";

export const site: SiteContent = {
  name: "calm_soft",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@calmsoft.com",
  eyebrow: "Systemy centralne · Integracje · Automatyzacja · Ratowanie legacy",
  navCta: "Zacznij projekt",
  featuredCaseSlugs: [
    "public-sector-poland",
    "e-delivery-platform-nationwide",
    "localhost-academy",
  ],
  footerLinks: [
    { label: "Usługi", href: "/#services" },
    { label: "Realizacje", href: "/#cases" },
    { label: "Proces", href: "/#process" },
    { label: "Cennik", href: "/pricing/" },
    { label: "KSeF", href: "/#ksef" },
    { label: "Kontakt", href: "/#contact" },
    { label: "Ikona promocji: Freepik / Flaticon", href: "https://www.flaticon.com/free-icon/hot-sale_1685230" },
  ],
  hero: {
    code: {
      h1: "Spokojna strona oprogramowania.",
      lead: "Systemy klasy enterprise bez enterprise'owej dramy — jasny proces, uczciwe terminy i żadnych niespodzianek w czwartym miesiącu. Od pierwszej rozmowy do produkcji rozmawiasz z inżynierem, który pisze kod — dziś jedynym architektem platformy używanej w dwudziestu administracjach miejskich.",
      ctaPrimary: "Zacznij projekt",
      ctaPricing: "Sprawdź cennik ›",
      casesLabel: "Wybrane realizacje",
    },
    slider: {
      prevLabel: "Poprzednia realizacja",
      nextLabel: "Następna realizacja",
    },
  },
  about: {
    heading: "O mnie",
    // Brief #18: copy zatwierdzone przez właściciela („szyte na miarę", „pracy w korporacjach").
    short: "Nazywam się Sebastian Siarczyński. **Buduję systemy, szyte na miarę**. Specjalizuję się w platformach webowych, automatyzacjach, integracjach z ERP i ratowaniu legacy. Po prawie dekadzie pracy w korporacjach w kraju i za granicą pomogę Ci wprowadzić **rozwiązania klasy enterprise**, które oszczędzą **czas i pieniądze** — bez konieczności angażowania **własnego działu IT**.",
    long: [
      "Nazywam się Sebastian Siarczyński. Prowadzę calm_soft i tworzę **oprogramowanie szyte na miarę** — dopasowane do Twojego stylu pracy i realiów, w których działasz.",
      "Rozwiązuję codzienne i niecodzienne problemy, ułatwiam pracę i oszczędzam pieniądze za pomocą systemów skrojonych pod Twoje potrzeby. Dzięki temu oszczędzasz **czas i kapitał** firmy, a przy tym nie martwisz się o **dział techniczny**.",
      "Po prawie dekadzie w branży, pracy z największymi korporacjami w kraju i za granicą, chętnie pomogę również Tobie.",
      "Czy nie byłoby dobrym pomysłem wprowadzić u siebie **rozwiązania klasy enterprise**, które realnie pomogą w codziennej pracy?",
      // TODO(właściciel): podmienić przed publikacją — akapity placeholderowe do oceny wizualnej.
      "Projekty prowadzę spokojnie i po ludzku: decyzje zapadają bez pośpiechu, a o każdym kroku mówię z wyprzedzeniem. Wolę jasny zakres i jedną osobę odpowiedzialną za całość niż rozmytą komunikację.",
      "Zależy mi, żeby po rozmowie ze mną wiedziałeś dokładnie, co się teraz stanie — bez żargonu, bez pośpiechu i bez wrażenia, że projekt trafił do **czarnej skrzynki**. Tak buduję software, do którego chce się wracać.",
    ],
    photoAlt: "calm_soft — projektant i developer systemów webowych",
    // Brief #12 (spec 2026-11-07): dokładnie 2 fakty — decyzja właściciela (placeholderowe
    // „X" i „1 h" usunięte).
    stats: [
      { value: "8 lat", label: "doświadczenia" },
      { value: "15+", label: "systemów na produkcji" },
    ],
    // Copy wartości: pierwotnie zatwierdzone na makiecie wartosci-manifest-glify-v3 (spec 2026-11-07),
    // teksty skorygowane briefem #18.
    values: [
      { title: "Spokój", text: "Decyzje podejmowane są bez pośpiechu według tego co naprawdę przyniesie korzyść firmie. A nie to co ma tylko rozpocząć projekt, który będzie zmieniany w połowie drogi.", icon: "calm" },
      { title: "Jakość", text: "Nie oddaję kodu, którego nie chciałbym u siebie: testy, review i dokumentacja są częścią każdego wdrożenia.", icon: "quality" },
      { title: "Rzemiosło", text: "Najważniejsza jest warstwa, której nie widać: model danych, granice modułów, nazwy. To one mają wpływ na to, jak długo przeżyje system.", icon: "craft" },
      { title: "Partnerstwo", text: "Twój system prowadzę tak, jak prowadziłbym własny — nie wahając się powiedzieć „tego nie warto robić”.", icon: "partnership" },
    ],
    // Rzędy marek (brief #12, kafle/piguły marek, spec 2026-11-07). short (strona główna) =
    // statyczne piguły pod opisem; long (/o-mnie/) = kafle — komponent BrandTiles doda brief #13.
    // border/wash/glow/titleColor 1:1 z tabelą zatwierdzonych kolorów speca (RGB triplety → rgba);
    // logo pracodawców wyłącznie jako nazwy tekstowe + geometria w barwach (znak towarowy).
    experience: {
      label: "Doświadczenie zdobywałem między innymi w:",
      columns: 3,
      items: [
        {
          name: "Asseco",
          border: "rgba(0,174,232,.4)",
          chipBorder: "rgba(0,174,232,.55)",
          wash: "linear-gradient(135deg, rgba(0,110,146,.75), rgba(0,60,110,.6) 40%, rgba(15,19,53,.85) 75%, rgba(5,8,20,.9))",
          glow: "rgba(0,174,232,.28)",
        },
        {
          name: "Wunderman Thompson Technology",
          border: "rgba(159,254,255,.35)",
          chipBorder: "rgba(159,254,255,.5)",
          wash: "linear-gradient(135deg, rgba(28,52,54,.9), rgba(33,35,34,.95) 45%, rgba(18,20,20,.95) 75%, rgba(230,238,238,.14) 115%)",
          glow: "rgba(159,254,255,.28)",
          titleColor: "#e6fcfd",
        },
        {
          name: "Politechnika Wrocławska",
          border: "rgba(154,52,45,.55)",
          chipBorder: "rgba(154,52,45,.7)",
          wash: "linear-gradient(135deg, rgba(122,46,39,.78), rgba(90,36,32,.7) 40%, rgba(30,16,14,.88) 72%, rgba(180,154,94,.28) 112%)",
          glow: "rgba(154,52,45,.28)",
          titleColor: "#f7ece9",
        },
      ],
    },
    certifications: {
      label: "Certyfikaty:", // brief #18: „Certyfikacje:” → „Certyfikaty:”
      columns: 4,
      items: [
        {
          name: "Microsoft",
          border: "rgba(255,255,255,.16)",
          chipBorder: "rgba(255,255,255,.2)",
          wash: "linear-gradient(to right, rgba(16,18,20,.96) 40%, rgba(242,80,34,.10) 60%, rgba(127,186,0,.10) 72%, rgba(0,164,239,.12) 84%, rgba(255,185,0,.14))",
          glow: "rgba(255,185,0,.18)",
          mark: "microsoft",
        },
        {
          name: "Cisco",
          border: "rgba(27,160,215,.45)",
          chipBorder: "rgba(27,160,215,.6)",
          wash: "linear-gradient(135deg, rgba(27,160,215,.45), rgba(0,80,115,.65) 55%, rgba(6,18,26,.9))",
          glow: "rgba(27,160,215,.28)",
        },
        {
          name: "C++ Institute",
          border: "rgba(85,153,255,.4)",
          chipBorder: "rgba(85,153,255,.55)",
          wash: "linear-gradient(135deg, rgba(51,51,51,.9), rgba(85,153,255,.42) 50%, rgba(141,211,95,.34))",
          glow: "rgba(85,153,255,.28)",
        },
        {
          name: "LPI",
          border: "rgba(251,192,0,.45)",
          chipBorder: "rgba(251,192,0,.55)",
          wash: "linear-gradient(135deg, rgba(251,192,0,.42), rgba(150,114,10,.35) 45%, rgba(24,20,8,.92))",
          glow: "rgba(251,192,0,.26)",
          titleColor: "#f5edd9",
        },
      ],
    },
  },
  nav: {
    wordmarkAriaLabel: "calm_soft — wróć na górę",
    menuAriaLabel: "Menu",
  },
  ui: {
    modalClose: "Zamknij",
    goToDotPrefix: "Przejdź do: ",
  },
  sections: {
    services: {
      line1: "Cztery obszary.",
      line2: "Jeden inżynier odpowiedzialny za całość.",
      pricingCta: "Zobacz przejrzysty cennik ›",
      pricingPrompt: "Zastanawiasz się, ile kosztuje taki projekt?",
      sliderLabel: "Przegląd usług",
      sliderPrevLabel: "Poprzednia usługa",
      sliderNextLabel: "Następna usługa",
      overviewLabel: "Przegląd usługi",
      fitLabel: "Kiedy to właściwy wybór",
      deliverLabel: "Co dostarczam",
      approachLabel: "Jak to prowadzę",
      proofLabel: "Dowody z realizacji",
      readCaseCta: "Przeczytaj historię ›",
      cta: "Omówmy taki projekt ›",
      note: "Odpowiadam w ciągu godziny w dni robocze · NDA na życzenie.",
      solutionsLabel: "Rozwiązania z tego obszaru",
      detailsCta: "Zobacz szczegóły usługi ›",
    },
    process: {
      line1: "Od pomysłu do produkcji.",
      line2: "Spokojnie, krok po kroku.",
      prevLabel: "Poprzedni krok",
      nextLabel: "Następny krok",
    },
    cases: {
      line1: "Dowody, nie obietnice.",
      line2: "Praca, która działa na produkcji.",
      intro: [
        "Od automatyzacji zaplecza szkoły programowania w Lublinie po platformy działające w administracjach miejskich — te same standardy, inna skala.",
        "Wszystko poniżej działa na produkcji. Nie prototypy, nie piloty — żywe systemy, na których ludzie codziennie polegają.",
      ],
      footnote: "Tam, gdzie wymagają tego umowy o poufności, nazwy klientów pomijam. O szczegółach chętnie opowiem na rozmowie.",
      seeAllCta: "Zobacz wszystkie case studies ›",
      readCaseAriaPrefix: "Przeczytaj historię: ",
      calendly: {
        prompt: "Wolisz omówić swój projekt na żywo?",
        cta: "Umów bezpłatną rozmowę (30 min) ›",
      },
    },
    demos: {
      langChip: "Interfejs po angielsku",
      detailCta: "Zobacz szczegóły ›",
      liveCta: "Otwórz demo na żywo ›",
      techLegend: "Technologię wybierasz Ty",
      flowsLegend: "Kluczowe przepływy",
      desktopNote: "Panel back-office — zbudowany pod desktop, nieadaptowany do mobile.",
    },
  },
  modals: {
    caseNote: "Nazwy klientów pomijam tam, gdzie wymaga tego poufność — szczegóły chętnie na rozmowie.",
    demoNote: "Przeklikaj każdy ekran. To zakres, który wyceniam — nie działająca jeszcze aplikacja.",
  },
  contact: {
    heading: "Zbudujmy coś, co zostanie.",
    paragraph: "Opowiedz mi o swoim projekcie. Odpisze Ci inżynier, który wykonałby tę pracę — nie skrypt sprzedażowy.",
    checks: [
      "Odpowiedź w ciągu godziny w dni robocze — ode mnie, nie z autorespondera",
      "NDA na życzenie — Twój pomysł zostaje Twój",
      "Działam z Polski, w całej UE — na miejscu lub zdalnie",
    ],
    talk: {
      title: "Wolisz najpierw porozmawiać?",
      body: "Umów bezpłatną, 30-minutową rozmowę ze mną. Bez pitchu i slajdów — konkretna rozmowa o tym, co budujesz.",
      cta: "Umów bezpłatną rozmowę (30 min) ›",
    },
    form: {
      title: "Opowiedz mi o projekcie",
      intro: "Dwa pola i jedno zdanie w zupełności wystarczą na start. Odpowiadam w ciągu godziny w dni robocze.",
      fields: {
        name: "Imię i nazwisko",
        email: "E-mail",
        message: "Co chcesz zbudować albo naprawić?",
      },
      messagePlaceholder: "Wystarczy zdanie lub dwa. Jaka jest sytuacja i co by znaczyło „rozwiązane\"?",
      submit: "Wyślij do mnie",
      submitting: "Wysyłam…",
      fieldErrors: {
        name: "Podaj swoje imię.",
        emailRequired: "Podaj adres e-mail.",
        emailInvalid: "Podaj poprawny adres e-mail.",
        message: "Napisz choć zdanie o projekcie.",
      },
      submitError: "Coś poszło nie tak i wiadomość nie została wysłana. Spróbuj ponownie — albo napisz do mnie bezpośrednio mailem.",
      finePrint: "Odpowiadam w ciągu godziny w dni robocze · NDA na życzenie",
      success: {
        heading: "Wysłane.",
        paragraph: "Dzięki — to już wystarczy, żebym odpisał. Chcesz przyspieszyć? Możesz dorzucić kilka opcjonalnych szczegółów:",
        again: "Wyślij kolejne zapytanie ›",
        details: {
          areaLegend: "Który obszar najbliżej?",
          areaOptions: [
            { id: "core", label: "Systemy centralne" },
            { id: "automation", label: "Automatyzacja" },
            { id: "rescue", label: "Ratowanie legacy" },
            { id: "web", label: "Platforma webowa" },
            { id: "not-sure", label: "Jeszcze nie wiem" },
          ],
          budgetLegend: "Orientacyjny budżet?",
          budgetOptions: [
            { id: "under-10k", label: "Do 10 tys. zł" },
            { id: "10-30k", label: "10–30 tys. zł" },
            { id: "30-80k", label: "30–80 tys. zł" },
            { id: "80k-plus", label: "80 tys. zł +" },
            { id: "no-idea", label: "Jeszcze nie wiem" },
          ],
          phoneLabel: "Telefon — jeśli wolisz, żebym zadzwonił (opcjonalnie)",
          phoneInvalid: "Podaj poprawny numer telefonu albo zostaw pole puste.",
          submit: "Dodaj szczegóły ›",
          submitting: "Wysyłam…",
          skip: "Albo po prostu czekaj na mój e-mail — jedno i drugie działa.",
          done: "Dzięki, mam wszystko. Odezwę się wkrótce.",
          error: "Nie udało się wysłać szczegółów — ale spokojnie, Twoje zapytanie już do mnie dotarło.",
        },
      },
    },
  },
  work: {
    metaTitle: "Case studies — calm_soft",
    metaDescription:
      "Wszystkie realizacje calm_soft w jednym miejscu — ratowanie legacy, platformy sektora publicznego, migracja 2,5 mln plików i automatyzacje. Każda z liczbami.",
    heading: { line1: "Każdy projekt,", line2: "z liczbami." },
    lead: "Wszystkie realizacje w jednym miejscu — prawdziwe systemy, prawdziwa skala i liczby, które obronię na rozmowie.",
    calendly: {
      prompt: "Widzisz coś bliskiego Twojemu projektowi?",
      cta: "Umów bezpłatną rozmowę (30 min) ›",
    },
    startLabel: "Zacznij projekt ›",
  },
  notFound: {
    heading: "Nic tu nie ma.",
    text: "Ta strona nie istnieje — ale Twój projekt może.",
    back: "Wróć na stronę główną ›",
  },
  consent: {
    text: "Google Analytics pomaga mi mierzyć skuteczność strony i reklam. Te cookies uruchomię tylko za Twoją zgodą.",
    accept: "Akceptuję",
    decline: "Odrzucam",
    settingsLabel: "Ustawienia cookies",
  },
};

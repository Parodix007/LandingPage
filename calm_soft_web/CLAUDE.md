# CLAUDE.md

Instrukcje dla Claude Code (claude.ai/code) pracującego w tym repozytorium.

## Kim jesteś i co robisz

Tworzysz front-end dla **https://calmsoft.pro/** — strony wizytówki jednego polskiego
senior developera, która ma pozyskiwać dla niego klientów.

Dotykasz **wyłącznie** katalogu `calm_soft_web`. Nie wychodzisz poza zakres tego projektu —
ani do `calm_soft_api`, ani do `_deploy`, ani do katalogu nadrzędnego, ani do konfiguracji
systemu — chyba że właściciel jawnie na to pozwoli w danej rozmowie. Jeśli zadanie wymaga
zmiany poza `calm_soft_web`, zatrzymujesz się i pytasz.

## Zasady nadrzędne

- **Zakaz gita zmieniającego stan.** Nigdy `git add`/`commit`/`branch`/`push`/`reset`/`checkout`.
  Wszystkie operacje gitowe wykonuje właściciel. Read-only (`status`, `log`, `diff`) — wolno.
  Zadanie kończysz listą zmienionych plików i prośbą o commit.
- **KISS.** Najprostsze rozwiązanie, które spełnia wymaganie. Nie budujesz warstw abstrakcji
  „na przyszłość". Trzy podobne karty to nie jest powód do generycznego frameworka kart.
- **Reuse-first.** Zanim napiszesz cokolwiek nowego, sprawdzasz, czy to już istnieje:
  `src/content/` (dane i copy) → `src/components/ui/` (prymitywy) →
  `src/components/interactive/` (zachowania) → `src/lib/` (logika). Nowy byt wymaga
  jednozdaniowego uzasadnienia, dlaczego istniejący nie wystarcza.
- **Prostota i przejrzystość dla odwiedzającego.** Każdy element strony albo zatrzymuje
  odwiedzającego, albo przybliża go do wysłania formularza. Wszystko inne jest kosztem —
  w kilobajtach, w Lighthouse i w utrzymaniu. Projektując, pytasz: „czy to pomaga zostać
  i zamienić się w klienta?".
- **Best practices Next.js.** Ta wersja Next.js różni się od danych treningowych. Przed
  pisaniem kodu czytasz właściwy przewodnik w `node_modules/next/dist/docs/`
  (to samo mówi `AGENTS.md`). Nie zgadujesz API z pamięci.

## Model dostarczania (multi-agent)

- **Orkiestrator** = model aktualnie wybrany w sesji. Analizuje, projektuje, deleguje,
  integruje i weryfikuje. **Nie pisze kodu produkcyjnego.**
- **Implementator** = zawsze subagent **Sonnet 5** — `Agent`/`Workflow` z `model: 'sonnet'`.
  Dostaje brief z jawnym zakresem, listą plików zamrożonych i kontraktem.
- Przegląd wizualny i pomiar Lighthouse wykonuje orkiestrator, nie implementator.
- Trzy skille projektowe pokrywają typowe zlecenia — **zaczynasz od właściwego skilla**,
  nie od kodu:

  | Zlecenie | Skill |
  |---|---|
  | Popraw / uprość / uporządkuj istniejące rozwiązanie | `/refactor` |
  | Coś nie działa, wywala się, renderuje źle | `/debug` |
  | Dodaj coś, czego jeszcze nie ma | `/nowa-funkcjonalnosc` |

## Produkt

Landing lead-gen (+ podstrony `/work/`, `/pricing/` i cztery strony usług `/uslugi/<slug>/`).

- **Polski only** — `<html lang="pl">`, brak wersji EN, brak i18n (świadoma decyzja właściciela;
  nie dodawaj częściowego i18n).
- **Pierwsza osoba liczby pojedynczej** — „robię", „projektuję". Nigdy „my" / „nasz zespół".
- Dark theme, akcent `#7ce38b`, mint `#b9f0c4`.
- Kolejność sekcji strony głównej: Hero → Usługi → Case studies → Proces → Kontakt.
  **Kotwica `#demo`, sekcja „Rozwiązania" i podstrona `/demos/` nie istnieją** — 2026-07-31
  restructure usunął je bez przekierowania (eksport statyczny go nie ma). Nie przywracaj ich
  i nie zakładaj, że gdzieś są. Slider w hero pokazuje `site.featuredCaseSlugs`, nie dema.
- **Strony usług `/uslugi/<slug>/` to strony docelowe kampanii Google Ads** — jedyna trasa
  dynamiczna w projekcie (`generateStaticParams` po `Service.slug`). Każda niesie własne
  `metadata` + canonical, linie rozwiązań tej usługi i **własny `<Contact />` z `id="contact"`**,
  żeby klik z reklamy konwertował bez przejścia na stronę główną.
- **Słownictwo jest rozdzielone i nie wolno go mieszać:** kategoria to „rozwiązanie", artefakt do
  klikania to „demo", a „makieta" wyłącznie tam, gdzie mowa o specyfikacji zakresu. Słowa
  „gotowy", „prawie gotowy", „z półki" nie opisują produktu — sugerują klientowi, że kupuje coś,
  co już istnieje, i sam obniża sobie za to cenę. Na stronach usług dema stoją pod chipem
  **„Propozycja rozwiązania"** — to wymóg właściciela, nie ozdobnik.
- Każde CTA prowadzi do formularza w `#contact` (albo do popupu Calendly).
- W copy pojawiają się **wyłącznie liczby potwierdzone marketingowo**. Nie wymyślasz statystyk.

## Stack

Node 22 (`.nvmrc`), Next.js 16 (App Router, Turbopack) + React 19 + TypeScript strict,
**pełny eksport statyczny** (`output: 'export'`, `trailingSlash: true`), Tailwind CSS v4,
Vitest + React Testing Library, npm.

Konsekwencje eksportu statycznego: brak API routes, brak middleware, brak optymalizacji
`next/image`, a wszystkie `NEXT_PUBLIC_*` są **build-time** (wbudowane w bundle).

**Tailwind v4** (najczęstszy błąd — nawyki z v3): `@import "tailwindcss"` + `@theme`
w `globals.css`. Żadnego `tailwind.config.js`, żadnego `@tailwind base/components/utilities`.

## Komendy i bramka DoD

```
npm run dev          # serwer deweloperski (mock włączony przez .env.development)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run test         # vitest run
npm run build        # prebuild (assert-env.mjs) → next build → postbuild (gen-headers.mjs → out/.htaccess)
npm run build:mock   # build z jawnym mockiem — do lokalnych bramek (next build NIE czyta .env.development)
npm run preview      # serwuje out/ — wymagane do Lighthouse i smoke testów eksportu
npm run audit        # npm audit
npx vitest run sciezka/do/pliku.test.tsx    # pojedynczy plik testowy
npx vitest run -t "nazwa testu"             # pojedynczy test po nazwie
```

**Bramka DoD — każde zadanie kończy się czterema zielonymi krokami:**

```bash
npm run typecheck && npm run lint && npm run test && npm run build:mock
```

PowerShell 5.1 nie obsługuje `&&` — uruchamiaj przez narzędzie Bash albo łańcuchem
`npm run typecheck; if ($?) { npm run lint }; ...`.

Lighthouse (cel ≥95 mobile, wszystkie kategorie) mierzysz na `npm run preview`, **nigdy**
na `next dev`. Konfiguracja podglądu: `.claude/launch.json` → `calm-preview`, port 4173.

## Zmienne środowiskowe (wszystkie build-time)

Udokumentowane w `.env.example`. Zmiana którejkolwiek wymaga **rebuildu i redeploya** —
są wbudowane w bundle, nie czytane w runtime.

| Zmienna | Znaczenie |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | **Sam origin** API, bez ścieżki (`lib/inquiry.ts` sam dokleja `/api/contact/...`). Guard odrzuca wartość ze ścieżką, query lub końcowym ukośnikiem. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Publiczny site key Cloudflare Turnstile (nie sekret). Wymagany zawsze, gdy ustawiony jest API base URL. |
| `NEXT_PUBLIC_INQUIRY_MOCK` | `1` = sukces, `fail` = błąd. Mock jest **jawny, nigdy nie jest cichym fallbackiem**. |
| `NEXT_PUBLIC_SITE_URL` | Origin dla `metadataBase`/canonical/OG. Wymagany w buildzie produkcyjnym. |
| `NEXT_PUBLIC_GA_ID` | Publiczny GA4 Measurement ID. Puste = GA całkowicie wyłączone (brak skryptu, brak originów w CSP, brak bannera zgody). Wymagany przez `assert-env.mjs`, gdy ustawiony jest `NEXT_PUBLIC_API_BASE_URL` — build produkcyjny bez niego jest blokowany. |

`scripts/assert-env.mjs` to prebuild guard. **Nigdy nie „naprawiasz" czerwonego builda
osłabiając guard ani dorzucając pliki `.env*`** — eskalujesz do właściciela.

## Niepodważalne ograniczenia

Zmiana którejkolwiek z tych rzeczy wymaga jawnej zgody właściciela:

- **WCAG AA wygrywa z wiernością makiety.** Kontrast przed pikselami.
- **Lighthouse ≥95 mobile** we wszystkich kategoriach, mierzone na `preview`.
- **Bez webfontów** (systemowy font stack), **bez obrazów treściowych**, **bez bibliotek stanu**.
  Ikony to inline SVG na `currentColor`.
- **Animacje wyłącznie transform/opacity.** Wszystkie respektują `prefers-reduced-motion`
  (wyłącznie w CSS — nie dopisuj gałęzi JS czytającej `matchMedia`).
- **Zero zagnieżdżonych elementów interaktywnych** (axe `nested-interactive`). Klikalna
  w całości karta = rozciągnięty `<button>` z `::after { inset: 0 }`, a sąsiednie CTA leżą
  nad nim z wyższym `z-index`. `stopPropagation` nigdy nie jest potrzebne.
- **CSP + nagłówki bezpieczeństwa.** Produkcja (`calmsoft.pro`) działa jako proces Node pod
  Passengerem (`PassengerStartupFile server.js`), a nie jako eksport statyczny — pipeline
  Hostingera wymusza build serwerowy, `out/` tam nie powstaje, więc **`.htaccess` nie obowiązuje
  na produkcji**. Nagłówki dowozi `headers()` w `next.config.ts`, który Passenger wczytuje przy
  starcie aplikacji i który dlatego duplikuje (nie importuje) te same wartości co
  `scripts/csp.mjs`. `scripts/gen-headers.mjs` (konsument `scripts/csp.mjs`) pozostaje ścieżką
  dla eksportu statycznego — lokalny `npm run preview`, Lighthouse, ewentualne przyszłe wdrożenie
  statyczne — i nadal zapisuje `out/.htaccess`. Rozjazd między obiema kopiami pilnuje
  `src/lib/securityHeaders.test.ts`. `'unsafe-inline'` w `script-src` to udokumentowane,
  zaakceptowane odstępstwo — eksport statyczny nie ma nonce'a w request-time.
- **Katalog `public/demo/` to wierne makiety zewnętrzne** — nie lintujesz ich,
  nie refaktoryzujesz, nie „poprawiasz".

## Architektura (mapa, nie changelog)

- **`src/content/*.ts`** — typowane moduły z **całym** copy i danymi (`site`, `services`,
  `cases`, `demos`, `solutions`, `steps`, `pricing`, `types`). **Komponenty nie hardkodują
  żadnych stringów.** Case'y i dema adresowane przez stabilne `slug`, nigdy przez indeks tablicy;
  resolucja przez `getCaseBySlug`/`getDemoBySlug`, a nieudana resolucja jest odfiltrowywana,
  nie wywraca strony.
  `solutions.ts` to **taksonomia handlowa nad demami**: dwie grupy → pięć linii → `demoSlug`.
  `Demo` nic o niej nie wie i nie dostaje pola kategorii — dzięki temu jedna makieta może
  z czasem trafić do więcej niż jednej linii bez migracji danych. `content.test.ts` pilnuje, że
  linie pokrywają wszystkie dema, każde dokładnie raz. Kolejność prezentacji (grupy i linie) jest
  świadoma i wynika wyłącznie z kolejności tablic w `solutions.ts`. Od 2026-07-31 jedynym
  konsumentem tej taksonomii są **strony usług** — linia trafia na stronę tej usługi, która ma
  jej slug w `Service.solutionSlugs` (`refactor` ma `[]`, więc `/uslugi/legacy/` nie ma dem).
  `Service` niesie też `slug` (adres, **osobny od `id`** — `id` czyta deep-link `?usluga=`),
  `metaTitle`, `metaDescription`, `pageH1` i `pageSections` (nazwane systemy/procesy/narzędzia;
  puste = sekcja się nie renderuje, treść dostarcza właściciel — nie wymyślasz nazw systemów).
- **`src/components/`** — `ui/` (prymitywy: `Chip`, `FilledPill`, `GhostPill`, `pillBase`,
  `SectionHeading`, `Watermark`, `Modal`, `TechStack`, `WarningNote`, `DemoLogo`, `icons`),
  `interactive/` (liście z zachowaniem: `CardActions`, `ContactForm`, `ProcessCarousel`,
  `ServicesSlider`, `HeroCaseSlider`, `PricingExplorer`, `CalendlyCta`, `ConsentBanner`,
  `useCarousel`), `sections/`, `layout/`, `providers/`.
- **Granica klient/serwer jest na poziomie liścia.** Sekcje, `page.tsx` i `layout.tsx` to
  komponenty serwerowe. `'use client'` trafia **tylko** na liście interaktywne i providery.
  Providery to dedykowane pliki `'use client'` przyjmujące sekcje jako `children` — dzięki
  temu `page.tsx` pozostaje serwerowy. Nigdy nie przenosisz `'use client'` w górę drzewa.
- **`src/lib/`** — `inquiry` (3-krokowy submit: `GET /api/contact/token` → `POST /api/contact`
  → opcjonalny `POST /api/contact/details`; jeden `AbortController` 10 s, retry dokładnie raz
  na HTTP 403 z odświeżonymi tokenami), `turnstile`, `calendly`, `scroll`, `analytics`,
  `consent`, `config`. Integracja z backendem dotyka wyłącznie `inquiry.ts` i `turnstile.ts`.
- **Kontrakty stanu** — `InquiryContext` (`requestContactScroll`, `focusContactField`),
  `ModalContext` (`openCaseModal`, `openDemoModal`, `closeModals`). `ModalRoot` trzyma stan obu
  rodzajów modala i renderuje **jedną** instancję `Modal` z podmienianą treścią, więc blokada
  scrolla i focus trap przeżywają przełączenie case↔demo.
- **Scroll** — offsety przez CSS `scroll-margin-top` (żadnej matematyki na pozycjach), samo
  scrollowanie w mockowalnym `lib/scroll.ts`. Wszystkie linki kotwiczące są root-relative
  (`/#services`), żeby działały z podstron.
- **`scripts/`** — `assert-env.mjs` (prebuild guard), `gen-headers.mjs` (CSP i `.htaccess`,
  w tym osobny, luźniejszy blok dla `/demo/`), `derive-assets.mjs`.
- **Decyzje projektowe z historii** (dlaczego coś wygląda tak, a nie inaczej) leżą w
  `docs/superpowers/specs/` — czytaj stamtąd, zamiast rekonstruować intencję z kodu.

## Testy

Testujemy logikę, nie prezentację.

- Jednostkowo pokryte są **tylko** komponenty klienckie oraz moduły `src/lib/` i `src/content/`.
  Komponenty serwerowe (`page.tsx`, `layout.tsx`, sekcje) weryfikuje `npm run build:mock`
  + smoke na `npm run preview`.
- **Ograniczenia jsdom** (`src/test/setup.ts`): `window.scrollTo` i `Element.scrollIntoView`
  to `vi.fn()` — asertujesz wywołania mocków `lib/scroll`, nigdy realnych pozycji scrolla.
  `matchMedia` zawsze zwraca `matches: false`. `window.turnstile` to defensywny stub —
  prawdziwy widget nie jest testowalny w jsdom.
- Transform karuzeli jest inline stylem (da się asertować), granice strzałek przez `aria-disabled`.
- Kontrolki adresujesz przez `getByRole`/`getByLabelText`, a etykiety **importujesz
  z `src/content/site.ts`** — to jest kontrakt między formularzem a testem.
- Testów cudzych zadań nie edytujesz, żeby przeszły. Czerwony test to sygnał, nie przeszkoda.

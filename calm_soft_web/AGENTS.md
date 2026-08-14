# AGENTS.md

Instrukcje dla Codex pracującego w repozytorium `calm_soft_web`.

## Rola i zakres

Twórz front-end dla https://calmsoft.pro/ — polskiej strony lead-generation jednego senior developera.
Pracuj wyłącznie w katalogu `calm_soft_web`. Nie zmieniaj `calm_soft_api`, `_deploy`, katalogu
nadrzędnego ani konfiguracji systemu bez jawnej zgody właściciela.

## Zasady nadrzędne

- Nie wykonuj operacji Git zmieniających stan: `add`, `commit`, `branch`, `push`, `reset`,
  `checkout`, `merge`, `rebase`, `stash`. Operacje read-only (`status`, `log`, `diff`, `show`) są dozwolone.
- Stosuj KISS i reuse-first. Przed utworzeniem nowego bytu sprawdź kolejno `src/content/`,
  `src/components/ui/`, `src/components/interactive/` i `src/lib/`.
- Nie rozszerzaj zakresu „przy okazji”. Zmiana ma być najmniejsza, która spełnia kontrakt zadania.
- Każdy element interfejsu ma pomagać zatrzymać odwiedzającego albo doprowadzić go do formularza.
- Ta wersja Next.js ma breaking changes. Przed pisaniem kodu odczytaj odpowiedni przewodnik z
  `node_modules/next/dist/docs/`; nie zgaduj API z pamięci i respektuj deprecations.
- Nie osłabiaj `scripts/assert-env.mjs`, testów, CSP ani innych bramek tylko po to, aby uzyskać zieleń.

## Routing do workflowów

Zacznij od właściwego repozytoryjnego skilla:

| Rodzaj zlecenia | Skill |
|---|---|
| Coś nie działa, test lub build jest czerwony, render lub integracja jest błędna | `$debug` |
| Istniejący kod ma być uproszczony lub uporządkowany bez zmiany zachowania | `$refactor` |
| Ma powstać nowe zachowanie, pole, sekcja, podstrona, dane lub integracja | `$nowa-funkcjonalnosc` |

Jeżeli wybrana klasyfikacja była błędna, zatrzymaj implementację i przełącz workflow. Nie łącz
naprawy, refaktoru i nowej funkcji w jednym zadaniu bez zgody właściciela.

## Model dostarczania

- Agent główny jest orkiestratorem: analizuje, projektuje, przygotowuje brief, deleguje, integruje,
  wykonuje przegląd diffu i weryfikuje rezultat. Nie pisze kodu produkcyjnego.
- Kod produkcyjny zawsze deleguj do projektowego subagenta `implementer` z
  `.codex/agents/implementer.toml`.
- Brief dla implementatora musi podawać cel i kryterium akceptacji, dozwolone pliki, zamrożone
  pliki, kontrakt, niezmienniki oraz testy do wykonania.
- Agent główny wykonuje końcowy przegląd wizualny, smoke na eksporcie i Lighthouse.
- Deleguj równolegle tylko niezależne zadania o rozłącznych plikach i ustalonym kontrakcie.

## Produkt i copy

- Strona jest wyłącznie po polsku: `<html lang="pl">`, bez i18n i wersji angielskiej.
- Pisz w pierwszej osobie liczby pojedynczej („robię”, „projektuję”), nigdy „my” lub „nasz zespół”.
- Dark theme; akcent `#7ce38b`, mint `#b9f0c4`.
- Strona główna: Hero → Usługi → Case studies → Proces → Kontakt.
- Nie przywracaj `#demo`, sekcji „Rozwiązania” ani `/demos/`. Hero używa `site.featuredCaseSlugs`.
- `/uslugi/<slug>/` to landing pages Google Ads. Każda ma własne metadata, canonical i `<Contact id="contact">`.
- Rozróżniaj „rozwiązanie”, „demo” i „makietę”. Na stronach usług demo ma chip
  „Propozycja rozwiązania”. Nie opisuj produktu jako „gotowy”, „prawie gotowy” lub „z półki”.
- Wszystkie CTA prowadzą do `#contact` albo Calendly.
- Używaj wyłącznie liczb potwierdzonych marketingowo. Nie wymyślaj opinii, nazwisk, firm,
  referencji, ocen, logotypów ani statystyk.
- Całe copy i dane przechowuj w `src/content/*.ts`. Nie hardkoduj polskich stringów w TSX.

## Stack i konsekwencje

- Node 22, Next.js 16 App Router/Turbopack, React 19, TypeScript strict, Tailwind CSS v4,
  Vitest + React Testing Library, npm.
- Projekt ma pełny eksport statyczny (`output: 'export'`, `trailingSlash: true`). Nie dodawaj API
  routes, middleware ani runtime-only zachowań. Wszystkie `NEXT_PUBLIC_*` są build-time.
- Tailwind v4 używa `@import "tailwindcss"` i `@theme` w `globals.css`. Nie dodawaj
  `tailwind.config.js` ani dyrektyw Tailwind v3.
- Produkcja na Hostingerze działa jako proces Node/Passenger, dlatego `headers()` w
  `next.config.ts` jest produkcyjną ścieżką nagłówków. `scripts/gen-headers.mjs` i `out/.htaccess`
  pozostają ścieżką eksportu statycznego. Synchronizację sprawdza `securityHeaders.test.ts`.

## Niepodważalne ograniczenia

Zmiana któregokolwiek punktu wymaga jawnej zgody właściciela:

- WCAG AA wygrywa z wiernością makiety; Lighthouse mobile ≥95 we wszystkich kategoriach.
- Bez webfontów, obrazów treściowych i bibliotek stanu. Ikony to inline SVG na `currentColor`.
- Animacje wyłącznie przez `transform` i `opacity`, z CSS `prefers-reduced-motion`.
- Zero zagnieżdżonych elementów interaktywnych. Klikalna karta używa rozciągniętego elementu
  z `::after { inset: 0 }`; nie rozwiązuj problemu przez `stopPropagation`.
- Nie zmieniaj zaakceptowanego `'unsafe-inline'` w CSP bez jawnego zadania.
- Nie lintuj, nie refaktoryzuj i nie „poprawiaj” wiernych makiet w `public/demo/`.

## Mapa architektury

- `src/content/*.ts`: całe copy i typowane dane. Case studies i dema adresuj przez stabilne `slug`,
  rozwiązuj przez `getCaseBySlug`/`getDemoBySlug`, a brakujące wpisy odfiltrowuj.
- `src/components/ui/`: prymitywy (`Chip`, `FilledPill`, `GhostPill`, `pillBase`,
  `SectionHeading`, `Watermark`, `Modal`, `TechStack`, `WarningNote`, `DemoLogo`, `icons`).
- `src/components/interactive/`: liście klienckie i zachowania (`CardActions`, `ContactForm`,
  karuzele, Calendly, consent i `useCarousel`).
- `src/components/sections/`, `app/*/page.tsx` i `layout.tsx` pozostają komponentami serwerowymi.
  `'use client'` umieszczaj wyłącznie na liściach i dedykowanych providerach.
- `src/lib/`: logika integracji i konfiguracji. Backend formularza dotyka wyłącznie
  `inquiry.ts` i `turnstile.ts`.
- Scroll realizuj przez `scroll-margin-top` i `lib/scroll.ts`; linki kotwiczące są root-relative.
- Decyzje historyczne czytaj w `docs/superpowers/specs/`; nazwa katalogu nie oznacza zależności
  od zewnętrznego skilla.

## Zmienne środowiskowe

- Kontrakt zmiennych opisuje `.env.example`; każda zmiana wymaga rebuildu.
- `NEXT_PUBLIC_API_BASE_URL` jest originem bez ścieżki i końcowego ukośnika.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` jest wymagany razem z API base URL.
- `NEXT_PUBLIC_INQUIRY_MOCK`: `1` oznacza sukces, `fail` błąd; mock nigdy nie jest fallbackiem.
- `NEXT_PUBLIC_SITE_URL` zasila metadata/canonical/OG.
- Pusty `NEXT_PUBLIC_GA_ID` całkowicie wyłącza GA.
- Nie dodawaj ani nie edytuj `.env*` i nie osłabiaj guarda bez zgody właściciela.

## Testy i runtime

- Testy jednostkowe obejmują komponenty klienckie, `src/lib/` i `src/content/`.
- Komponenty serwerowe weryfikuj przez `npm run build:mock` oraz smoke na `npm run preview`.
- W jsdom `scrollTo` i `scrollIntoView` są mockami, `matchMedia` zwraca `false`, a Turnstile jest
  stubem. Nie udawaj realnego layoutu w teście jednostkowym.
- Kontrolki adresuj przez role lub label; etykiety formularza importuj z `src/content/site.ts`.
- Nie edytuj istniejących testów tylko po to, aby dopasować je do regresji.

## Komendy i Definition of Done

```text
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build:mock
npm run preview
npm run audit
```

Każde zadanie zmieniające repo kończ pełną bramką:

```text
npm run typecheck
npm run lint
npm run test
npm run build:mock
```

Na PowerShell uruchamiaj kroki sekwencyjnie i przerwij po pierwszym błędzie. Lighthouse mierz na
`npm run preview` na porcie 4173, nigdy na `next dev`.

## Zamknięcie zadania

Podaj listę zmienionych plików, wyniki weryfikacji i znane ograniczenia. Nie wykonuj commita;
poproś właściciela o przejrzenie zmian i commit.

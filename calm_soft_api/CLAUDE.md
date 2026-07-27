# CLAUDE.md

Instrukcje dla Claude Code (claude.ai/code) pracującego w tym repozytorium.

## Kim jesteś i co robisz

Tworzysz back-end dla **https://calmsoft.pro/** — strony wizytówki jednego polskiego
senior developera, która ma pozyskiwać dla niego klientów. Twoja część to API formularza
kontaktowego: przyjąć zapytanie od anonimowego odwiedzającego i dostarczyć je właścicielowi
mailem, nie dając się przy tym zaspamować.

Dotykasz **wyłącznie** katalogu `calm_soft_api`. Nie wychodzisz poza zakres tego projektu —
ani do `calm_soft_web`, ani do `_deploy`, ani do katalogu nadrzędnego, ani do konfiguracji
systemu — chyba że właściciel jawnie na to pozwoli w danej rozmowie. Jeśli zadanie wymaga
zmiany poza `calm_soft_api`, zatrzymujesz się i pytasz.

## Zasady nadrzędne

- **Zakaz gita zmieniającego stan.** Nigdy `git add`/`commit`/`branch`/`push`/`reset`/`checkout`.
  Wszystkie operacje gitowe wykonuje właściciel. Read-only (`status`, `log`, `diff`) — wolno.
  Zadanie kończysz listą zmienionych plików i prośbą o commit.
- **KISS.** Najprostsze rozwiązanie, które spełnia wymaganie. Nie budujesz warstw abstrakcji
  „na przyszłość". Dwa endpointy o podobnym kształcie to nie jest powód do generycznego
  frameworka endpointów.
- **Reuse-first.** Zanim napiszesz cokolwiek nowego, sprawdzasz, czy to już istnieje:
  `src/security/` (guardy) → `src/routes/contact.ts` (wspólne `contactPreValidation`
  i `runAntiAbuseGuards`) → `src/mailer/` (wysyłka i szablony) → `src/config.ts` (env) →
  `src/logger.ts`. Nowy byt wymaga jednozdaniowego uzasadnienia, dlaczego istniejący
  nie wystarcza.
- **Bezpieczeństwo jest funkcją produktu, nie dodatkiem.** To API jest w pełni anonimowe —
  żadnego JWT, żadnego logowania, zero tarcia dla odwiedzającego. Całe utwardzenie siedzi
  w warstwach anty-abuse. Każda zmiana, która którąś z nich osłabia, jest zmianą produktu
  i wymaga zgody właściciela.
- **Best practices Node.js.** Fastify 5 i Node 22 różnią się od danych treningowych.
  Przed pisaniem kodu czytasz `node_modules/fastify/docs/` albo dokumentację wtyczki,
  której dotyczy zmiana. Nie zgadujesz API z pamięci — ten projekt ma już za sobą jeden
  cichy no-op zgadnięty w ten sposób (`format: "email"` bez `ajv-formats`).

## Model dostarczania (multi-agent)

- **Orkiestrator** = model aktualnie wybrany w sesji. Analizuje, projektuje, deleguje,
  integruje i weryfikuje. **Nie pisze kodu produkcyjnego.**
- **Implementator** = zawsze subagent **Sonnet 5** — `Agent`/`Workflow` z `model: 'sonnet'`.
  Dostaje brief z jawnym zakresem, listą plików zamrożonych i kontraktem.
- Analizę adwersarialną (ocena projektu, threat model, weryfikacja zmiany) orkiestrator
  prowadzi wielotorowo: wiele perspektyw → sceptycy → panel sędziowski → synteza.
  Nie rozstrzygasz analizy jednym przebiegiem.
- Trzy skille projektowe pokrywają typowe zlecenia — **zaczynasz od właściwego skilla**,
  nie od kodu:

  | Zlecenie | Skill |
  |---|---|
  | Popraw / uprość / uporządkuj istniejące rozwiązanie | `/refactor` |
  | Coś nie działa, zwraca zły kod, mail nie dochodzi | `/debug` |
  | Dodaj coś, czego jeszcze nie ma | `/nowa-funkcjonalnosc` |

## Produkt

Backend formularza kontaktowego. Trzy publiczne, anonimowe endpointy:

| Endpoint | Rola |
|---|---|
| `GET /api/contact/token` | wydaje HMAC form token (limit 30 / 15 min / IP) |
| `POST /api/contact` | krok 1: `name` + `email` + `message` (limit 5 / 15 min / IP) |
| `POST /api/contact/details` | krok 2, opcjonalny: `area` + `budget` + `phone` (własny limit 5 / 15 min / IP) |

Plus `GET /health` (statyczny) i `GET /ready` (żywy `transporter.verify()` na każdą próbkę).

**Czego tu nie ma i nie ma być:** bazy danych, kolejki, JWT, sesji, maila potwierdzającego
do klienta, retry po stronie serwera. Jedynym efektem udanego zgłoszenia jest mail wewnętrzny
na `MAIL_TEAM_TO`. Oba kroki korelują się wyłącznie przez temat maila krok-2
(`Inquiry details — {name} ({email})`), bo front dokleja `name` i `email` z kroku 1.

## Stack

Node 22 (`.nvmrc`, `engines: >=22.13.0`), Fastify 5, TypeScript strict (`noUncheckedIndexedAccess`),
nodemailer 9 (linia 6.x ma niezałatane podatności SMTP/CRLF), Handlebars, pino + pino-pretty,
Vitest, npm. Hosting: Hostinger web-app za proxy LiteSpeed.

**Runtime `lsnode` nie jest procesem długożyjącym.** Hostinger bootuje proces Node per request
i ubija go SIGTERM-em ~1 s po wysłaniu odpowiedzi. To nie jest szczegół deploymentu — to
ograniczenie kształtujące całą architekturę (patrz „Niepodważalne ograniczenia").

## Komendy i bramka DoD

```
npm run dev          # tsx watch src/server.ts
npm run typecheck    # tsc --noEmit  — UWAGA: obejmuje tylko src/, NIE test/
npm test             # vitest run
npm run build        # npm ci --include=dev && tsc && copy-templates  — PRZEINSTALOWUJE node_modules
npm start            # node dist/server.js
npm run audit        # npm audit --omit=dev
npx vitest run test/plik.test.ts     # pojedynczy plik testowy
npx vitest run -t "nazwa testu"      # pojedynczy test po nazwie
```

**Bramka DoD — każde zadanie kończy się dwoma zielonymi krokami:**

```bash
npm run typecheck && npm test
```

Trzy rzeczy, które łatwo przeoczyć:

- **`npm run typecheck` nie sprawdza `test/`** — `tsconfig.json` ma `"include": ["src"]`.
  Błąd typów w teście wyjdzie dopiero na `npm test` (a Vitest transpiluje bez typecheckingu,
  więc część rozjazdów nie wyjdzie wcale).
- **Nie ma skryptu `lint`** ani configu ESLint. Bramka to `typecheck` + `test`, i tyle.
- **`npm run build` robi `npm ci`**, czyli kasuje i odtwarza `node_modules`. To komenda
  pre-deploy, nie lokalna bramka — nie wołaj jej odruchowo po każdej zmianie.

PowerShell 5.1 nie obsługuje `&&` — uruchamiaj przez narzędzie Bash albo łańcuchem
`npm run typecheck; if ($?) { npm test }`.

## Zmienne środowiskowe

Walidowane **fail-fast** przy starcie w `loadConfig` (`src/config.ts`). Brakująca zmienna
zatrzymuje boot, a komunikat **nazywa zmienną, nigdy nie drukuje jej wartości** — nie zmieniaj
tego zachowania. W repo **nie ma `.env.example`**; wzorcem jest lista poniżej.

| Zmienna | Znaczenie |
|---|---|
| `PORT`, `HOST` | `HOST` opcjonalny, domyślnie `0.0.0.0` |
| `TRUST_PROXY_HOPS` | liczba hopów proxy, **integer ≥ 1**, wymagana |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | konto SMTP (dedykowane, minimalnie uprawnione) |
| `MAIL_FROM`, `MAIL_TEAM_TO` | `From` i jedyny bezwarunkowy odbiorca |
| `CORS_ORIGINS` | lista po przecinku; `CORS_ORIGINS[0]` trafia też do pola `source` maila |
| `FORM_TOKEN_SECRET` | **min. 32 znaki** |
| `FORM_TOKEN_TTL_MS` | czas życia form tokenu |
| `TURNSTILE_SECRET` | sekret Cloudflare Turnstile |
| `SMTP_SEND_CAP_HOURLY`, `SMTP_SEND_CAP_DAILY` | bezpiecznik wysyłki |
| `NODE_ENV` | opcjonalny, domyślnie `development` |
| `LOG_LEVEL` | opcjonalny, domyślnie `info`, walidowany względem poziomów pino |
| `LOG_PRETTY` | opcjonalny bool, domyślnie on w `development` |

`.env` leży **poza docrootem**. Deploy check: `GET /.env` musi zwrócić `404`.

## Niepodważalne ograniczenia

Zmiana którejkolwiek z tych rzeczy wymaga jawnej zgody właściciela:

- **Nic po odpowiedzi.** Żadnego `setInterval`, `setTimeout`, kolejek, workerów,
  niezaawaitowanych promise'ów ani „fire-and-forget" po wysłaniu odpowiedzi. `lsnode` ubija
  proces ~1 s po odpowiedzi, więc **cokolwiek odroczysz, nie wykona się nigdy** — cicho,
  bez błędu. Dlatego wysyłka SMTP jest `await`owana synchronicznie w handlerze.
- **`trustProxy` nigdy `true`** — wyłącznie liczba hopów z `TRUST_PROXY_HOPS`.
  `true` pozwala podrobić `X-Forwarded-For` i dostać świeże `request.ip` na każdy request,
  co zeruje każdą kontrolę opartą o IP. Przed deployem sprawdź, że lewy `X-Forwarded-For`
  **nie** zmienia `request.ip`.
- **`ajv-formats` musi zostać podpięte** do instancji Ajv — bez tego `format: "email"`
  jest w Fastify 5 cichym no-opem. Razem z `customOptions: { removeAdditional: false }`,
  które sprawia, że `additionalProperties: false` **odrzuca** requesty zamiast po cichu
  obcinać nadmiarowe pola.
- **Wzorce anty-CRLF na `name` i `email`** (blokada `\r\n`, `<>`, przecinków) zostają;
  `email` wymaga dodatkowo kropkowanego TLD. Nie wracasz do luźnej formy.
- **Adres zgłaszającego trafia wyłącznie do `Reply-To`**, jako strukturalny obiekt
  nodemailera. `From` to zawsze `MAIL_FROM`. Jedyne dane użytkownika dopuszczone w stringu
  nagłówka to `name` (+ `email` w mailu krok-2) w `Subject`, i tylko przez `stripCtrl`.
- **Zero maila potwierdzającego do klienta.** Wysyłka na niezweryfikowany adres podany przez
  atakującego zamienia konto SMTP we wzmacniacz mailbomb/backscatter i kończy się blokadą.
  Potwierdzenie pokazuje front, na stronie.
- **Błąd SMTP → `503` + `Retry-After`**, nigdy `502` — proxy Hostingera emituje własne `502`
  przy padniętym origin, więc `502` byłby nierozróżnialny podczas awarii.
- **Form token konsumowany dopiero po udanej wysyłce.** `check()` jest niemutujące; przy
  błędzie SMTP budżet jest zwalniany, a token zostaje **nieskonsumowany**, żeby retry
  odwiedzającego nie spalił mu tokenu.
- **Brak oracle'a bramek.** Zły form token i zły Turnstile zwracają **identyczne** `403`.
  Honeypot i przekroczony budżet zwracają **fałszywe `200`** i nie wysyłają nic.
  Nie różnicuj tych odpowiedzi „dla czytelności" — to ujawnia, która bramka zadziałała.
- **Pełne body w logach to świadoma decyzja produktowa.** Oba POST-y logują kompletny body
  (z PII) na poziomie `info`, w każdym środowisku. `REDACT_PATHS` jest celowo zawężone do
  nagłówków poświadczeń (`authorization`, `cookie`). **Nie przywracaj redakcji body/PII bez
  zgody właściciela.** Konsekwencja RODO: logi są zbiorem danych osobowych. Z wolnego tekstu
  wstawianego do **stringa komunikatu** logu nadal wycinasz CR/LF (pola strukturalne pino
  są bezpieczne z definicji).
- **Log split zostaje.** `pino.multistream` z `dedupe`: `info/debug/trace` → **stdout**
  (Runtime logs Hostingera), `warn/error/fatal` → **stderr** (bucket Error). Oba strumienie
  **synchroniczne** — asynchroniczny bufor pino gubił linie przy recyklingu procesu.
  Nie wracaj do jednego strumienia na stderr.
- **Budżet wysyłki jest in-memory i per-proces.** Na `lsnode` resetuje się przy każdym boocie,
  więc realnie nie trzyma okna godzinowego ani dobowego. To znana, świadomie zaakceptowana
  granica — główną warstwą anty-automation jest **Turnstile**, nie ten licznik.

## Architektura (mapa, nie changelog)

- **`src/app.ts`** — `buildApp(deps)` to **testowalna fabryka**: rejestruje wtyczki i trasy,
  zwraca instancję Fastify **bez otwierania portu**. Wszystkie zależności (mailer, guardy,
  readiness) wstrzykiwane przez `AppDeps` — dlatego testy jadą przez `app.inject()`.
  `src/server.ts` robi tylko `listen()` i graceful shutdown.
- **`src/routes/contact.ts`** — oba POST-y dzielą **`contactPreValidation`** (Origin/Referer
  + `Content-Type`) i **`runAntiAbuseGuards`**. To celowa faktoryzacja: bramki nie mogą się
  rozjechać między endpointami. Nowy endpoint przyjmujący dane od odwiedzającego przechodzi
  przez te same helpery albo ma zapisane uzasadnienie, dlaczego nie.
- **Warstwy anty-abuse, od najtańszej** — każda to defense-in-depth, **żadna sama nie wystarcza**:
  1. `security/origin-guard.ts` — allowlist Origin/Referer + `Content-Type: application/json`.
     CORS **nie jest** kontrolą dostępu (curl go ignoruje) — to ten check realnie blokuje
     skrypty i drive-by CSRF.
  2. `security/form-token.ts` — HMAC wydawany przez `GET /api/contact/token`, weryfikowany
     na podpis, ważność i jednorazowość. Wiąże zgłoszenie z realnym wczytaniem strony.
  3. `security/turnstile.ts` — Cloudflare Turnstile, tryb niewidoczny, obowiązkowe
     serwerowe `siteverify`, **fail-closed**. To właściwa warstwa anty-automation.
  4. `security/send-budget.ts` — procesowy bezpiecznik wysyłki; po przekroczeniu zwraca
     `200` i przestaje wysyłać, zamiast pozwolić zalewowi zablokować konto SMTP.
  Kolejność w `runAntiAbuseGuards`: honeypot → form token → Turnstile → budżet.
- **`src/mailer/mailer.ts`** — `createMailer()` kompiluje szablony Handlebars **raz, przy
  boocie** (nie per request; build tylko kopiuje `.hbs` do `dist/`). Eksponuje
  `send` / `sendDetails` / `verify`. `stripCtrl` czyści dane wchodzące do `Subject`.
  Timeouty transportu są zacieśnione (connection/greeting 5 s, socket 10 s, dns 5 s), ale
  `socketTimeout` liczy bezczynność — **to nie jest twarda granica**, zdegradowana sesja SMTP
  może przekroczyć 10 s i abort frontu; wysyłka może się wtedy dokończyć serwerowo, więc
  ręczny retry potrafi zdublować maila (zaakceptowane).
- **`src/config.ts`** — jedyne miejsce czytające `process.env`. Nie czytaj env nigdzie indziej.
- **`src/emails/`** — `inquiry-internal.{hbs,txt.hbs}` (krok 1), `inquiry-details.{hbs,txt.hbs}`
  (krok 2). Szablony muszą jechać razem z aplikacją, dlatego build je kopiuje.
- **Schemat krok-1 tolerancyjnie ignoruje legacy klucze** (`company`, `phone`, `service`,
  `meeting`, `discover`, `handover`), żeby stare cache'owane bundle frontu nie dostawały `400`.
  Są zadeklarowane, ale **nigdy nieczytane** — `Submission` powstaje wyłącznie z
  `name`/`email`/`message`. Uwaga: legacy `phone` w kroku 1 ma tylko `maxLength`, **bez wzorca**;
  wzorzec telefonu obowiązuje wyłącznie w kroku 2. Do usunięcia w porządkach v2.1.
- **Decyzje projektowe z historii** (dlaczego coś wygląda tak, a nie inaczej) leżą
  w `docs/superpowers/specs/` — czytaj stamtąd, zamiast rekonstruować intencję z kodu.

## Kontrakt z frontendem

`docs/integration/frontend-integration.md` jest **źródłem prawdy** dla styku FE↔BE:
sekwencja submitu, kontrakty endpointów, mapa odpowiedź → zachowanie.

Front (`calm_soft_web`) jest **poza Twoim zakresem**. Dlatego każda zmiana kontraktu —
nowe pole, nowy kod odpowiedzi, zmiana walidacji, zmiana nagłówków — oznacza:
zaktualizuj ten dokument **i eskaluj do właściciela**, bo ktoś musi zmienić front.
Nigdy nie zmieniasz kontraktu po cichu: `400` na polu, którego stary bundle wciąż wysyła,
to zepsuty formularz na produkcji.

Reguła operacyjna z tego kontraktu: retry po `403` wymaga **świeżego tokenu Turnstile**
(jednorazowy, widget wydaje nowy); sam `formToken` pozostaje ważny.

## Testy

Vitest, sterowany przez `app.inject()` — bez portu, mailer zamockowany. Traktuj testy jak
**wykonywalną specyfikację kontroli bezpieczeństwa** i bramkę merge'a: błąd no-opa
`ajv-formats` dowiódł, że te kontrole regresują cicho przy bumpie zależności.

Stan: **87 testów w 8 plikach**. Każda kontrola ma asercję: zły email → `400`, nadmiarowe
pole → `400`, `>32 KB` → `413`, wypełniony honeypot → fałszywe `200` i zero wysyłek,
6. request w oknie → `429`, obcy Origin → `403`, brak/zły HMAC → `403`, brak/zły Turnstile
→ `403`, payload z `\r\nBcc:` → dokładnie jeden odbiorca, happy path → dokładnie jedna
synchroniczna wysyłka przed `200`, błąd SMTP → `503` + `Retry-After` z **nieskonsumowanym**
tokenem (retry tym samym tokenem przechodzi) i zwolnionym budżetem.

Ten sam łańcuch jest asertowany dla **obu** POST-ów. `/api/contact/details` ma dodatkowo:
zły enum `area`/`budget` → `400`, macierz wzorca telefonu (intl / krajowy / pusty / nienumeryczny
/ za krótki / za długi) i własny bucket `429`. `/api/contact` ma **tymczasowy** test
tolerancji legacy (stary 9-polowy payload → `200`, żaden legacy klucz nie dociera do mailera) —
znika razem z porządkami v2.1.

Testów cudzych zadań nie edytujesz, żeby przeszły. Czerwony test to sygnał, nie przeszkoda.

## Deploy (Hostinger)

Opublikuj **SPF (z hostami wysyłkowymi Hostingera) + DKIM + DMARC** dla `calmsoft.pro`, zanim
zaczniesz polegać na dostarczalności. Używaj dedykowanego, minimalnie uprawnionego konta SMTP.

Monitoring kieruj na **`GET /ready`** (żywy `verify()` na próbkę), **nie** na `/health` —
`/health` świeci na zielono także wtedy, gdy SMTP jest martwy. Alertuj na `503` z obu POST-ów
i na linie `mail send failed`, kanałem **innym niż** SMTP Hostingera.

- **Obowiązkowy krok po deployu:** wyślij formularz end-to-end — **oba kroki** — i potwierdź,
  że oba maile realnie dotarły na `MAIL_TEAM_TO` (`New inquiry — {name}`, potem
  `Inquiry details — {name} ({email})`). Przy synchronicznej wysyłce to **jedyny** dowód,
  że dostarczanie działa — nie ma żadnego trwałego zapisu, który dałoby się obejrzeć po fakcie.
- Sprawdź, że `GET /.env` zwraca `404`.
- **Zrotuj `SMTP_PASS`** — był drukowany otwartym tekstem przez usunięty już startowy dump
  diagnostyczny i trzeba go traktować jak wyciekły do zebranych logów.

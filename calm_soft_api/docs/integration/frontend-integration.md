# Integracja frontendu z calm_soft_api

## §1 Cel i źródło prawdy

Ten dokument opisuje, jak zintegrować formularz kontaktowy landing page'a (`calm_soft_web`,
komponent `ContactForm` + moduł typu `lib/inquiry.ts`) z `calm_soft_api` — bez czytania kodu
API. Obejmuje wyłącznie **kontrakt integracji back-end ↔ front-end oraz security**: co backend
oczekuje, co zwraca, jak front ma na to reagować, i jakie zabezpieczenia musi wdrożyć po swojej
stronie, żeby oba systemy pozostały spójne.

W kwestii kontraktu API (endpointy, pola, statusy, limity) **ten dokument jest źródłem
prawdy** — w razie rozbieżności z innym materiałem (np. starszym specem frontendu) obowiązuje
ten dokument, ponieważ jest zweryfikowany bezpośrednio względem kodu API.

Pełna architektura bezpieczeństwa API (uzasadnienie decyzji projektowych, analiza
adwersarialna) opisana jest osobno: `docs/superpowers/specs/2026-07-08-calm-soft-api-design.md`
(repo `calm_soft_api`). Ten dokument nie powiela tamtej analizy — podaje tylko to, co front musi
wiedzieć, żeby poprawnie zintegrować się z kontraktem.

## §2 Sekwencja submitu

```
Mount formularza
  └─ załaduj skrypt Turnstile (https://challenges.cloudflare.com/turnstile/v0/api.js)
       tryb: invisible / execute, publiczny site key

Submit — krok 1 (klik "Wyślij")
  1. wykonaj Turnstile (execute)              → turnstileToken
  2. GET  {API_BASE}/api/contact/token         → formToken
  3. POST {API_BASE}/api/contact                (payload + oba tokeny)
       200 → panel sukcesu (z opcjonalnym krokiem 2)
       403 → odśwież OBA tokeny, ponów raz
       inny błąd → stan błędu (patrz §4)

Krok 2 — opcjonalny (w panelu sukcesu: obszar / budżet / telefon)
  1. wykonaj Turnstile (świeży execute)        → turnstileToken (nowy — token jest jednorazowy)
  2. GET  {API_BASE}/api/contact/token         → formToken (świeży — poprzedni skonsumowany)
  3. POST {API_BASE}/api/contact/details        (payload + oba tokeny)
       statusy i retry identycznie jak w kroku 1
  „wszystkie pola puste" = skip: zero requestów
```

Kroki:

1. **Mount:** przy montowaniu formularza załaduj skrypt Turnstile
   (`https://challenges.cloudflare.com/turnstile/v0/api.js`) i zainicjalizuj widget w trybie
   **invisible** (`execute`), z **publicznym** site key.
2. **Submit:** dopiero przy wysyłce — w tej kolejności: wykonaj Turnstile (uzyskaj
   `turnstileToken`) → `GET {API_BASE}/api/contact/token` (uzyskaj `formToken`) →
   `POST` danego kroku (`/api/contact` lub `/api/contact/details`) z oboma tokenami w payloadzie.
3. **Uzasadnienie kolejności:** `formToken` jest jednorazowy i ma TTL — domyślnie 10 minut
   (`FORM_TOKEN_TTL_MS=600000` w `.env.example`; konfigurowalne po stronie API), dlatego pobiera
   się go **przy submicie, nie przy mount**, i nigdy się go nie cache'uje. Token Turnstile jest
   ważny ~300 s i również jednorazowy, więc wymaga świeżego `execute()` przy każdym submicie.
4. **Nagłówki:** `Content-Type: application/json` jest obowiązkowy — jego brak/niezgodność
   kończy się `415`. Nagłówek `Origin` dokleja sama przeglądarka; origin strony frontu musi
   znaleźć się na server-side allowliście API (`CORS_ORIGINS`) — to zarówno CORS, jak i
   niezależna walidacja server-side (patrz §5a). Preflight `OPTIONS` obsługuje API
   automatycznie (plugin CORS) — front nie robi nic dodatkowego.
5. **Krok 2:** wymaga kompletu **świeżych** tokenów (oba są jednorazowe — komplet z kroku 1
   został skonsumowany przy udanym submicie). Front echo'uje `name`+`email` z kroku 1 — to
   jedyny klucz korelacji obu zgłoszeń (API nie ma bazy; zgłoszenia spina temat maila, patrz
   §3). Gdy odwiedzający zostawi wszystkie pola kroku 2 puste, front pomija wysyłkę
   całkowicie (skip, zero requestów).

## §3 Kontrakt endpointów

### `GET /api/contact/token`

Zwraca jednorazowy token formularza. **Wspólny dla obu kroków** — każdy POST (krok 1 i krok 2)
wymaga świeżego tokenu z tego endpointu.

- Odpowiedź: `200 {"token": "<string>"}`
- Limit: **30 żądań / 15 min / IP**

### `POST /api/contact` (krok 1)

Przyjmuje zgłoszenie kontaktowe.

- Limit: **5 żądań / 15 min / IP** (własny bucket)
- Rozmiar body: **≤ 32 KB** (powyżej → `413`)
- Pola spoza listy poniżej → **`400`** (`additionalProperties: false`) — schema odrzuca każde
  pole, którego nie zna, np. własnoręcznie dodane pole antyspamowe typu `elapsedMs`.

| Pole | Typ | Wymagane | Ograniczenia |
|---|---|---|---|
| `name` | string | tak | 1–120, bez CR/LF |
| `email` | string | tak | ≤254, format e-mail + kropkowana TLD, bez CR/LF `<` `>` `,` |
| `message` | string | tak | 1–5000, wieloliniowe OK |
| `website` | string | tak wysyłać* | honeypot — **zawsze `""`**; ≤160 |
| `formToken` | string | tak | ≤512, z `GET /api/contact/token` |
| `turnstileToken` | string | tak | ≤4096, z wykonania widgetu |

\* `website` jest technicznie opcjonalne w schemie API, ale front musi je wysyłać zawsze jako
`""` — patrz §5b (honeypot).

> **Przejściowe klucze legacy (do deployu v2.1).** Schema dodatkowo *akceptuje i ignoruje*
> klucze starego 9-polowego formularza: `company` (string ≤160), `phone` (string ≤40),
> `service` (string ≤40), `meeting` (string ≤20), `discover` (boolean), `handover` (boolean).
> Handler ich **nie czyta** (nie trafiają do maila ani do `Submission`); walidacja jest celowo
> poluzowana względem v1 (bez enum/pattern), bo wartości są odrzucane. To wyłącznie okno
> zgodności dla starych, cache'owanych bundli frontu — front v2 tych pól **nie wysyła**,
> a klucze zostaną usunięte ze schemy w porządkującym deployu **v2.1** (wtedy stary payload
> zacznie dostawać `400`).

### `POST /api/contact/details` (krok 2 — dane kwalifikujące, NOWE 2026-07-22)

Przyjmuje opcjonalne dane kwalifikujące po udanym kroku 1 (obszar / budżet / telefon).

- Limit: **5 żądań / 15 min / IP** — **własny, niezależny bucket** (nie dzieli licznika
  z `POST /api/contact`)
- Rozmiar body: **≤ 32 KB**; pola spoza listy → `400` (`additionalProperties: false`)
- **Identyczny łańcuch zabezpieczeń** jak krok 1 (wspólny kod po stronie API): gate
  Origin/Content-Type → honeypot (fake `200`) → formToken (`403`) → Turnstile (`403`) →
  budżet wysyłki (fake `200`) → synchroniczna wysyłka SMTP (`503` bez konsumpcji tokenu przy
  błędzie; sukces konsumuje token)
- **Brak bazy danych** — korelacja z krokiem 1 wyłącznie po treści maili: temat kroku 2 to
  `Inquiry details — {name} ({email})` (stąd wymóg echo `name`+`email` z kroku 1)

| Pole | Typ | Wymagane | Ograniczenia |
|---|---|---|---|
| `name` | string | tak | 1–120, bez CR/LF — **echo z kroku 1** |
| `email` | string | tak | jak w kroku 1 — **echo z kroku 1** |
| `area` | enum | nie | `core` \| `automation` \| `rescue` \| `web` \| `not-sure` |
| `budget` | enum | nie | `under-10k` \| `10-30k` \| `30-80k` \| `80k-plus` \| `no-idea` |
| `phone` | string | nie | ≤40; **pusty string LUB 7–15 cyfr** (lenient international: opcjonalny `+`, cyfry, spacje, nawiasy, `.` `/` `-`) |
| `website` | string | tak wysyłać* | honeypot — ukryte pole renderowane identycznie jak w kroku 1 (patrz §5b); `""` dla człowieka, wypełnione ⇒ nieodróżnialny fake-`200`; ≤160 |
| `formToken` | string | tak | ≤512 — **świeży** (poprzedni skonsumowany w kroku 1) |
| `turnstileToken` | string | tak | ≤4096 — **świeży `execute()`** |

**Nieustawione pola opcjonalne pomijaj w JSON** (nie wysyłaj ich wcale): `area`/`budget` to
enumy, które **nie dopuszczają `""`** — pusty string da `400`; `phone` akurat dopuszcza `""`,
ale spójnie pomijaj i jego.

### Kanoniczny przykład (TypeScript)

```ts
const API_BASE = 'https://api.calmsoft.pro'; // origin API (placeholder)

class InquiryError extends Error {
  constructor(public status: number) { super(`Inquiry failed: ${status}`); }
}

type InquiryFields = {
  name: string; email: string; message: string;
};

type InquiryDetailsFields = {
  name: string; email: string; // echo z kroku 1 — jedyny klucz korelacji
  area?: 'core' | 'automation' | 'rescue' | 'web' | 'not-sure';
  budget?: 'under-10k' | '10-30k' | '30-80k' | '80k-plus' | 'no-idea';
  phone?: string;
};

// Wspólny transport obu kroków: GET token → POST, jeden 10-sekundowy AbortController.
// Nieustawione klucze opcjonalne (area/budget/phone) muszą być POMINIĘTE w obiekcie fields
// (undefined → JSON.stringify je wytnie) — enumy nie dopuszczają pustego stringa.
async function submitOnce(path: string, fields: object, turnstileToken: string): Promise<void> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const tokenRes = await fetch(`${API_BASE}/api/contact/token`, { signal: ctrl.signal });
    if (!tokenRes.ok) throw new InquiryError(tokenRes.status);
    const { token } = (await tokenRes.json()) as { token: string };

    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...fields, website: '', formToken: token, turnstileToken }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new InquiryError(res.status);
  } finally {
    clearTimeout(timer);
  }
}

// Retry: dokładnie jeden, tylko po 403, ze świeżymi OBOMA tokenami
// (ponowne wejście w submitOnce pobiera też świeży formToken).
async function withRetry(run: (t: string) => Promise<void>, executeTurnstile: () => Promise<string>) {
  try {
    await run(await executeTurnstile());
  } catch (e) {
    if (e instanceof InquiryError && e.status === 403) {
      await run(await executeTurnstile());
    } else {
      throw e;
    }
  }
}

const submitInquiry = (f: InquiryFields, exec: () => Promise<string>) =>
  withRetry((t) => submitOnce('/api/contact', f, t), exec);
const submitInquiryDetails = (f: InquiryDetailsFields, exec: () => Promise<string>) =>
  withRetry((t) => submitOnce('/api/contact/details', f, t), exec);
```

## §4 Mapa odpowiedzi → zachowanie frontu

**Zasada nadrzędna: decyzje wyłącznie po statusie HTTP, nigdy po treści body.** Body są celowo
generyczne i różne przyczyny dają identyczne lub nieinformatywne treści (np. `400`, `413` i
`429` zwracają to samo `{"error":"Invalid request"}` z globalnego error handlera API) — front
nie ma z czego zbudować logiki opartej na body.

Mapa dotyczy **obu POST-ów** (`/api/contact` i `/api/contact/details`) — statusy i semantyka
są identyczne.

| Status | Znaczenie | Zachowanie frontu | Body (informacyjnie, nie kontrakt) |
|---|---|---|---|
| 200 | przyjęte (w tym nieodróżnialne fake-200: honeypot, budżet wysyłki) | panel sukcesu | `{"ok":true}` |
| 400 | payload odrzucony przez schemę | błąd konstrukcji payloadu — napraw front, nie ponawiaj | `{"error":"Invalid request"}` |
| 403 | weryfikacja odrzucona (formToken/Turnstile/Origin) | odśwież oba tokeny, ponów **raz**; drugi 403 → stan błędu | `{"error":"Verification failed"}` (token/Turnstile) lub `{"error":"Origin not allowed"}` (Origin) — **treść się różni, ale front i tak reaguje wyłącznie na status 403** |
| 413 | body > 32 KB | nie ponawiaj; limit `message` 5000 znaków chroni przed tym w normalnym użyciu | `{"error":"Invalid request"}` |
| 415 | brak/zły `Content-Type: application/json` | błąd konfiguracji frontu, nie ponawiaj | `{"error":"Content-Type must be application/json"}` |
| 429 | limit per-IP (5/15 min każdy POST — **osobne buckety** dla `/contact` i `/details`; 30/15 min token) | „spróbuj później"; honoruj `Retry-After` jeśli obecny | `{"error":"Invalid request"}`, nagłówek `retry-after: 900` (sekundy) + `x-ratelimit-*` |
| 503 | wysyłka SMTP nie powiodła się (mail NIE wyszedł) | stan błędu + **manualne** ponowienie (klik użytkownika) — front celowo nie odlicza `Retry-After` (nagłówek informacyjny). Ponowny submit z konstrukcji mintuje świeże **oba** tokeny (pełny cykl `execute` + GET token), co spełnia wymóg świeżego Turnstile (jednorazowy — zużyty przy pierwszej próbie); formToken z nieudanej próby pozostaje ważny po stronie API (nie jest konsumowany przy błędzie wysyłki), ale front go nie reużywa — nieszkodliwe | `{"error":"Temporarily unavailable"}`, nagłówek `retry-after: 30` |
| sieć/timeout | — | stan błędu (front ma własny timeout 10 s, patrz przykład §3) | — |

Uwaga do wiersza 403: treść body dla złego Origin (`"Origin not allowed"`) różni się od treści
dla złego formToken/Turnstile (`"Verification failed"`) — ale to nie jest kontrakt, którego
front ma używać do rozgałęziania logiki; oba przypadki obsługuje identycznie jako status 403.
Body formToken i Turnstile jest natomiast celowo **identyczne** dla obu przyczyn, żeby front
(i atakujący) nie mógł ustalić, która bramka odrzuciła żądanie.

## §5 Security

### (a) Wdrożone po stronie API (informacyjnie — front tego nie dubluje)

- Walidacja serwerowa całego payloadu (`additionalProperties: false`, wzorce anty-CRLF na
  polach tekstowych).
- Gate Origin/Referer + Content-Type, wykonywany server-side (CORS to *nie* jest kontrola
  dostępu — curl go ignoruje; ten gate faktycznie blokuje bezpośrednie skrypty i CSRF).
- Jednorazowy token formularza podpisany HMAC, z TTL.
- Cloudflare Turnstile weryfikowany server-side (`siteverify`), fail-closed.
- Honeypot (`website`) — wypełnione pole daje nieodróżnialny fake-`200` bez wysyłki.
- Limity per-IP na wszystkich trzech endpointach (osobne buckety: token 30/15 min, każdy
  z POST-ów po 5/15 min).
- Globalny budżet wysyłki (godzinowy/dzienny cap) — po przekroczeniu również fake-`200`.
- Wysyłka SMTP synchronicznie w requeście (od 2026-07-09; wcześniejszy outbox usunięty — hosting
  lsnode ubija proces tuż po odpowiedzi, więc żadna praca nie może dziać się „osobno") — `200`
  oznacza, że mail faktycznie wyszedł; błąd SMTP daje jawne `503`.
- Ochrona przed SMTP/CRLF injection — adres nadawcy formularza trafia wyłącznie do
  strukturalnego `Reply-To`, nigdy nie jest interpolowany w nagłówkach.
- Logi API zawierają pełne body zgłoszenia (świadoma decyzja produktowa — logi są magazynem
  danych osobowych w rozumieniu RODO); redakcja obejmuje wyłącznie nagłówki uwierzytelniające.
- Identyczne body `403` dla formToken i Turnstile — brak wyroczni, która bramka odrzuciła.

### (b) Do wdrożenia po stronie frontu

- **Honeypot `website`:** zawsze obecne w payloadzie jako `""`. Ukryj je pozycjonowaniem poza
  viewport (nie `display:none`), ustaw `tabIndex={-1}`, `aria-hidden="true"`,
  `autocomplete="off"`. (Dotyczy pola renderowanego w kroku 1; stan kroku 2 — patrz nota
  na końcu tej sekcji.)
- **Turnstile invisible:** świeże wykonanie (`execute`) przy każdym submicie — token jest
  jednorazowy i ważny ~300 s. Site key jest **publiczny z założenia** — to nie sekret, można go
  osadzić w bundlu frontendu. Do dev/CI używaj oficjalnych kluczy testowych Cloudflare
  (zweryfikowanych z dokumentacją Cloudflare):
  - front (site key, invisible, always-pass): `1x00000000000000000000BB`
  - front (site key, widoczny wariant, always-pass): `1x00000000000000000000AA`
  - front (site key, invisible, always-fail — do testowania ścieżki błędu): `2x00000000000000000000BB`
  - API — dev (secret, always-pass): `1x0000000000000000000000000000000AA`
  - API — dev (secret, always-fail): `2x0000000000000000000000000000000AA`

  Klucze testowe działają na dowolnej domenie (w tym `localhost`), a wygenerowane nimi tokeny
  mają format `XXXX.DUMMY.TOKEN.XXXX`. Produkcyjny secret odrzuca tokeny wygenerowane kluczem
  testowym i odwrotnie — nie da się mieszać testowych i produkcyjnych kluczy między frontem a
  API.
- **`formToken`:** pobierany przy submicie, nie przy mount; nigdy nie cache'owany, nigdy nie
  współdzielony między submitami.
- **Payload dokładnie wg §3** — bez pól dodatkowych; walidacja UI przed wysyłką (żeby nie
  polegać na `400` z API jako jedynej bramce): krok 1 wymaga `name`/`email`/`message`,
  w kroku 2 telefon walidowany tylko gdy niepusty.
- **Krok 2 (details):** echo `name`+`email` z kroku 1 (jedyny klucz korelacji — API nie ma
  bazy); nieustawione `area`/`budget`/`phone` **pomijane w JSON** (enumy nie dopuszczają
  `""`); „wszystko puste" = skip bez żadnego requestu; osobny guard anty-dwuklik dla submitu
  kroku 2.
- **Retry wyłącznie pojedynczy, po `403`**, ze świeżymi oboma tokenami; nigdy pętla — limit
  wynosi 5 żądań / 15 min / IP i pętla go wyczerpie.
- **Dwuklik = jeden POST:** przycisk submitu zablokowany aż do rozstrzygnięcia promisa.
- **Komunikaty błędów w UI generyczne** — nie ujawniaj, która bramka (Origin/formToken/
  Turnstile/limit) odrzuciła żądanie.
- **Zero sekretów w bundlu:** `TURNSTILE_SECRET`, `FORM_TOKEN_SECRET` i dane SMTP istnieją
  wyłącznie po stronie API i nigdy nie trafiają do frontu.
- **CSP statycznego frontu** (dokładny blok):

```
script-src 'self' https://challenges.cloudflare.com;
frame-src https://challenges.cloudflare.com;
connect-src 'self' https://api.calmsoft.pro;
```

- **Brak PII** (imię/e-mail/telefon/treść wiadomości) w analytics i logach frontu; HTTPS
  wszędzie.

> **Nota — informacja dla front-endu (zaktualizowano 2026-07-22):** krok 2 renderuje teraz
> własne, ukryte pole honeypot (identyczny wzorzec jak w kroku 1 — pozycjonowanie poza
> viewport, `tabIndex={-1}`, `aria-hidden="true"`, `autocomplete="off"`), którego wartość jest
> bindowana do `website` w payloadzie `/api/contact/details`. Honeypot jest więc **aktywny w
> obu krokach**: bot wypełniający wszystkie pola formularza (w tym ukryte) triggeruje
> nieodróżnialny fake-`200` również na kroku 2. Front celowo nie rozgałęzia UI na podstawie
> tego stanu (fake-`200` renderuje się identycznie jak prawdziwy sukces) — patrz uwaga o braku
> wyroczni w §4.

## §6 Checklista spójności (go-live)

- `CORS_ORIGINS` API = dokładne originy produkcyjne frontu (schemat + host, bez ścieżki, bez
  trailing slash).
- Domena frontu dodana w panelu Turnstile; klucze testowe podmienione na produkcyjne (po obu
  stronach — front i API).
- Smoke z zewnątrz (dokładne komendy):

```bash
# bez Origin (z poprawnym content-type) -> 403
curl -si -X POST https://api.calmsoft.pro/api/contact \
  -H "content-type: application/json" -d '{}' | head -1
# zły content-type -> 415
curl -si -X POST https://api.calmsoft.pro/api/contact \
  -H "origin: https://calmsoft.pro" -H "content-type: text/plain" -d 'x' | head -1
# details: bez Origin -> 403
curl -si -X POST https://api.calmsoft.pro/api/contact/details \
  -H "content-type: application/json" -d '{}' | head -1
# sekrety niedostępne -> 404
curl -s -o /dev/null -w "%{http_code}\n" https://api.calmsoft.pro/.env
```

- Pełny submit kroku 1 z prawdziwej strony → `200` i mail `New inquiry — {name}` w skrzynce
  zespołu; następnie krok 2 (obszar/budżet/telefon) → `200` i **drugi** mail
  `Inquiry details — {name} ({email})`. Dla pewności okna przejściowego: stary pełny
  9-polowy payload → również `200` (jeden mail, bez pól legacy).
- `GET /health` → `200` (liveness, niezależnie od stanu SMTP); monitoring produkcyjny podłączony
  do `GET /ready` (readiness — sprawdza SMTP), nie do `/health`.

---

Data: 2026-07-08; zaktualizowano 2026-07-09 (outbox usunięty — wysyłka synchroniczna, patrz
addendum w `docs/superpowers/specs/2026-07-09-hostinger-source-build-deploy-design.md`);
zaktualizowano 2026-07-22 (formularz 3-polowy + opcjonalny krok 2: odchudzony
`POST /api/contact` z przejściowymi kluczami legacy — do usunięcia w deployu v2.1 — oraz nowy
`POST /api/contact/details`; kolejność wdrożeń: **API v2 → front → API v2.1 (cleanup)**;
rationale zmiany: `calm_soft_web/docs/superpowers/specs/2026-07-22-pl-first-person-rework-design.md` §6).
Źródło prawdy kontraktu; architektura bezpieczeństwa API:
`docs/superpowers/specs/2026-07-08-calm-soft-api-design.md`.

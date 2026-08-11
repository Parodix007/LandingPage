"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Musi być identyczny z selektorem w globals.css (kontrakt reveal-on-scroll) — dziecko
// .reveal-group, pomijając dekoracje aria-hidden i zagnieżdżone kontenery (te animują własne
// dzieci, nie same siebie).
const SELECTOR = '.reveal-group > *:not([aria-hidden="true"]):not(.reveal-group)';

// Liść bez własnego DOM — całą pracę wykonuje jako efekt uboczny na atrybutach `data-*` i
// zmiennej `--reveal-i`, które CSS w globals.css zamienia na animację. Zero JSX-a niosącego
// treść: brak ryzyka zagnieżdżonych elementów interaktywnych, brak stringów do i18n.
export function RevealOnScroll() {
  // Dziś w `src/` nie ma ani jednego `next/link` (`<Link>`) — każde przejście między trasami
  // jest więc pełnym przeładowaniem dokumentu, `layout.tsx` remontuje się za darmo przy okazji,
  // i ten efekt odpaliłby się od nowa sam z siebie nawet bez `pathname` w zależnościach.
  // `pathname` zostaje mimo to — to ubezpieczenie na dzień, w którym ktoś doda `<Link>`: wtedy
  // nawigacja robi się kliencka, App Router przestaje remontować `layout.tsx` między trasami, a
  // `querySelectorAll` z chwili montażu złapałby DOM wyłącznie pierwszej strony — bloki na
  // każdej kolejnej trasie zostałyby trwale ukryte, bo obserwator nigdy by ich nie dostał. Koszt
  // tej zależności jest zerowy, a jej brak byłby cichy aż do pierwszego `<Link>` w projekcie —
  // nie usuwaj jej jako „martwej".
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const targets = [...document.querySelectorAll<HTMLElement>(SELECTOR)];

    // Przebieg synchroniczny PRZED uzbrojeniem (`root.dataset.reveal = "on"` niżej). Kolejność
    // jest tu nośna, nie kosmetyczna:
    // 1) Indeks kaskady (`--reveal-i`) liczony per-rodzic, tylko po elementach pasujących do
    //    SELECTOR — dziecko z aria-hidden albo zagnieżdżona .reveal-group nie zajmuje slotu.
    // 2) Element, który w chwili montażu już jest w kadrze (`top < innerHeight`), dostaje
    //    `data-revealed` od razu, zanim CSS zacznie cokolwiek ukrywać. Dzięki temu: brak
    //    mignięcia przy hydracji (element nigdy nie przechodzi przez stan ukryty), LCP
    //    nietknięte (nic nad zgięciem nie czeka na observer), a deep-link (`/#contact`,
    //    `/#<slug>`) ląduje na celu, który nigdy nie był przesunięty — scrollIntoView trafia w
    //    finalną pozycję, nie w tę sprzed animacji.
    const seen = new Map<Element, number>();
    for (const el of targets) {
      const parent = el.parentElement;
      if (parent) {
        const i = seen.get(parent) ?? 0;
        seen.set(parent, i + 1);
        el.style.setProperty("--reveal-i", String(i));
      }
      if (el.getBoundingClientRect().top < window.innerHeight) el.dataset.revealed = "";
    }

    // Uzbrojenie stanu ukrytego dopiero teraz. Brak JS (albo JS przed tą linią) = brak
    // `data-reveal` = selektor w globals.css nigdy nie dopasowuje = cała treść w spoczynku,
    // w pełni widoczna. To jedyny mechanizm bezpieczeństwa tej funkcji — dlatego stan ukryty
    // nie może żyć w statycznym HTML-u ani być domyślny w CSS bez tego atrybutu.
    //
    // DWIE FAZY, nie jedna. Gdyby ta linia od razu ustawiała `"on"`, globals.css nałożyłoby
    // stan startowy (opacity:0, translateY(30px)) i `transition` NA TĘ SAMĄ WŁAŚCIWOŚĆ w tym
    // samym przeliczeniu stylu — Chrome czyta to jako zmianę wartości przy już aktywnej
    // tranzycji i animuje samo WEJŚCIE w stan ukryty (potwierdzone przez `el.getAnimations()`
    // zwracające `CSSTransition:opacity:running` / `:transform:running` zaraz po montażu):
    // blok pod zgięciem 700ms zanikał i zjeżdżał w dół, zamiast tam po prostu być. To dokładnie
    // ten sam tryb ryzyka a11y (element zaparkowany w połowie przenikania), który wcześniej
    // zbił Accessibility do 93 na `/work/` w poprzedniej wersji tego mechanizmu.
    // Naprawa: `"arming"` nakłada wyłącznie stan startowy (globals.css dopasowuje go po samej
    // OBECNOŚCI `data-reveal`, bez `transition` — patrz komentarz tam), wymuszony reflow
    // zamyka tę klatkę renderowania, i dopiero `"on"` domalowuje `transition`. Między fazami
    // nie ma malowania, więc nie ma mignięcia — jest tylko gwarancja, że `transition` nie był
    // jeszcze aktywny, kiedy stan startowy wszedł w życie.
    root.dataset.reveal = "arming";
    // Wymuszony reflow, celowo NIE `requestAnimationFrame` — rAF jest dławiony w karcie w tle,
    // więc uzbrojenie potrafiłoby zawisnąć w fazie "arming" na czas nieokreślony (treść
    // przesunięta i niewidoczna bez animacji, które miałoby ją finalnie odsłonić). Synchroniczny
    // odczyt layoutu wymusza przeliczenie natychmiast. `getBoundingClientRect()` (zamiast np.
    // `offsetHeight`) bo jego wynik i tak nie jest tu używany do niczego poza efektem ubocznym
    // odczytu — `void root.offsetHeight` łapałby się o `no-unused-expressions` w ESLincie.
    root.getBoundingClientRect();
    // Wartość "arming" nie jest kontraktem dla nikogo poza tym plikiem i globals.css — na
    // zewnątrz (observer, testy, cleanup) liczy się wyłącznie finalne "on" i pełny brak atrybutu.
    root.dataset.reveal = "on";

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.revealed = "";
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px" }
    );
    for (const el of targets) if (!("revealed" in el.dataset)) io.observe(el);

    return () => {
      io.disconnect();
      delete root.dataset.reveal;
    };
  }, [pathname]);

  return null;
}

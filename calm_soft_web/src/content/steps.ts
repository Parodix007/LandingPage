import type { ProcessStep } from "./types";

export const steps: ProcessStep[] = [
  {
    number: "00",
    title: "Rozmowa",
    badge: "Bezpłatna · 30 minut",
    description:
      "Szczera rozmowa o tym, co budujesz, ile powinno to kosztować i czy jestem właściwą osobą do tej pracy. Bez pitchu. Jeśli odpowiedź brzmi „nie\" — powiem Ci to wprost i wskażę lepszy adres.",
  },
  {
    number: "01",
    title: "Discover",
    badge: "Opcjonalny · płatny osobno",
    description:
      "Ustrukturyzowany warsztat oparty na Domain-Driven Design: mapujemy Twoją domenę, jej zdarzenia i użytkowników — i definiujemy, co produkt naprawdę ma robić, zanim powstanie kod. Zwraca się w unikniętych poprawkach. Przy mniejszych projektach śmiało go pomiń.",
  },
  {
    number: "02",
    title: "Plan",
    description:
      "Wnioski zamieniają się w roadmapę: plan MVP-first — co wychodzi teraz, co czeka i dlaczego. Pocięty na przyrosty, które widzisz, mierzysz i możesz przestawiać w kolejności.",
  },
  {
    number: "03",
    title: "Budowa",
    description:
      "Buduję dokładnie to, co ustaliliśmy, iteracja po iteracji — na końcu każdej jest coś działającego do obejrzenia. Roadmapa zamienia się w produkt, nie w raporty statusowe.",
  },
  {
    number: "04",
    title: "Przekazanie",
    description:
      "Projekt kończy się na Twoich warunkach: przejmujesz produkt i pełną własność albo kontynuujemy w modelu utrzymania i rozwoju. Kończy się uściskiem dłoni — nigdy vendor lock-inem.",
  },
];

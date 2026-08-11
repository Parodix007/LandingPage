import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RevealOnScroll } from "./RevealOnScroll";
import { MockIntersectionObserver } from "@/test/setup";

// Pomocnicza: stubuje getBoundingClientRect elementu tak, żeby wyglądał na będący pod zgięciem
// (jsdom domyślnie zwraca same zera, więc bez tego KAŻDY element jest "w kadrze" — patrz uwaga
// w briefie).
function stubBelowFold(el: Element) {
  el.getBoundingClientRect = () =>
    ({ top: window.innerHeight + 200 }) as DOMRect;
}

describe("RevealOnScroll", () => {
  it("uzbraja html[data-reveal='on'] po montażu i sprząta po odmontowaniu", () => {
    const { unmount } = render(<RevealOnScroll />);

    expect(document.documentElement.dataset.reveal).toBe("on");

    const disconnectSpy = vi.spyOn(
      MockIntersectionObserver.instances[0]!,
      "disconnect"
    );

    unmount();

    expect(document.documentElement.dataset.reveal).toBeUndefined();
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it("uzbrojenie jest dwufazowe: reflow łapie 'arming', po montażu zostaje wyłącznie 'on'", () => {
    // Dowód na to, że faza przejściowa "arming" naprawdę istnieje w chwili wymuszonego reflow
    // (a nie że kod od razu skacze do "on") — podmieniamy getBoundingClientRect na html, żeby
    // podejrzeć wartość data-reveal DOKŁADNIE w momencie, w którym RevealOnScroll wymusza
    // przeliczenie layoutu między dwoma zapisami do atrybutu.
    const root = document.documentElement;
    let revealDuringReflow: string | undefined;
    const rectSpy = vi.spyOn(root, "getBoundingClientRect").mockImplementation(() => {
      revealDuringReflow = root.dataset.reveal;
      return { top: 0 } as DOMRect;
    });

    render(<RevealOnScroll />);

    expect(revealDuringReflow).toBe("arming");
    // Faza przejściowa nie zostaje na stałe — po zakończeniu montażu jest wyłącznie "on".
    expect(root.dataset.reveal).toBe("on");
    expect(root.dataset.reveal).not.toBe("arming");

    rectSpy.mockRestore();
  });

  it("element w kadrze dostaje data-revealed synchronicznie, bez udziału observera", () => {
    render(
      <>
        <div className="reveal-group">
          <p data-testid="in-view">w kadrze</p>
        </div>
        <RevealOnScroll />
      </>
    );

    const el = screen.getByTestId("in-view");
    expect(el.dataset.revealed).toBe("");

    const observer = MockIntersectionObserver.instances[0]!;
    expect(observer.observedTargets).not.toContain(el);
  });

  it("element pod zgięciem trafia do observe i dostaje data-revealed dopiero po wejściu w kadr", () => {
    // Fixture musi istnieć w DOM ZE ZASTUBOWANYM rectem, zanim RevealOnScroll zamontuje się i
    // przeczyta go synchronicznie — więc najpierw montujemy samą fixture (bez RevealOnScroll),
    // stubujemy rect, i dopiero potem montujemy RevealOnScroll osobnym `render()`. Oba trafiają
    // pod document.body, więc `document.querySelectorAll(SELECTOR)` w efekcie widzi jedno i
    // drugie — jsdom nie rozgranicza "kontenerów" różnych wywołań `render()`.
    render(
      <div className="reveal-group">
        <p data-testid="below-fold">pod zgięciem</p>
      </div>
    );
    const el = screen.getByTestId("below-fold");
    stubBelowFold(el);

    render(<RevealOnScroll />);

    expect(el.dataset.revealed).toBeUndefined();

    const observer = MockIntersectionObserver.instances[0]!;
    expect(observer.observedTargets).toContain(el);

    observer.triggerIntersect(el, true);

    expect(el.dataset.revealed).toBe("");
    expect(observer.observedTargets).not.toContain(el);
  });

  it("pomija aria-hidden i zagnieżdżoną .reveal-group; --reveal-i rośnie tylko po pasujących dzieciach", () => {
    render(
      <>
        <div className="reveal-group">
          <p data-testid="child-0">pierwsze</p>
          <span data-testid="hidden" aria-hidden="true">
            dekoracja
          </span>
          <div className="reveal-group" data-testid="nested-group">
            <p data-testid="nested-child">w zagnieżdżonej grupie</p>
          </div>
          <p data-testid="child-1">drugie</p>
        </div>
        <RevealOnScroll />
      </>
    );

    const hidden = screen.getByTestId("hidden");
    const nestedGroup = screen.getByTestId("nested-group");
    const nestedChild = screen.getByTestId("nested-child");
    const child0 = screen.getByTestId("child-0");
    const child1 = screen.getByTestId("child-1");

    // aria-hidden i zagnieżdżona .reveal-group same w sobie nie są celem selektora — brak
    // --reveal-i i brak data-revealed nadanego przez ten przebieg.
    expect(hidden.style.getPropertyValue("--reveal-i")).toBe("");
    expect(nestedGroup.style.getPropertyValue("--reveal-i")).toBe("");

    // dziecko WEWNĄTRZ zagnieżdżonej grupy jest celem selektora w kontekście SWOJEJ grupy
    // (rodzic = nestedGroup), ale to nie ta sama grupa co child-0/child-1.
    expect(nestedChild.style.getPropertyValue("--reveal-i")).toBe("0");

    // indeks liczony tylko po pasujących dzieciach zewnętrznej grupy: child-0 → 0,
    // hidden/nested-group pomijane (nie inkrementują), child-1 → 1.
    expect(child0.style.getPropertyValue("--reveal-i")).toBe("0");
    expect(child1.style.getPropertyValue("--reveal-i")).toBe("1");

    const observer = MockIntersectionObserver.instances[0]!;
    expect(observer.observedTargets).not.toContain(hidden);
    expect(observer.observedTargets).not.toContain(nestedGroup);
  });
});

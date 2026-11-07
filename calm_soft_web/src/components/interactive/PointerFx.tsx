"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Musi być identyczny z bramą w HeroParticleField.tsx i z bramą bloków pointer-FX w
// globals.css (kontrakt spec §4.1): efekty wskaźnikowe tylko dla ruchu dozwolonego i
// precyzyjnego wskaźnika. Touch (pointer: coarse) nie ma "najazdu" — poświata/tilt bez sensu.
const GATE_QUERY = "(prefers-reduced-motion: no-preference) and (pointer: fine)";

// Selektory-zaczepty żyjące w JSX sekcji (Hero, CaseStudies, HeroCaseSlider). Zestaw zmiennych
// usuwany przy sprzątaniu — dotyczy też elementów odłączonych od DOM przed unmountem.
const FX_VARS = ["--mx", "--my", "--px", "--py"] as const;

// Liść bez własnego DOM (wzorzec RevealOnScroll) — nasłuchuje `pointermove` na oknie i pisze
// zmienne CSS na kartach oznaczonych atrybutami. Malowaniem zajmuje się wyłącznie globals.css
// (transform/opacity), więc komponent nie dotyka stylu w żaden inny sposób.
export function PointerFx() {
  // Ubezpieczenie identyczne jak w RevealOnScroll: przy klienckiej nawigacji `<Link>` efekt
  // musi ponownie rozwiązać listę warstw `[data-parallax]` nowej trasy, inaczej paralaksa
  // milczałaby na każdej stronie poza pierwszą. Nie usuwać jako „martwej".
  const pathname = usePathname();

  useEffect(() => {
    if (!window.matchMedia(GATE_QUERY).matches) return;

    const layers = [...document.querySelectorAll<HTMLElement>("[data-parallax]")];
    const touched = new Set<HTMLElement>();

    let target: HTMLElement | null = null;
    let pending: { x: number; y: number; source: EventTarget | null } | null = null;
    let frame: number | null = null;

    const write = (el: HTMLElement, props: Record<string, string>) => {
      for (const [name, value] of Object.entries(props)) el.style.setProperty(name, value);
      touched.add(el);
    };

    const clear = (el: HTMLElement) => {
      for (const name of FX_VARS) el.style.removeProperty(name);
    };

    // Jednostkowe wartości bezjednostkowe (--px/--py) trzymane w przedziale <-1,1>; CSS
    // mnoży je przez kąt/przesunięcie, więc granica tu jest drugą warstwą limitu 4° (spec §4.2).
    const unit = (value: number) =>
      String(Math.round(Math.min(1, Math.max(-1, value)) * 1000) / 1000);

    const draw = () => {
      frame = null;
      if (!pending) return;
      const { x, y, source } = pending;
      pending = null;

      const next =
        source instanceof Element
          ? source.closest<HTMLElement>("[data-glow],[data-tilt]")
          : null;
      if (target !== next) {
        if (target) clear(target);
        target = next;
      }

      if (target) {
        const rect = target.getBoundingClientRect();
        const props: Record<string, string> = {
          "--mx": `${Math.round(x - rect.left)}px`,
          "--my": `${Math.round(y - rect.top)}px`,
        };
        if (target.hasAttribute("data-tilt") && rect.width > 0 && rect.height > 0) {
          props["--px"] = unit((x - (rect.left + rect.width / 2)) / (rect.width / 2));
          props["--py"] = unit((y - (rect.top + rect.height / 2)) / (rect.height / 2));
        }
        write(target, props);
      }

      // Paralaksa tła hero: wektor względem środka viewporta, liczony niezależnie od celu.
      if (layers.length > 0) {
        const props = {
          "--px": unit((x - window.innerWidth / 2) / (window.innerWidth / 2)),
          "--py": unit((y - window.innerHeight / 2) / (window.innerHeight / 2)),
        };
        for (const layer of layers) write(layer, props);
      }
    };

    // Dławienie przez kolejkowanie jednej klatki: wiele `pointermove` w klatce = jeden zapis.
    const onPointerMove = (event: PointerEvent) => {
      pending = { x: event.clientX, y: event.clientY, source: event.target };
      if (frame === null) frame = window.requestAnimationFrame(draw);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
        frame = null;
      }
      for (const el of touched) clear(el);
      touched.clear();
      target = null;
      pending = null;
    };
  }, [pathname]);

  return null;
}

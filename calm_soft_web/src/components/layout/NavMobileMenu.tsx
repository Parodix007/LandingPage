"use client";

import { useEffect, useRef, useState } from "react";
import { FilledPill } from "@/components/ui/FilledPill";
import { PILL_FOCUS } from "@/components/ui/pillBase";

export type NavLink = { href: string; label: string };

// SPEC §6.7 — own design (the mockup has no mobile nav). Client leaf: hamburger + a
// full-width panel dropped below the bar, same nav tokens. No scroll-lock (the panel does
// not cover the page) and no focus trap (it stays naturally reachable under the button).
export function NavMobileMenu({ links, ctaLabel }: { links: NavLink[]; ctaLabel: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        // Standard a11y for a dropdown: Esc returns focus to the control that opened it.
        toggleRef.current?.focus();
      }
    }
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="md:hidden">
      <button
        ref={toggleRef}
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
        className={`${PILL_FOCUS} flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-[var(--radius-input)]`}
      >
        <span aria-hidden="true" className="h-[2px] w-5 bg-ink" />
        <span aria-hidden="true" className="h-[2px] w-5 bg-ink" />
        <span aria-hidden="true" className="h-[2px] w-5 bg-ink" />
      </button>
      {/* Full-width: panel resolves against the sticky header (Nav.tsx), not this wrapper — do NOT add position:relative to the wrapper above or it collapses to the 44px button. */}
      <div
        id="mobile-menu"
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-border-08 bg-black/65 px-6 py-4 backdrop-blur-[20px] backdrop-saturate-[1.8]"
      >
        <nav className="flex flex-col">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`${PILL_FOCUS} rounded-[var(--radius-input)] py-[14px] text-[17px] text-ink-85 hover:text-white`}
            >
              {link.label}
            </a>
          ))}
          <div className="mt-2 self-start">
            <FilledPill as="a" href="/#contact" size="md" onClick={() => setOpen(false)}>
              {ctaLabel}
            </FilledPill>
          </div>
        </nav>
      </div>
    </div>
  );
}

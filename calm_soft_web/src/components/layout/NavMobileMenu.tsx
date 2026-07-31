"use client";

import { useEffect, useRef, useState } from "react";
import { FilledPill } from "@/components/ui/FilledPill";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { PILL_FOCUS } from "@/components/ui/pillBase";

export type NavLink = { href: string; label: string };

// Optional nested-menu config (SPEC: nav services restructure). When provided, "Usługi" renders
// as a <button> in the main list instead of a plain link; clicking it swaps the panel to a
// submenu view (back button + overview link + service links) instead of expanding an accordion.
export type NavServiceMenu = {
  label: string;
  backLabel: string;
  overviewHref: string;
  overviewLabel: string;
  items: NavLink[];
};

type View = "main" | "services";

// SPEC §6.7 — own design (the mockup has no mobile nav). Client leaf: hamburger + a
// full-width panel dropped below the bar, same nav tokens. No scroll-lock (the panel does
// not cover the page) and no focus trap (it stays naturally reachable under the button).
// `serviceMenu` (optional) adds a second, nested view inside the same panel — see NavServiceMenu.
export function NavMobileMenu({
  links,
  ctaLabel,
  serviceMenu,
}: {
  links: NavLink[];
  ctaLabel: string;
  serviceMenu?: NavServiceMenu;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("main");
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const servicesTriggerRef = useRef<HTMLButtonElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  // Which element should receive focus after the next view swap — a ref, not state: it's read
  // once by the effect below and cleared, so it never itself triggers a render.
  const pendingFocusRef = useRef<"back" | "trigger" | null>(null);

  useEffect(() => {
    const target = pendingFocusRef.current;
    if (!target) return;
    pendingFocusRef.current = null;
    if (target === "back") backButtonRef.current?.focus();
    if (target === "trigger") servicesTriggerRef.current?.focus();
  }, [view]);

  function closeAll() {
    setOpen(false);
    setView("main");
  }

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeAll();
        // Standard a11y for a dropdown: Esc returns focus to the control that opened it.
        toggleRef.current?.focus();
      }
    }
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        closeAll();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  const navItemClass = `${PILL_FOCUS} w-full rounded-[var(--radius-input)] py-[14px] text-left text-[17px] text-ink-85 hover:text-white`;

  return (
    <div ref={rootRef} className="md:hidden">
      <button
        ref={toggleRef}
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => {
          if (open) {
            closeAll();
          } else {
            setOpen(true);
          }
        }}
        className={`${PILL_FOCUS} flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-[var(--radius-input)]`}
      >
        <span aria-hidden="true" className="h-[2px] w-5 bg-ink" />
        <span aria-hidden="true" className="h-[2px] w-5 bg-ink" />
        <span aria-hidden="true" className="h-[2px] w-5 bg-ink" />
      </button>
      {/* Full-width: panel resolves against the sticky header (Nav.tsx), not this wrapper — do NOT add position:relative to the wrapper above or it collapses to the 44px button. Two <nav> views share one panel (no scroll-lock, no focus trap — same decision as the single-view panel above, extended to the nested submenu). */}
      <div
        id="mobile-menu"
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-border-08 bg-surface px-6 py-4"
      >
        {view === "main" && (
          <nav className="flex flex-col">
            {serviceMenu && (
              <button
                ref={servicesTriggerRef}
                type="button"
                onClick={() => {
                  pendingFocusRef.current = "back";
                  setView("services");
                }}
                className={navItemClass}
              >
                {serviceMenu.label}
              </button>
            )}
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeAll}
                className={`${PILL_FOCUS} rounded-[var(--radius-input)] py-[14px] text-[17px] text-ink-85 hover:text-white`}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 self-start">
              <FilledPill as="a" href="/#contact" size="md" onClick={closeAll}>
                {ctaLabel}
              </FilledPill>
            </div>
          </nav>
        )}
        {serviceMenu && view === "services" && (
          <nav className="flex flex-col">
            <button
              ref={backButtonRef}
              type="button"
              onClick={() => {
                pendingFocusRef.current = "trigger";
                setView("main");
              }}
              className={`${navItemClass} flex items-center gap-2`}
            >
              <ChevronLeftIcon className="h-5 w-5 shrink-0" />
              {serviceMenu.backLabel}
            </button>
            <a
              href={serviceMenu.overviewHref}
              onClick={closeAll}
              className={navItemClass}
            >
              {serviceMenu.overviewLabel}
            </a>
            {serviceMenu.items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={closeAll}
                className={navItemClass}
              >
                {item.label}
              </a>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}

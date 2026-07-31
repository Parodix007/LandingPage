"use client";

import { useEffect, useRef, useState } from "react";
import { PILL_FOCUS } from "@/components/ui/pillBase";
import type { NavLink } from "./NavMobileMenu";

// Desktop-only leaf — the mobile equivalent is NavMobileMenu's serviceMenu submenu. Mirrors
// NavMobileMenu's Escape/outside-click/focus-return pattern (no scroll-lock, no focus trap —
// the panel stays naturally reachable below the trigger). Opens on hover AND on click/keyboard:
// :hover alone fails WCAG 2.1.1 for keyboard users, who have no way to hover.
export function NavServicesMenu({
  triggerLabel,
  overviewHref,
  overviewLabel,
  items,
}: {
  triggerLabel: string;
  overviewHref: string;
  overviewLabel: string;
  items: NavLink[];
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        // Standard a11y for a dropdown: Esc returns focus to the control that opened it.
        triggerRef.current?.focus();
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

  function onBlur(e: React.FocusEvent<HTMLDivElement>) {
    // Tabbing (or clicking, on platforms that focus on click) out of the trigger+panel closes
    // it — relatedTarget is the element gaining focus, null when focus leaves the document.
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setOpen(false);
    }
  }

  return (
    <div
      ref={rootRef}
      // h-16 matches the sticky header's row height (Nav.tsx: `flex h-16 items-center`), so
      // `top-full` on the panel below resolves against the bottom of the *header*, not the
      // bottom of this 23px-tall button — mirrors NavMobileMenu's documented "panel resolves
      // against the sticky header" anchoring. Without it the panel's top lands mid-header
      // (the button is vertically centered inside the 65px bar) and overlaps it.
      className="relative hidden h-16 items-center md:flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={onBlur}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="nav-services-panel"
        // `aria-expanded` advertises a toggle, so keyboard activation must actually toggle it —
        // otherwise Enter on an already-open trigger does nothing, which fails keyboard users.
        // But a real mouse click can't just toggle either: it fires `mouseenter` on the root
        // first (already opening the panel via hover), so a naive toggle would immediately
        // re-close it on the same click. We tell the two apart via `event.detail`: a synthetic
        // click dispatched by the browser for a keyboard activation (Enter/Space) has no
        // coordinates or click count, so `detail` is 0; a genuine mouse click has `detail >= 1`.
        // Keyboard (`detail === 0`) toggles; mouse (`detail >= 1`) always opens. Closing
        // otherwise is Escape / outside click / mouseleave, per the a11y contract above.
        onClick={(e) => setOpen((v) => (e.detail === 0 ? !v : true))}
        // flex h-full items-center fills the h-16 wrapper so the hover/click target spans the
        // whole header row (no dead zone above/below the label), while the label itself stays
        // visually centered exactly as before.
        className={`${PILL_FOCUS} flex h-full items-center rounded-[var(--radius-input)] text-[15px] text-ink-85 hover:text-white`}
      >
        {triggerLabel}
      </button>
      {/* Plain <a> siblings of the trigger button — never nested inside it (axe nested-interactive). */}
      <div
        id="nav-services-panel"
        hidden={!open}
        className="absolute left-0 top-full w-max min-w-[220px] rounded-[var(--radius-input)] border border-border-08 bg-surface py-2"
      >
        <a
          href={overviewHref}
          className={`${PILL_FOCUS} block rounded-[var(--radius-input)] px-4 py-2 text-[15px] text-ink-85 hover:text-white`}
        >
          {overviewLabel}
        </a>
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`${PILL_FOCUS} block rounded-[var(--radius-input)] px-4 py-2 text-[15px] text-ink-85 hover:text-white`}
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
}

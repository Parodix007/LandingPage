"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { PILL_FOCUS } from "./pillBase";
import { CloseIcon } from "./icons";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  // Changes when the modal's content is swapped in place (historically service → case, Task 5;
  // that trigger retired with the service modal — docs/superpowers/specs/2026-07-22-services-
  // slider-design.md — the mechanism itself stays, regression-tested via providers.test.tsx).
  // The keydown handler is a React onKeyDown on the overlay div, so if the swap trigger lived
  // inside the old content and unmounts, focus would fall to <body> (an ancestor of the
  // overlay) and Esc/Tab-trap keydowns would never reach the handler again. Including this
  // in the focus effect deps pulls focus back to × on every swap, keeping focus inside the
  // modal. Optional — omitting it preserves the original open-only focus behaviour.
  contentKey?: string | number;
};

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Presentational shell + focus trap + Esc/backdrop close only (HANDOFF §4, SPEC §6.2-6.3).
// Scroll-lock and focus-return on close are ModalRoot's job (Task 3), not this component's.
export function Modal({ open, onClose, labelledBy, children, contentKey }: ModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open, contentKey]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const nodes = cardRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!nodes?.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      onClick={onClose}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/72 p-8 backdrop-blur-[14px]"
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[92vh] w-full max-w-[min(1080px,94vw)] overflow-y-auto rounded-[var(--radius-card)] border border-border-12 bg-surface p-8 sm:p-12"
      >
        <button
          ref={closeRef}
          type="button"
          aria-label="Zamknij"
          onClick={onClose}
          className={`hit-44 ${PILL_FOCUS} absolute right-6 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-border-20 text-ink-70 transition-colors duration-[250ms] hover:border-accent hover:text-white`}
        >
          <CloseIcon className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

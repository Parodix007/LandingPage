"use client";

import { useCallback, useEffect, useRef, useState, type AnimationEvent, type MouseEvent, type ReactNode } from "react";
import { HOVER_BORDER } from "@/components/ui/cardHover";

const CLOSE_MS = 280;
type DisclosureState = "closed" | "opening" | "open" | "closing";

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ServiceDisclosure({ title, children }: { title: string; children: ReactNode }) {
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<DisclosureState>("closed");
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }, []);

  const finishClose = useCallback(() => {
    clearCloseTimer();
    setState((current) => current === "closing" ? "closed" : current);
  }, [clearCloseTimer]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  function toggleDisclosure() {
    if (state === "closed" || state === "closing") {
      clearCloseTimer();
      setState("opening");
      setState("open");
      return;
    }
    if (reducedMotion()) {
      clearCloseTimer();
      setState("closed");
      return;
    }
    clearCloseTimer();
    setState("closing");
    closeTimerRef.current = setTimeout(finishClose, CLOSE_MS);
  }

  function handleSummaryClick(event: MouseEvent<HTMLElement>) {
    event.preventDefault();
    toggleDisclosure();
  }

  function handleAnimationEnd(event: AnimationEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || stateRef.current !== "closing") return;
    finishClose();
  }

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    // React skips animation events in jsdom when AnimationEvent is unavailable;
    // this native listener keeps the same production event usable in tests and older browsers.
    const handleNativeAnimationEnd = (event: Event) => {
      if (event.target !== event.currentTarget || stateRef.current !== "closing") return;
      finishClose();
    };
    content.addEventListener("animationend", handleNativeAnimationEnd);
    return () => content.removeEventListener("animationend", handleNativeAnimationEnd);
  }, [finishClose]);

  const contentClass = state === "closing"
    ? " service-disclosure-content-closing"
    : state === "opening" || state === "open"
      ? " service-disclosure-content-open"
      : "";

  return (
    <details
      open={state !== "closed"}
      className={`service-disclosure service-card relative overflow-hidden rounded-[var(--radius-card)] border border-border-08 bg-surface p-6 ${HOVER_BORDER}${state === "closing" ? " service-disclosure-closing" : ""}`}
    >
      <span aria-hidden="true" className="card-glow pointer-events-none -right-[80px] -top-[80px] h-[220px] w-[220px] [--glow-color:color-mix(in_oklch,var(--color-accent)_16%,transparent)] service-card-glow-interactive" />
      <summary onClick={handleSummaryClick} className="relative z-[1] flex cursor-pointer items-center justify-between gap-4 text-[18px] font-semibold">
        <span>{title}</span>
        <svg className="service-disclosure-chevron shrink-0" aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </summary>
      <div ref={contentRef} data-disclosure-content onAnimationEnd={handleAnimationEnd} className={`relative z-[1] service-disclosure-content${contentClass}`}>
        <div className="min-h-0 overflow-hidden">{children}</div>
      </div>
    </details>
  );
}

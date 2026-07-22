"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { scrollToContact } from "@/lib/scroll";

// SPEC §6.2 — BINDING contract, consumed by CardActions/ModalCta/ContactForm (fan-out).
// Slimmed for the contact-form simplification: the form no longer carries a service picker, so
// there is no selection state left here — just the scroll + focus primitives a modal CTA (or
// the services-slider tile CTA, docs/superpowers/specs/2026-07-22-services-slider-design.md)
// needs to hand off to the contact form.
type InquiryContextValue = {
  requestContactScroll: () => void;
  focusContactField: () => void;
};

const InquiryContext = createContext<InquiryContextValue | null>(null);
// A ref-backed registrar so ContactForm can (un)register its focus handler on mount/unmount
// without forcing InquiryProvider's consumers to rerender (SPEC §6.2).
const RegisterFocusContext = createContext<(fn: (() => void) | null) => void>(() => {});

export function InquiryProvider({ children }: { children: ReactNode }) {
  const focusHandler = useRef<(() => void) | null>(null);

  const requestContactScroll = useCallback(() => scrollToContact(), []);
  const focusContactField = useCallback(() => focusHandler.current?.(), []);
  const registerContactFocus = useCallback((fn: (() => void) | null) => {
    focusHandler.current = fn;
  }, []);

  // Callbacks are already stable (useCallback with empty deps), so this memo's identity never
  // changes across renders.
  const value = useMemo<InquiryContextValue>(
    () => ({ requestContactScroll, focusContactField }),
    [requestContactScroll, focusContactField],
  );

  return (
    <RegisterFocusContext.Provider value={registerContactFocus}>
      <InquiryContext.Provider value={value}>{children}</InquiryContext.Provider>
    </RegisterFocusContext.Provider>
  );
}

export function useInquiry(): InquiryContextValue {
  const ctx = useContext(InquiryContext);
  if (!ctx) throw new Error("useInquiry must be used within InquiryProvider");
  return ctx;
}

// ContactForm registers a handler here that focuses its name input (SPEC §6.2); ModalRoot's
// CTA path calls it (via focusContactField) after the scroll to #contact. Expected to run
// inside InquiryProvider; the no-op default registrar is intentional so a consumer mounted
// without the provider degrades safely instead of throwing.
export function useRegisterContactFocus(): (fn: (() => void) | null) => void {
  return useContext(RegisterFocusContext);
}

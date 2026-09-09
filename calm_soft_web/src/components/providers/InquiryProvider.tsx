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
// needs to hand off to the contact form. `prefillContactMessage` was added for the KSeF product
// pages (SPEC §6.2, 2026-09-09 ksef-product-pages design, "Krok 3") — plan/savings CTAs there
// prefill the message field with a specific ask before scrolling to #contact.
type InquiryContextValue = {
  requestContactScroll: () => void;
  focusContactField: () => void;
  prefillContactMessage: (text: string) => void;
};

const InquiryContext = createContext<InquiryContextValue | null>(null);
// A ref-backed registrar so ContactForm can (un)register its focus handler on mount/unmount
// without forcing InquiryProvider's consumers to rerender (SPEC §6.2).
const RegisterFocusContext = createContext<(fn: (() => void) | null) => void>(() => {});
// Same ref-backed pattern for the message-prefill handler (SPEC §6.2, 2026-09-09 ksef design).
const RegisterPrefillContext = createContext<(fn: ((text: string) => void) | null) => void>(
  () => {},
);

export function InquiryProvider({ children }: { children: ReactNode }) {
  const focusHandler = useRef<(() => void) | null>(null);
  const prefillHandler = useRef<((text: string) => void) | null>(null);

  const requestContactScroll = useCallback(() => scrollToContact(), []);
  const focusContactField = useCallback(() => focusHandler.current?.(), []);
  const prefillContactMessage = useCallback((text: string) => prefillHandler.current?.(text), []);
  const registerContactFocus = useCallback((fn: (() => void) | null) => {
    focusHandler.current = fn;
  }, []);
  const registerContactPrefill = useCallback((fn: ((text: string) => void) | null) => {
    prefillHandler.current = fn;
  }, []);

  // Callbacks are already stable (useCallback with empty deps), so this memo's identity never
  // changes across renders.
  const value = useMemo<InquiryContextValue>(
    () => ({ requestContactScroll, focusContactField, prefillContactMessage }),
    [requestContactScroll, focusContactField, prefillContactMessage],
  );

  return (
    <RegisterFocusContext.Provider value={registerContactFocus}>
      <RegisterPrefillContext.Provider value={registerContactPrefill}>
        <InquiryContext.Provider value={value}>{children}</InquiryContext.Provider>
      </RegisterPrefillContext.Provider>
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

// ContactForm registers a handler here that prefills its message field (SPEC §6.2, 2026-09-09
// ksef design); KSeF plan/savings CTAs call it (via prefillContactMessage) before scrolling to
// #contact. Same safe-no-op-default pattern as useRegisterContactFocus.
export function useRegisterContactPrefill(): (fn: ((text: string) => void) | null) => void {
  return useContext(RegisterPrefillContext);
}

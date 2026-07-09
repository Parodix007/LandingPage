"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ServiceId } from "@/content/types";
import { scrollToContact } from "@/lib/scroll";

// SPEC §6.2 — BINDING contract, consumed by CardActions/ModalCta/ContactForm (fan-out).
type InquiryContextValue = {
  selectedService: ServiceId | null;
  selectService: (id: ServiceId | null) => void;
  requestContactScroll: () => void;
  focusSelectedServiceRadio: () => void;
};

const InquiryContext = createContext<InquiryContextValue | null>(null);
// A ref-backed registrar so ContactForm can (un)register its focus handler on mount/unmount
// without forcing InquiryProvider's consumers to rerender (SPEC §6.2).
const RegisterFocusContext = createContext<(fn: (() => void) | null) => void>(() => {});

export function InquiryProvider({ children }: { children: ReactNode }) {
  const [selectedService, setSelectedService] = useState<ServiceId | null>(null);
  const focusHandler = useRef<(() => void) | null>(null);

  const selectService = useCallback((id: ServiceId | null) => setSelectedService(id), []);
  const requestContactScroll = useCallback(() => scrollToContact(), []);
  const focusSelectedServiceRadio = useCallback(() => focusHandler.current?.(), []);
  const registerServiceRadioFocus = useCallback((fn: (() => void) | null) => {
    focusHandler.current = fn;
  }, []);

  // Callbacks are already stable (useCallback with empty deps); memo keyed on the only
  // reactive field so the context identity changes only when the selection does — parity
  // with ModalProvider, honouring the "avoid needless rerenders" intent (SPEC §6.2).
  const value = useMemo<InquiryContextValue>(
    () => ({ selectedService, selectService, requestContactScroll, focusSelectedServiceRadio }),
    [selectedService, selectService, requestContactScroll, focusSelectedServiceRadio],
  );

  return (
    <RegisterFocusContext.Provider value={registerServiceRadioFocus}>
      <InquiryContext.Provider value={value}>{children}</InquiryContext.Provider>
    </RegisterFocusContext.Provider>
  );
}

export function useInquiry(): InquiryContextValue {
  const ctx = useContext(InquiryContext);
  if (!ctx) throw new Error("useInquiry must be used within InquiryProvider");
  return ctx;
}

// ContactForm registers its radio-focus handler here (SPEC §6.2); ModalRoot's CTA path
// calls it (via focusSelectedServiceRadio) after the scroll to #contact. Expected to run
// inside InquiryProvider; the no-op default registrar is intentional so a consumer mounted
// without the provider degrades safely instead of throwing.
export function useRegisterServiceRadioFocus(): (fn: (() => void) | null) => void {
  return useContext(RegisterFocusContext);
}

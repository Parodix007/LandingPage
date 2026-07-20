"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CaseStudy, Demo, Service, ServiceId } from "@/content/types";
import { Modal } from "@/components/ui/Modal";
import { ServiceModalContent } from "@/components/sections/ServiceModalContent";
import { CaseModalContent } from "@/components/sections/CaseModalContent";
import { DemoModalContent } from "@/components/sections/DemoModalContent";
import { useInquiry } from "./InquiryProvider";

type ModalState =
  | { kind: "service"; id: ServiceId }
  | { kind: "case"; slug: string }
  | { kind: "demo"; slug: string }
  | null;

// SPEC §6.2 — BINDING contract, consumed by CardActions (fan-out).
type ModalContextValue = {
  openServiceModal: (id: ServiceId) => void;
  openCaseModal: (slug: string) => void;
  openDemoModal: (slug: string) => void;
  closeModals: () => void;
};

const ModalContext = createContext<ModalContextValue | null>(null);
const CtaCloseContext = createContext<(serviceId: ServiceId) => void>(() => {});

// ModalRoot lives inside ModalProvider: ONE state owner, ONE <Modal> instance with swapped
// content — this is what makes scroll-lock and the focus trap persist uninterrupted across
// a service → case switch (SPEC §6.2-6.3), instead of unmounting/remounting a modal per kind.
export function ModalProvider({
  services,
  cases,
  demos,
  children,
}: {
  services: Service[];
  cases: CaseStudy[];
  demos: Demo[];
  children: ReactNode;
}) {
  const [state, setState] = useState<ModalState>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const { selectService, requestContactScroll, focusSelectedServiceRadio } = useInquiry();

  const isOpen = state !== null;
  useEffect(() => {
    // Lock is keyed on "is ANY modal open", not on modal identity — switching service→case
    // re-sets the same "hidden" value and never has a tick where the body unlocks.
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const open = useCallback((next: NonNullable<ModalState>) => {
    // Capture the opener only at the START of a chain (first open) — a service→case switch
    // must not overwrite it, so Esc/backdrop/× from the case modal returns focus to whatever
    // originally opened the service modal.
    if (!openerRef.current) {
      openerRef.current = document.activeElement as HTMLElement | null;
    }
    setState(next);
  }, []);

  const openServiceModal = useCallback(
    (id: ServiceId) => {
      // Defensive: never open with an id that isn't in the array — an empty overlay would
      // engage the scroll-lock and leave aria-labelledby dangling with no #modal-headline.
      if (!services.some((s) => s.id === id)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[ModalProvider] openServiceModal: unknown service id "${id}" — ignoring`);
        }
        return;
      }
      open({ kind: "service", id });
    },
    [open, services],
  );
  const openCaseModal = useCallback(
    (slug: string) => {
      if (!cases.some((c) => c.slug === slug)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[ModalProvider] openCaseModal: unknown case slug "${slug}" — ignoring`);
        }
        return;
      }
      open({ kind: "case", slug });
    },
    [open, cases],
  );
  const openDemoModal = useCallback(
    (slug: string) => {
      if (!demos.some((d) => d.slug === slug)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[ModalProvider] openDemoModal: unknown demo slug "${slug}" — ignoring`);
        }
        return;
      }
      open({ kind: "demo", slug });
    },
    [open, demos],
  );

  const closeModals = useCallback(() => {
    setState(null);
    openerRef.current?.focus();
    openerRef.current = null;
  }, []);

  const ctaClose = useCallback(
    (serviceId: ServiceId) => {
      setState(null);
      // CTA close: focus does NOT return to the opener (it would fight the scroll to the
      // form) — clear it so a later Esc/backdrop close in a fresh chain doesn't reuse it.
      openerRef.current = null;
      selectService(serviceId);
      // Not cancelled on unmount by design: the provider wraps the whole page and never
      // unmounts during the app's life, and both callees are null-safe (scrollToContact
      // no-ops without #contact; focusSelectedServiceRadio no-ops without a registered handler).
      requestAnimationFrame(() => {
        requestContactScroll();
        focusSelectedServiceRadio();
      });
    },
    [selectService, requestContactScroll, focusSelectedServiceRadio],
  );

  const modalContextValue = useMemo<ModalContextValue>(
    () => ({ openServiceModal, openCaseModal, openDemoModal, closeModals }),
    [openServiceModal, openCaseModal, openDemoModal, closeModals],
  );

  const service = state?.kind === "service" ? services.find((s) => s.id === state.id) : undefined;
  const caseStudy = state?.kind === "case" ? cases.find((c) => c.slug === state.slug) : undefined;
  const demo = state?.kind === "demo" ? demos.find((d) => d.slug === state.slug) : undefined;

  // Identifies the currently-rendered content so Modal can pull focus back to × when the
  // content is swapped in place (service→case) while `open` stays true (SPEC §6.3 focus).
  const contentKey = state
    ? state.kind === "service"
      ? `service:${state.id}`
      : state.kind === "case"
        ? `case:${state.slug}`
        : `demo:${state.slug}`
    : undefined;

  return (
    <ModalContext.Provider value={modalContextValue}>
      <CtaCloseContext.Provider value={ctaClose}>
        {children}
        <Modal open={isOpen} onClose={closeModals} labelledBy="modal-headline" contentKey={contentKey}>
          {service && <ServiceModalContent service={service} />}
          {caseStudy && <CaseModalContent caseStudy={caseStudy} />}
          {demo && <DemoModalContent demo={demo} />}
        </Modal>
      </CtaCloseContext.Provider>
    </ModalContext.Provider>
  );
}

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
}

// Consumed by ModalCta (fan-out) — the CTA-close path (§6.3): close → select service →
// rAF → scroll → focus radio. No opener focus-return on this path. Expected to run inside
// ModalProvider; the no-op default is intentional so a stray consumer degrades safely
// rather than throwing (matches the ref-backed registrar pattern).
export function useModalCtaClose(): (serviceId: ServiceId) => void {
  return useContext(CtaCloseContext);
}

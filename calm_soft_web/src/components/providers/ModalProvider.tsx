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
import type { CaseStudy, Demo } from "@/content/types";
import { Modal } from "@/components/ui/Modal";
import { CaseModalContent } from "@/components/sections/CaseModalContent";
import { DemoModalContent } from "@/components/sections/DemoModalContent";
import { useInquiry } from "./InquiryProvider";

type ModalState = { kind: "case"; slug: string } | { kind: "demo"; slug: string } | null;

// SPEC §6.2, as amended by docs/superpowers/specs/2026-07-22-services-slider-design.md —
// BINDING contract, consumed by CardActions (fan-out). openServiceModal/the "service" kind
// were removed with the service modal: the services-slider tile CTA scrolls to #contact
// directly (mirroring the retired service-card "start" action), never opens a modal.
type ModalContextValue = {
  openCaseModal: (slug: string) => void;
  openDemoModal: (slug: string) => void;
  closeModals: () => void;
};

const ModalContext = createContext<ModalContextValue | null>(null);
const CtaCloseContext = createContext<() => void>(() => {});

// ModalRoot lives inside ModalProvider: ONE state owner, ONE <Modal> instance with swapped
// content — this is what makes scroll-lock and the focus trap persist uninterrupted across a
// case ↔ demo switch (SPEC §6.2-6.3), instead of unmounting/remounting a modal per kind. (The
// service modal, and the service→case in-content switch it used to support, retired with the
// 2026-07-22 services-slider design.)
export function ModalProvider({
  cases,
  demos,
  children,
}: {
  cases: CaseStudy[];
  demos: Demo[];
  children: ReactNode;
}) {
  const [state, setState] = useState<ModalState>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const { requestContactScroll, focusContactField } = useInquiry();

  const isOpen = state !== null;
  useEffect(() => {
    // Lock is keyed on "is ANY modal open", not on modal identity — switching case↔demo
    // re-sets the same "hidden" value and never has a tick where the body unlocks.
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const open = useCallback((next: NonNullable<ModalState>) => {
    // Capture the opener only at the START of a chain (first open) — an in-content case↔demo
    // switch must not overwrite it, so Esc/backdrop/× returns focus to whatever originally
    // opened the chain.
    if (!openerRef.current) {
      openerRef.current = document.activeElement as HTMLElement | null;
    }
    setState(next);
  }, []);

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

  const ctaClose = useCallback(() => {
    setState(null);
    // CTA close: focus does NOT return to the opener (it would fight the scroll to the
    // form) — clear it so a later Esc/backdrop close in a fresh chain doesn't reuse it.
    openerRef.current = null;
    // Not cancelled on unmount by design: the provider wraps the whole page and never
    // unmounts during the app's life, and both callees are null-safe (scrollToContact
    // no-ops without #contact; focusContactField no-ops without a registered handler).
    requestAnimationFrame(() => {
      requestContactScroll();
      focusContactField();
    });
  }, [requestContactScroll, focusContactField]);

  const modalContextValue = useMemo<ModalContextValue>(
    () => ({ openCaseModal, openDemoModal, closeModals }),
    [openCaseModal, openDemoModal, closeModals],
  );

  const caseStudy = state?.kind === "case" ? cases.find((c) => c.slug === state.slug) : undefined;
  const demo = state?.kind === "demo" ? demos.find((d) => d.slug === state.slug) : undefined;

  // Identifies the currently-rendered content so Modal can pull focus back to × when the
  // content is swapped in place (historically service→case; that trigger retired with the
  // service modal — see providers.test.tsx's contentKey-replacement test, kept as regression
  // coverage for the mechanism itself) while `open` stays true (SPEC §6.3 focus).
  const contentKey = state
    ? state.kind === "case"
      ? `case:${state.slug}`
      : `demo:${state.slug}`
    : undefined;

  return (
    <ModalContext.Provider value={modalContextValue}>
      <CtaCloseContext.Provider value={ctaClose}>
        {children}
        <Modal open={isOpen} onClose={closeModals} labelledBy="modal-headline" contentKey={contentKey}>
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

// Consumed by ModalCta (fan-out) — the CTA-close path (§6.3): close → unlock → rAF →
// scroll → focus the contact form's name field. No opener focus-return on this path.
// Expected to run inside ModalProvider; the no-op default is intentional so a stray
// consumer degrades safely rather than throwing (matches the ref-backed registrar pattern).
export function useModalCtaClose(): () => void {
  return useContext(CtaCloseContext);
}

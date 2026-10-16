"use client";

import { useEffect } from "react";
import { useInquiry } from "@/components/providers/InquiryProvider";

export function KsefDiscountPrefill({ prefill }: { prefill: string }) {
  const { prefillContactMessage, requestContactScroll, focusContactField } = useInquiry();

  useEffect(() => {
    const intent = new URLSearchParams(window.location.search).get("rabat");
    if (intent !== "inspunkty") return;

    const frame = window.requestAnimationFrame(() => {
      prefillContactMessage(prefill);
      requestContactScroll();
      focusContactField();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusContactField, prefill, prefillContactMessage, requestContactScroll]);

  return null;
}

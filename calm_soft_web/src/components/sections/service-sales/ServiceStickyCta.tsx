"use client";

import { useEffect, useState } from "react";
import { KsefPlanCta } from "@/components/interactive/KsefPlanCta";
import { FilledPill } from "@/components/ui/FilledPill";
import { HotSaleIcon } from "@/components/ui/HotSaleIcon";

type FloatingConfig = { startId: string; hideIds?: string[]; prefill?: string };
type ServiceStickyCtaProps = { href: string; label: string; floating?: FloatingConfig };

function DefaultServiceStickyCta({ href, label }: { href: string; label: string }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const target = document.getElementById("contact");
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), { threshold: 0.05 });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  return <FilledPill size="lg" as="a" href={href} aria-hidden={!visible} tabIndex={visible ? 0 : -1} className={`fixed inset-x-4 bottom-4 z-[60] min-h-11 text-center shadow-lg min-[900px]:hidden ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}>{label}</FilledPill>;
}

function FloatingServiceStickyCta({ href, label, config }: { href: string; label: string; config: FloatingConfig }) {
  const [visible, setVisible] = useState(false);
  const startId = config.startId;
  const hideKey = (config.hideIds ?? []).join("\u0000");

  useEffect(() => {
    const start = document.getElementById(startId);
    if (!start) return;
    const hideTargets = (hideKey ? hideKey.split("\u0000") : []).map((id) => document.getElementById(id)).filter((target): target is HTMLElement => target !== null);
    const state = { startPassed: false, hideVisible: new Map<Element, boolean>() };
    const update = () => setVisible(state.startPassed && ![...state.hideVisible.values()].some(Boolean));
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === start) {
          state.startPassed = !entry.isIntersecting && entry.boundingClientRect.bottom <= 65;
        } else if (hideTargets.some((target) => target === entry.target)) {
          state.hideVisible.set(entry.target, entry.isIntersecting);
        }
      }
      update();
    }, { rootMargin: "-65px 0px 0px 0px", threshold: 0 });
    observer.observe(start);
    hideTargets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [startId, hideKey]);

  const className = `service-sticky-cta-floating fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-[60] min-h-11 max-w-[calc(100vw-2rem)] shadow-lg min-[900px]:bottom-6 min-[900px]:right-6 ${visible ? "service-sticky-cta-floating-pulse translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`;
  if (config.prefill) {
    return <KsefPlanCta label={label} prefill={config.prefill} leadingIcon={<HotSaleIcon className="h-7 w-7 shrink-0" />} aria-hidden={!visible} tabIndex={visible ? 0 : -1} className={className} />;
  }
  return <FilledPill size="lg" as="a" href={href} aria-hidden={!visible} tabIndex={visible ? 0 : -1} className={className}><span className="inline-flex items-center gap-2"><HotSaleIcon className="h-7 w-7 shrink-0" />{label}</span></FilledPill>;
}

export function ServiceStickyCta({ href, label, floating }: ServiceStickyCtaProps) {
  if (!floating) return <DefaultServiceStickyCta href={href} label={label} />;
  const key = `${floating.startId}|${(floating.hideIds ?? []).join("\u0000")}|${floating.prefill ?? ""}`;
  return <FloatingServiceStickyCta key={key} href={href} label={label} config={floating} />;
}

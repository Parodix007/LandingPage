"use client";

import { useEffect, useRef, useState } from "react";
import { getDemoBySlug } from "@/content/demos";
import { serviceSalesUi, type SalesDemoRef } from "@/content/serviceSales";
import { solutions } from "@/content/solutions";
import { site } from "@/content/site";
import { Chip } from "@/components/ui/Chip";
import { DemoLogo } from "@/components/ui/DemoLogo";
import { Watermark } from "@/components/ui/Watermark";
import { CarouselArrowButton } from "@/components/ui/CarouselArrowButton";
import { CardActions } from "@/components/interactive/CardActions";
import { useCarousel } from "@/components/interactive/useCarousel";
import { HOVER_LIFT } from "@/components/ui/cardHover";

export function ServiceDemoShowcase({ mode, title, intro, demos }: { mode: "grid" | "carousel"; title?: string; intro?: string; demos: (string | SalesDemoRef)[] }) {
  const [carouselReady, setCarouselReady] = useState(mode !== "carousel");
  const showcaseViewportRef = useRef<HTMLDivElement | null>(null);
  const refs = demos.map((item) => typeof item === "string" ? { slug: item, body: "" } : item);
  const resolved = refs.map((ref) => ({ ...ref, demo: getDemoBySlug(ref.slug) })).filter((item) => item.demo);
  const carousel = useCarousel(resolved.length);

  useEffect(() => {
    if (mode !== "carousel" || carouselReady) return;
    let disposed = false;
    const handleLoad = () => {
      if (!disposed) setCarouselReady(true);
    };
    window.addEventListener("load", handleLoad);
    if (document.readyState === "complete") queueMicrotask(handleLoad);
    if (typeof IntersectionObserver === "undefined" || !showcaseViewportRef.current) {
      queueMicrotask(handleLoad);
      return () => {
        disposed = true;
        window.removeEventListener("load", handleLoad);
      };
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        handleLoad();
        observer.disconnect();
      }
    }, { rootMargin: "0px" });
    observer.observe(showcaseViewportRef.current);
    return () => {
      disposed = true;
      window.removeEventListener("load", handleLoad);
      observer.disconnect();
    };
  }, [carouselReady, mode]);

  return (
    <section role="region" aria-label={serviceSalesUi.demoRegion} className="mt-16">
      {title && <>
        <h2 className="text-[26px] font-bold">{title}</h2>
        {intro && <p className="mt-4 max-w-[760px] text-[16px] leading-[1.6] text-ink-70">{intro}</p>}
      </>}
      <div className={mode === "carousel" ? "relative mt-6" : "mt-6"}>
        {mode === "carousel" && <div className="mb-4 flex justify-end gap-2">
          <CarouselArrowButton direction="previous" label={serviceSalesUi.previousDemo} atBoundary={carousel.step === 0} onClick={carousel.prev} />
          <CarouselArrowButton direction="next" label={serviceSalesUi.nextDemo} atBoundary={carousel.step === resolved.length - 1} onClick={carousel.next} />
        </div>}
        <div ref={mode === "carousel" ? showcaseViewportRef : undefined} data-testid={mode === "carousel" ? "service-demo-viewport" : undefined} className={mode === "carousel" ? "overflow-hidden" : ""}>
          <div
            data-testid="service-demo-track"
            className={mode === "carousel" ? "flex gap-4" : "grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-4"}
            style={mode === "carousel" ? { transform: `translateX(calc(${carousel.step} * (-100% - 1rem)))`, transition: "transform 300ms ease" } : undefined}
          >
            {resolved.map((item, index) => {
              const { demo } = item;
              if (!demo) return null;
              const active = mode === "grid" || index === carousel.step;
              return (
                <article
                  key={demo.slug}
                  role="group"
                  aria-hidden={!active}
                  inert={!active || undefined}
                  className={`${mode === "carousel" ? "min-w-0 flex-[0_0_100%]" : ""} card-host service-card service-card-interactive relative flex flex-col overflow-hidden rounded-[var(--radius-grid-card)] border border-border-08 bg-surface p-0 ${HOVER_LIFT}`}
                >
                  <span aria-hidden="true" className="card-glow pointer-events-none -right-[80px] -top-[80px] h-[220px] w-[220px] [--glow-color:color-mix(in_oklch,var(--color-accent)_16%,transparent)]" />
                  <div className="relative z-[1] aspect-[16/10] w-full overflow-hidden border-b border-border-08">
                    {/* eslint-disable-next-line @next/next/no-img-element -- static export keeps canonical demo shots unoptimized */}
                    <img src={mode === "grid" || carouselReady ? demo.shot : undefined} data-src={mode === "carousel" && !carouselReady ? demo.shot : undefined} alt={demo.shotAlt} width={1440} height={900} loading="lazy" decoding="async" className="h-full w-full object-cover object-top [&:not([src])]:hidden" />
                    {mode === "carousel" && index === 0 && <noscript>
                      {/* eslint-disable-next-line @next/next/no-img-element -- no-JS static fallback for the canonical first demo shot */}
                      <img src={demo.shot} alt={demo.shotAlt} width={1440} height={900} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover object-top" />
                    </noscript>}
                  </div>
                  <div className="z-[1] p-6">
                    <div className="flex items-start justify-between gap-3">
                      <Chip tone="accent2">{solutions.page.proposalLabel || serviceSalesUi.proposal}</Chip>
                      <span aria-hidden="true" className="service-card-watermark shrink-0"><Watermark /></span>
                    </div>
                    <h3 className="mt-4 text-[18px] font-semibold">{demo.logoId ? <DemoLogo logo={demo.logoId} instanceId={`service-${demo.slug}`} className="h-8 w-auto" /> : demo.name}</h3>
                    {item.body && <p className="mt-2 text-[15px] text-ink-70">{item.body}</p>}
                    <div className="mt-5 flex flex-wrap items-center gap-4">
                      <CardActions kind="demo-card" demoSlug={demo.slug} readLabel={item.cta ?? site.sections.demos.detailCta} ariaLabel={`${item.cta ?? site.sections.demos.detailCta} ${demo.name}`} />
                      <a className="relative z-10 text-[14px] text-accent underline-offset-2 hover:underline" href={demo.href} target="_blank" rel="noopener noreferrer">{site.sections.demos.liveCta}</a>
                    </div>
                    {demo.desktopOnly && <p className="mt-3 text-[12px] text-ink-50">{site.sections.demos.desktopNote}</p>}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

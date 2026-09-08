import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ServiceDemoShowcase } from "./ServiceDemoShowcase";
import { ModalProvider } from "@/components/providers/ModalProvider";
import { cases } from "@/content/cases";
import { demos } from "@/content/demos";
import { InquiryProvider } from "@/components/providers/InquiryProvider";
import { serviceSales, serviceSalesUi } from "@/content/serviceSales";
import { solutions } from "@/content/solutions";
import { site } from "@/content/site";
import { getDemoBySlug } from "@/content/demos";
import { MockIntersectionObserver } from "@/test/setup";

describe("ServiceDemoShowcase", () => {
  function renderShowcase(mode: "grid" | "carousel", demosToRender: typeof serviceSales.web.demos = serviceSales.web.demos) {
    return render(<InquiryProvider><ModalProvider cases={cases} demos={demos}><ServiceDemoShowcase mode={mode} demos={demosToRender} /></ModalProvider></InquiryProvider>);
  }

  it.each([["core", serviceSales.core.demos], ["automation", serviceSales.automation.demos]])("renders %s demos as grid cards with proposal chip, modal CTA, and separate live-demo anchor", (_id, refs) => {
    const { container } = renderShowcase("grid", refs);
    const cards = [...container.querySelectorAll("article")];
    expect(cards).toHaveLength(refs.length);
    refs.forEach((ref, index) => {
      const card = cards[index];
      const demo = getDemoBySlug(ref.slug)!;
      expect(card).toHaveTextContent(solutions.page.proposalLabel);
      expect(card).toHaveTextContent(ref.body);
      expect(within(card).getByRole("button", { name: `${ref.cta} ${demo.name}` })).toBeInTheDocument();
      expect(within(card).getByRole("link", { name: site.sections.demos.liveCta })).toHaveAttribute("href", demo.href);
      expect(card.querySelectorAll("button a, a button")).toHaveLength(0);
    });
  });

  it("opens the existing demo modal from a grid CardActions button", async () => {
    const user = userEvent.setup();
    renderShowcase("grid", serviceSales.core.demos);
    await user.click(screen.getByRole("button", { name: `${serviceSales.core.demos[0].cta} ${getDemoBySlug(serviceSales.core.demos[0].slug)!.name}` }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: getDemoBySlug(serviceSales.core.demos[0].slug)!.tagline })).toBeInTheDocument();
  });

  it("renders web demos as one controlled carousel with an inactive slide hidden", () => {
    renderShowcase("carousel");
    expect(screen.getByRole("region", { name: serviceSalesUi.demoRegion })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: serviceSalesUi.nextDemo })).toBeInTheDocument();
    expect(screen.getAllByRole("group", { hidden: true })).toHaveLength(5);
    expect(screen.getAllByRole("group", { hidden: true })[1]).toHaveAttribute("aria-hidden", "true");
  });

  it("moves the active web slide with next/previous and maintains inert focus boundaries", async () => {
    const user = userEvent.setup();
    const { container } = renderShowcase("carousel");
    const slides = () => [...container.querySelectorAll('[role="group"]')];
    const next = screen.getByRole("button", { name: serviceSalesUi.nextDemo });
    const previous = screen.getByRole("button", { name: serviceSalesUi.previousDemo });
    expect(previous).toHaveAttribute("aria-disabled", "true");
    expect(previous).not.toBeDisabled();
    expect(next).toHaveAttribute("aria-disabled", "false");
    expect(slides()[0]).toHaveAttribute("aria-hidden", "false");
    expect(slides()[0]).not.toHaveAttribute("inert");
    expect(slides()[1]).toHaveAttribute("aria-hidden", "true");
    expect(slides()[1]).toHaveAttribute("inert");
    // jsdom does not implement inert's focus algorithm; the ancestor assertion verifies the
    // native boundary that removes every descendant control from sequential focus in browsers.
    const inactiveControls = [...slides()[1].querySelectorAll("a, button")];
    expect(inactiveControls.length).toBeGreaterThan(0);
    expect(inactiveControls.every((control) => control.closest('[inert="true"], [inert=""]') === slides()[1])).toBe(true);
    await user.click(next);
    expect(slides()[0]).toHaveAttribute("aria-hidden", "true");
    expect(slides()[0]).toHaveAttribute("inert");
    expect(slides()[1]).toHaveAttribute("aria-hidden", "false");
    expect(slides()[1]).not.toHaveAttribute("inert");
    expect(previous).not.toBeDisabled();
    await user.click(previous);
    expect(slides()[0]).toHaveAttribute("aria-hidden", "false");
    expect(slides()[0]).not.toHaveAttribute("inert");
  });

  it("disables carousel controls at the final slide and preserves each live href", async () => {
    const user = userEvent.setup();
    const { container } = renderShowcase("carousel");
    const next = screen.getByRole("button", { name: serviceSalesUi.nextDemo });
    for (let index = 0; index < serviceSales.web.demos.length - 1; index += 1) await user.click(next);
    expect(next).toHaveAttribute("aria-disabled", "true");
    expect(next).not.toBeDisabled();
    expect(screen.getByRole("button", { name: serviceSalesUi.previousDemo })).toHaveAttribute("aria-disabled", "false");
    const allSlides = [...container.querySelectorAll('[role="group"]')];
    serviceSales.web.demos.forEach((ref, index) => {
      expect(within(allSlides[index] as HTMLElement).getByRole("link", { name: site.sections.demos.liveCta, hidden: true })).toHaveAttribute("href", getDemoBySlug(ref.slug)!.href);
    });
  });

  it("renders the desktop-only note only for desktop-only demo cards", () => {
    const { container } = renderShowcase("grid", serviceSales.web.demos);
    const healthlab = [...container.querySelectorAll('[role="group"]')].find((card) => card.textContent?.includes(getDemoBySlug("healthlab")!.name));
    expect(container).toHaveTextContent(site.sections.demos.desktopNote);
    expect(healthlab).toBeTruthy();
    const merdi = [...container.querySelectorAll('[role="group"]')].find((card) => card.textContent?.includes(getDemoBySlug("merdi")!.name));
    expect(merdi).not.toHaveTextContent(site.sections.demos.desktopNote);
  });

  it("renders canonical demo shots and uses logo lockups when available", () => {
    const { container } = renderShowcase("grid", serviceSales.automation.demos);
    const demo = getDemoBySlug(serviceSales.automation.demos[0].slug)!;
    const card = container.querySelector('[role="group"]')!;
    expect(card.querySelector("img")).toHaveAttribute("src", demo.shot);
    expect(card.querySelector("img")).toHaveAttribute("alt", demo.shotAlt);
    expect(card.querySelector("img")).toHaveAttribute("width", "1440");
    expect(card.querySelector("img")).toHaveAttribute("height", "900");
    expect(card.querySelector("img")).toHaveAttribute("loading", "lazy");
    expect(card.querySelector("img")).toHaveAttribute("decoding", "async");
    expect(card.querySelector('[role="img"]')).toBeInTheDocument();
    expect(card.querySelector(".service-card-watermark")).toBeInTheDocument();
  });

  it("uses a single full-width transform track for the web carousel", () => {
    const { container } = renderShowcase("carousel");
    const track = container.querySelector('[data-testid="service-demo-track"]')!;
    const cards = [...track.querySelectorAll('[role="group"]')];
    expect(track).toHaveClass("flex");
    expect(track).not.toHaveClass("overflow-hidden");
    expect(track).toHaveStyle({ transform: "translateX(calc(0 * (-100% - 1rem)))" });
    expect(cards.every((card) => card.className.includes("flex-[0_0_100%]"))).toBe(true);
    expect(cards.filter((card) => card.getAttribute("aria-hidden") !== "true")).toHaveLength(1);
  });

  it("defers carousel image requests until window load and keeps the previous image after next", async () => {
    const readyStateDescriptor = Object.getOwnPropertyDescriptor(document, "readyState");
    Object.defineProperty(document, "readyState", { configurable: true, value: "loading" });
    try {
      const user = userEvent.setup();
      const { container } = renderShowcase("carousel");
      const images = [...container.querySelectorAll("[role=group] img")];
      const firstDemo = getDemoBySlug(serviceSales.web.demos[0].slug)!;
      const secondDemo = getDemoBySlug(serviceSales.web.demos[1].slug)!;
      expect(images[0]).not.toHaveAttribute("src");
      expect(images[0]).toHaveAttribute("data-src", firstDemo.shot);
      expect(images[0]).toHaveClass("[&:not([src])]:hidden");
      expect(images[1]).not.toHaveAttribute("src");
      expect(images[1]).toHaveAttribute("data-src", secondDemo.shot);

      fireEvent(window, new Event("load"));
      await waitFor(() => expect(images[0]).toHaveAttribute("src", firstDemo.shot));
      expect(images[1]).toHaveAttribute("src", secondDemo.shot);
      await user.click(screen.getByRole("button", { name: serviceSalesUi.nextDemo }));
      expect(images[0]).toHaveAttribute("src", firstDemo.shot);
      expect(images[1]).toHaveAttribute("src", secondDemo.shot);
    } finally {
      if (readyStateDescriptor) Object.defineProperty(document, "readyState", readyStateDescriptor);
    }
  });

  it("materializes carousel images when the showcase enters the viewport before load", async () => {
    const readyStateDescriptor = Object.getOwnPropertyDescriptor(document, "readyState");
    Object.defineProperty(document, "readyState", { configurable: true, value: "loading" });
    try {
      const user = userEvent.setup();
      const { container } = renderShowcase("carousel");
      const viewport = container.querySelector('[data-testid="service-demo-viewport"]')!;
      const observer = MockIntersectionObserver.instances.at(-1)!;
      const images = [...container.querySelectorAll("[role=group] img")];
      const firstDemo = getDemoBySlug(serviceSales.web.demos[0].slug)!;
      const secondDemo = getDemoBySlug(serviceSales.web.demos[1].slug)!;
      expect(images[0]).not.toHaveAttribute("src");
      expect(observer.observedTargets).toContain(viewport);
      expect(observer.observedTargets).not.toContain(screen.getByRole("region", { name: serviceSalesUi.demoRegion }));
      observer.triggerIntersect(viewport, true);
      await waitFor(() => expect(images[0]).toHaveAttribute("src", firstDemo.shot));
      expect(images[1]).toHaveAttribute("src", secondDemo.shot);
      await user.click(screen.getByRole("button", { name: serviceSalesUi.nextDemo }));
      expect(images[0]).toHaveAttribute("src", firstDemo.shot);
      expect(images[1]).toHaveAttribute("src", secondDemo.shot);
    } finally {
      if (readyStateDescriptor) Object.defineProperty(document, "readyState", readyStateDescriptor);
    }
  });

  it("includes the first carousel screenshot in a no-script fallback", () => {
    const firstDemo = getDemoBySlug(serviceSales.web.demos[0].slug)!;
    const markup = renderToStaticMarkup(<InquiryProvider><ModalProvider cases={cases} demos={demos}><ServiceDemoShowcase mode="carousel" title={serviceSales.web.demosTitle} intro={serviceSales.web.demosIntro} demos={serviceSales.web.demos} /></ModalProvider></InquiryProvider>);
    const headingIndex = markup.indexOf("<h2");
    const introIndex = markup.indexOf("<p", headingIndex);
    const articleIndex = markup.indexOf('role="group"');
    const wrapperIndex = markup.indexOf("aspect-[16/10]");
    const noScriptIndex = markup.indexOf("<noscript");
    expect(noScriptIndex).toBeGreaterThan(headingIndex);
    expect(noScriptIndex).toBeGreaterThan(introIndex);
    expect(noScriptIndex).toBeGreaterThan(articleIndex);
    expect(noScriptIndex).toBeGreaterThan(wrapperIndex);
    expect(markup).toContain("aspect-[16/10]");
    expect(markup).toContain("h-full w-full object-cover object-top");
    expect(markup).toContain(`<noscript><img src="${firstDemo.shot}"`);
  });

  it("cleans up the load listener and viewport observer on unmount", () => {
    const readyStateDescriptor = Object.getOwnPropertyDescriptor(document, "readyState");
    const removeEventListener = vi.spyOn(window, "removeEventListener");
    Object.defineProperty(document, "readyState", { configurable: true, value: "loading" });
    try {
      const { unmount } = renderShowcase("carousel");
      const observer = MockIntersectionObserver.instances.at(-1)!;
      unmount();
      expect(observer.observedTargets).toHaveLength(0);
      expect(removeEventListener).toHaveBeenCalledWith("load", expect.any(Function));
    } finally {
      removeEventListener.mockRestore();
      if (readyStateDescriptor) Object.defineProperty(document, "readyState", readyStateDescriptor);
    }
  });

  it("accounts for the gap on every carousel step and keeps only one active card", async () => {
    const user = userEvent.setup();
    const { container } = renderShowcase("carousel");
    const next = screen.getByRole("button", { name: serviceSalesUi.nextDemo });
    const track = container.querySelector('[data-testid="service-demo-track"]')!;
    await user.click(next);
    await user.click(next);
    expect(track).toHaveStyle({ transform: "translateX(calc(2 * (-100% - 1rem)))" });
    expect(container.querySelectorAll('[role="group"][aria-hidden="false"]')).toHaveLength(1);
    expect(container.querySelectorAll('[role="group"][inert]')).toHaveLength(4);
    for (let index = 2; index < serviceSales.web.demos.length - 1; index += 1) await user.click(next);
    expect(track).toHaveStyle({ transform: "translateX(calc(4 * (-100% - 1rem)))" });
    expect(track).not.toHaveClass("overflow-hidden");
  });

  it("keeps the watermark in the content row and anchors the stretched action to the card", () => {
    const { container } = renderShowcase("grid", serviceSales.core.demos);
    const card = container.querySelector('[role="group"]')!;
    const watermark = card.querySelector(".service-card-watermark")!;
    const screenshot = card.querySelector("img")!;
    expect(watermark.compareDocumentPosition(screenshot) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    const stretched = card.querySelector(".pill-stretched")!;
    expect(stretched.closest(".card-host")).toBe(card);
    let ancestor = stretched.parentElement;
    while (ancestor && ancestor !== card) {
      expect(ancestor).not.toHaveClass("relative", "absolute");
      ancestor = ancestor.parentElement;
    }
  });

  it("marks demo cards as interactive glow surfaces without nesting interactive elements", () => {
    const { container } = renderShowcase("grid", serviceSales.core.demos);
    const cards = [...container.querySelectorAll('[role="group"]')];
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(card).toHaveClass("service-card-interactive");
      expect(card.querySelector(".card-glow")).toBeInTheDocument();
      let ancestor = card.querySelector(".pill-stretched")?.parentElement;
      while (ancestor && ancestor !== card) {
        expect(ancestor).not.toHaveClass("relative");
        ancestor = ancestor.parentElement;
      }
      expect(ancestor).toBe(card);
      expect(card.querySelectorAll("button a, a button")).toHaveLength(0);
    }
  });
});

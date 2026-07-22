import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { demos } from "@/content/demos";
import { HeroDemoSlider } from "./HeroDemoSlider";

const LABEL = "Live demos";
const LANG_CHIP = "Demo in Polish";
const FLOWS_LABEL = "Key flows";
const TECH_LEGEND = "Technologies I could build this in";
const LIVE_CTA = "Open the live demo ›";
const DEMO_NOTE = "A fully clickable prototype — built to best practices, ready to become a real product.";
const DESKTOP_NOTE = "A back-office panel — built for desktop, not adapted for mobile.";

function getTrack(container: HTMLElement) {
  const track = container.querySelector('[data-testid="hero-demo-track"]') as HTMLElement | null;
  if (!track) throw new Error("hero demo track not found");
  return track;
}

// 2026-07-23 hero-demo-detail-slider design: the component no longer opens the demo modal (the
// modal is untouched but reached from the Demos section/`/demos/` instead), so it no longer
// needs useModal/useInquiry — render it bare, no providers.
function renderSlider() {
  return render(
    <HeroDemoSlider
      demos={demos}
      label={LABEL}
      langChip={LANG_CHIP}
      flowsLabel={FLOWS_LABEL}
      techLegend={TECH_LEGEND}
      liveCta={LIVE_CTA}
      demoNote={DEMO_NOTE}
      desktopNote={DESKTOP_NOTE}
    />,
  );
}

// Live links inside inactive slides sit under aria-hidden="true" — *ByRole excludes them from
// the accessibility tree by default, so every lookup here that may target an inactive slide's
// link passes `{ hidden: true }` to see the full DOM regardless of step.
function getLiveLinks() {
  return screen.getAllByRole("link", { name: LIVE_CTA, hidden: true });
}

describe("HeroDemoSlider", () => {
  it("renders the track at step 0 initially", () => {
    const { container } = renderSlider();
    expect(getTrack(container).style.transform).toBe("translateX(calc(0 * (-100% - 18px)))");
  });

  it("advances the track transform when Next demo is clicked", async () => {
    const user = userEvent.setup();
    const { container } = renderSlider();

    await user.click(screen.getByRole("button", { name: "Następne demo" }));

    expect(getTrack(container).style.transform).toBe("translateX(calc(1 * (-100% - 18px)))");
  });

  it("retreats the track transform when Previous demo is clicked", async () => {
    const user = userEvent.setup();
    const { container } = renderSlider();
    const nextButton = screen.getByRole("button", { name: "Następne demo" });

    await user.click(nextButton);
    await user.click(nextButton);
    await user.click(screen.getByRole("button", { name: "Poprzednie demo" }));

    expect(getTrack(container).style.transform).toBe("translateX(calc(1 * (-100% - 18px)))");
  });

  it("marks Previous demo aria-disabled at step 0, and Next demo is not disabled initially", () => {
    renderSlider();
    expect(screen.getByRole("button", { name: "Poprzednie demo" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("button", { name: "Następne demo" })).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("marks Next demo aria-disabled at the last slide and clicking it again is a no-op", async () => {
    const user = userEvent.setup();
    const { container } = renderSlider();
    const nextButton = screen.getByRole("button", { name: "Następne demo" });

    for (let i = 0; i < demos.length - 1; i += 1) {
      await user.click(nextButton);
    }

    expect(nextButton).toHaveAttribute("aria-disabled", "true");
    expect(getTrack(container).style.transform).toBe(
      `translateX(calc(${demos.length - 1} * (-100% - 18px)))`,
    );

    await user.click(nextButton);

    expect(getTrack(container).style.transform).toBe(
      `translateX(calc(${demos.length - 1} * (-100% - 18px)))`,
    );
  });

  it("jumps to a demo when its dot is clicked and marks that dot aria-current", async () => {
    const user = userEvent.setup();
    const { container } = renderSlider();
    const target = demos[2];
    const dot = screen.getByRole("button", { name: `Przejdź do: ${target.name}` });

    await user.click(dot);

    expect(getTrack(container).style.transform).toBe("translateX(calc(2 * (-100% - 18px)))");
    expect(dot).toHaveAttribute("aria-current", "true");
  });

  it("renders every demo's dot with its visible name (aria-hidden slides included)", () => {
    renderSlider();
    for (const d of demos) {
      expect(screen.getByRole("button", { name: `Przejdź do: ${d.name}` })).toBeInTheDocument();
    }
  });

  it("renders the tagline as plain (non-heading) text for every demo — heading-order fix", () => {
    renderSlider();
    for (const d of demos) {
      expect(screen.getByText(d.tagline)).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: d.tagline, hidden: true }),
      ).not.toBeInTheDocument();
    }
  });

  it("renders the detail paragraph for every demo", () => {
    renderSlider();
    for (const d of demos) {
      expect(screen.getByText(d.detail)).toBeInTheDocument();
    }
  });

  it("renders every key-flow feature pill of the first demo", () => {
    renderSlider();
    for (const feature of demos[0].features) {
      expect(screen.getByText(feature)).toBeInTheDocument();
    }
  });

  it("renders flowsLabel and techLegend once per slide", () => {
    renderSlider();
    expect(screen.getAllByText(FLOWS_LABEL, { exact: true })).toHaveLength(demos.length);
    expect(screen.getAllByText(TECH_LEGEND, { exact: true })).toHaveLength(demos.length);
  });

  it("renders the shared technology-stack row on every slide", () => {
    renderSlider();
    expect(screen.getAllByRole("img", { name: "React", hidden: true })).toHaveLength(demos.length);
  });

  it("renders an alt-labelled screenshot for every demo", () => {
    renderSlider();
    for (const d of demos) {
      expect(screen.getByAltText(d.shotAlt)).toBeInTheDocument();
    }
  });

  it("renders a live-demo link per slide pointing at /demo/<slug>/index.html, opening in a new tab", () => {
    renderSlider();
    const links = getLiveLinks();
    expect(links).toHaveLength(demos.length);
    for (const d of demos) {
      const link = links.find((l) => l.getAttribute("href") === d.href);
      expect(link).toBeDefined();
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("keeps only the active slide's live link focusable (no tabIndex vs tabIndex=-1), shifting after next", async () => {
    const user = userEvent.setup();
    renderSlider();

    const links = getLiveLinks();
    const link0 = links.find((l) => l.getAttribute("href") === demos[0].href)!;
    const link1 = links.find((l) => l.getAttribute("href") === demos[1].href)!;
    const link2 = links.find((l) => l.getAttribute("href") === demos[2].href)!;

    expect(link0).not.toHaveAttribute("tabIndex");
    expect(link1).toHaveAttribute("tabIndex", "-1");
    expect(link2).toHaveAttribute("tabIndex", "-1");

    await user.click(screen.getByRole("button", { name: "Następne demo" }));

    expect(link0).toHaveAttribute("tabIndex", "-1");
    expect(link1).not.toHaveAttribute("tabIndex");
    expect(link2).toHaveAttribute("tabIndex", "-1");
  });

  it("renders the desktop-only note on slides whose demo is desktopOnly", () => {
    renderSlider();

    const desktopOnlyCount = demos.filter((d) => d.desktopOnly).length;
    expect(desktopOnlyCount).toBeGreaterThan(0);
    expect(screen.getAllByText(DESKTOP_NOTE, { exact: true })).toHaveLength(desktopOnlyCount);
  });

  it("renders the demo best-practices note once per slide", () => {
    renderSlider();
    expect(screen.getAllByText(DEMO_NOTE, { exact: true })).toHaveLength(demos.length);
  });

  it("renders the language chip only for slides whose demo has uiLang 'en' (2026-07-22 pl-copy handoff §6)", () => {
    renderSlider();

    const enCount = demos.filter((d) => d.uiLang === "en").length;
    const plCount = demos.filter((d) => d.uiLang === "pl").length;
    expect(enCount).toBeGreaterThan(0);
    expect(plCount).toBeGreaterThan(0);
    expect(screen.getAllByText(LANG_CHIP, { exact: true })).toHaveLength(enCount);
  });

  it("renders the DemoLogo brand mark for demos with a logoId (cadence, airlift)", () => {
    renderSlider();

    // Both cadence and airlift are off-screen (aria-hidden) at step 0 — the initial active
    // slide is demos[0] (Merdi) — so both lookups need `hidden: true` to see the full DOM.
    expect(screen.getByRole("img", { name: "Cadence", hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "AIRLIFT", hidden: true })).toBeInTheDocument();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const importCalendly = async () => await import("./calendly");

const SCRIPT_SELECTOR = 'script[src*="assets.calendly.com/assets/external/widget.js"]';
const scriptEls = () => document.head.querySelectorAll(SCRIPT_SELECTOR);
const STYLESHEET_SELECTOR = 'link[href*="assets.calendly.com/assets/external/widget.css"]';
const stylesheetEls = () => document.head.querySelectorAll(STYLESHEET_SELECTOR);

describe("calendly", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useRealTimers();
    scriptEls().forEach((el) => el.remove());
    stylesheetEls().forEach((el) => el.remove());
    Reflect.deleteProperty(window, "Calendly");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("importing the module has no side effects (no script appended, no state touched)", async () => {
    await importCalendly();
    expect(scriptEls().length).toBe(0);
    expect(window.Calendly).toBeUndefined();
  });

  it("loadCalendly() appends exactly one script (+ one stylesheet) and is idempotent across repeated calls", async () => {
    const { loadCalendly } = await importCalendly();

    loadCalendly();
    loadCalendly();
    loadCalendly();

    expect(scriptEls().length).toBe(1);
    expect(stylesheetEls().length).toBe(1);
  });

  it("loadCalendly() resolves once the injected script fires its load event", async () => {
    const { loadCalendly } = await importCalendly();

    const pending = loadCalendly();
    scriptEls()[0]?.dispatchEvent(new Event("load"));

    await expect(pending).resolves.toBeUndefined();
  });

  it("loadCalendly() resolves immediately (no script injected) when window.Calendly already exists", async () => {
    window.Calendly = { initPopupWidget: vi.fn() };
    const { loadCalendly } = await importCalendly();

    await expect(loadCalendly()).resolves.toBeUndefined();
    expect(scriptEls().length).toBe(0);
  });

  it("loadCalendly() rejects when the injected script fires an error event", async () => {
    const { loadCalendly } = await importCalendly();

    const pending = loadCalendly();
    scriptEls()[0]?.dispatchEvent(new Event("error"));

    await expect(pending).rejects.toThrow();
  });

  it("loadCalendly() rejects on its own timeout when no load/error event ever fires", async () => {
    vi.useFakeTimers();
    const { loadCalendly } = await importCalendly();

    const pending = loadCalendly();
    pending.catch(() => {}); // attach before advancing timers to avoid an unhandled rejection
    await vi.advanceTimersByTimeAsync(10_000);
    await expect(pending).rejects.toThrow();
  });

  it("openCalendlyPopup() loads the widget then calls window.Calendly.initPopupWidget with the url", async () => {
    const initPopupWidget = vi.fn();
    window.Calendly = { initPopupWidget };
    const { openCalendlyPopup } = await importCalendly();

    await openCalendlyPopup("https://calendly.com/team-calmsoft/workshop");

    expect(initPopupWidget).toHaveBeenCalledWith({
      url: "https://calendly.com/team-calmsoft/workshop",
    });
  });

  it("openCalendlyPopup() rejects when the loader rejects (caller is responsible for the fallback)", async () => {
    const { openCalendlyPopup } = await importCalendly();

    const pending = openCalendlyPopup("https://calendly.com/team-calmsoft/workshop");
    scriptEls()[0]?.dispatchEvent(new Event("error"));

    await expect(pending).rejects.toThrow();
  });
});

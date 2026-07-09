import { describe, expect, it } from "vitest";
import { services } from "./services";
import { cases, getCaseBySlug } from "./cases";
import { steps } from "./steps";
import { site } from "./site";

describe("content completeness (SPEC §5.3)", () => {
  it("ma 4 usługi z pełnymi polami", () => {
    expect(services).toHaveLength(4);
    for (const s of services) {
      expect(s.cardBody.length).toBeGreaterThan(0);
      expect(s.chips).toHaveLength(4);
      expect(s.fit).toHaveLength(4);
      expect(s.fit.every((f) => f.trim().length > 0)).toBe(true);
      expect(s.deliver.length).toBeGreaterThanOrEqual(5);
      expect(s.deliver.length).toBeLessThanOrEqual(6);
      expect(s.deliver.every((d) => d.n.trim().length > 0 && d.d.trim().length > 0)).toBe(true);
      expect(s.relatedSlugs.length).toBeGreaterThan(0);
    }
  });
  it("servicePicker options mapują 1:1 na ServiceId usług (kontrakt radio→payload)", () => {
    const pickerIds = new Set(site.contact.form.servicePicker.options.map((o) => o.id));
    const serviceIds = new Set(services.map((s) => s.id));
    expect(pickerIds).toEqual(serviceIds);
  });
  it("lewa kolumna kontaktu ma 3 checki", () => {
    expect(site.contact.checks).toHaveLength(3);
  });
  it("każdy case ma niepuste challenge/approach/results i pierwszą metrykę", () => {
    for (const c of cases) {
      expect(c.challenge.trim().length).toBeGreaterThan(0);
      expect(c.approach.trim().length).toBeGreaterThan(0);
      expect(c.results.trim().length).toBeGreaterThan(0);
      expect(c.m1v.trim().length).toBeGreaterThan(0);
      expect(c.m1l.trim().length).toBeGreaterThan(0);
    }
  });
  it("ma 6 case studies z unikalnymi slugami", () => {
    expect(cases).toHaveLength(6);
    expect(new Set(cases.map((c) => c.slug)).size).toBe(6);
  });
  it("relatedSlugs i featuredCaseSlug wskazują istniejące case'y", () => {
    for (const s of services) for (const slug of s.relatedSlugs) expect(getCaseBySlug(slug)).toBeDefined();
    expect(getCaseBySlug(site.featuredCaseSlug)).toBeDefined();
  });
  it("ma 4 kroki procesu 00–03", () => {
    expect(steps.map((s) => s.number)).toEqual(["00", "01", "02", "03"]);
  });
  it("okno kodu hero ma tytuł i wiersze", () => {
    expect(site.hero.code.window.title.map((s) => s.text).join("")).toBe(
      "calm_soft · automation.ts",
    );
    expect(site.hero.code.window.lines.length).toBeGreaterThan(3);
  });
  it("stopki modali są niepuste", () => {
    expect(site.modals.serviceNote.length).toBeGreaterThan(0);
    expect(site.modals.caseNote.length).toBeGreaterThan(0);
  });
});

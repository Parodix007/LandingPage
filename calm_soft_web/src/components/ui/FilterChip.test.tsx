import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterChip, FILTER_LEGEND_CLASS } from "./FilterChip";

describe("FilterChip", () => {
  it("reflects pressed=false via aria-pressed", () => {
    render(
      <FilterChip pressed={false} onClick={() => {}}>
        Web apps
      </FilterChip>,
    );
    expect(screen.getByRole("button", { name: "Web apps" })).toHaveAttribute("aria-pressed", "false");
  });

  it("reflects pressed=true via aria-pressed", () => {
    render(
      <FilterChip pressed={true} onClick={() => {}}>
        Web apps
      </FilterChip>,
    );
    expect(screen.getByRole("button", { name: "Web apps" })).toHaveAttribute("aria-pressed", "true");
  });

  it("fires onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <FilterChip pressed={false} onClick={onClick}>
        Web apps
      </FilterChip>,
    );
    await user.click(screen.getByRole("button", { name: "Web apps" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("without tone, the pressed class carries the accent tint (60%/12%)", () => {
    render(
      <FilterChip pressed={true} onClick={() => {}}>
        Web apps
      </FilterChip>,
    );
    expect(screen.getByRole("button", { name: "Web apps" })).toHaveClass(
      "border-[color-mix(in_oklch,var(--color-accent)_60%,transparent)]",
      "bg-[color-mix(in_oklch,var(--color-accent)_12%,transparent)]",
    );
  });

  it("tone='accent2' pressed class carries the accent2 tint (60%/12%)", () => {
    render(
      <FilterChip pressed={true} tone="accent2" onClick={() => {}}>
        Automatyzacja
      </FilterChip>,
    );
    expect(screen.getByRole("button", { name: "Automatyzacja" })).toHaveClass(
      "border-[color-mix(in_oklch,var(--color-accent2)_60%,transparent)]",
      "bg-[color-mix(in_oklch,var(--color-accent2)_12%,transparent)]",
    );
  });

  it("unpressed carries border-border-12 and no bg-color-mix tint", () => {
    render(
      <FilterChip pressed={false} onClick={() => {}}>
        Web apps
      </FilterChip>,
    );
    const el = screen.getByRole("button", { name: "Web apps" });
    expect(el).toHaveClass("border-border-12");
    expect(el.className).not.toMatch(/bg-\[color-mix/);
  });

  it("class order is base -> focus -> state (PILL_FOCUS present, base precedes it)", () => {
    render(
      <FilterChip pressed={false} onClick={() => {}}>
        Web apps
      </FilterChip>,
    );
    const el = screen.getByRole("button", { name: "Web apps" });
    expect(el.className).toMatch(/^inline-flex items-center rounded-\[var\(--radius-pill\)\].*focus-visible:outline-none/);
  });
});

describe("FILTER_LEGEND_CLASS", () => {
  it("is the shared legend styling string", () => {
    expect(FILTER_LEGEND_CLASS).toBe("mb-3 p-0 text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-50");
  });
});

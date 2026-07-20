import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendlyCta } from "./CalendlyCta";
import { openCalendlyPopup } from "@/lib/calendly";
import { CALENDLY_URL } from "@/lib/config";

// SPEC (2026-07-20 reorder doc) — CalendlyCta tests mock the whole lib/calendly module;
// calendly.ts has its own unit tests for the loader/popup behavior.
vi.mock("@/lib/calendly", () => ({
  openCalendlyPopup: vi.fn(),
}));

const mockedOpenCalendlyPopup = vi.mocked(openCalendlyPopup);

describe("CalendlyCta", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a plain anchor to the Calendly URL, safe to open in a new tab", () => {
    render(<CalendlyCta variant="filled" label="Book a free 30-min call ›" />);
    const link = screen.getByRole("link", { name: "Book a free 30-min call ›" });
    expect(link).toHaveAttribute("href", CALENDLY_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("forwards aria-label when provided", () => {
    render(<CalendlyCta variant="link" label="Book a call" ariaLabel="Book a free intro call" />);
    expect(screen.getByRole("link", { name: "Book a free intro call" })).toBeInTheDocument();
  });

  it("prevents default navigation and opens the Calendly popup on click", async () => {
    mockedOpenCalendlyPopup.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<CalendlyCta variant="filled" label="Book a call" />);

    await user.click(screen.getByRole("link", { name: "Book a call" }));

    expect(mockedOpenCalendlyPopup).toHaveBeenCalledTimes(1);
    expect(mockedOpenCalendlyPopup).toHaveBeenCalledWith(CALENDLY_URL);
  });

  it("falls back to window.open when the popup loader rejects", async () => {
    mockedOpenCalendlyPopup.mockRejectedValue(new Error("Calendly script timed out"));
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const user = userEvent.setup();
    render(<CalendlyCta variant="filled" label="Book a call" />);

    await user.click(screen.getByRole("link", { name: "Book a call" }));

    await waitFor(() => {
      expect(openSpy).toHaveBeenCalledWith(CALENDLY_URL, "_blank", "noopener");
    });
  });

  it("variant='filled' applies the accent-background pill classes", () => {
    render(<CalendlyCta variant="filled" label="Book a call" />);
    const el = screen.getByRole("link", { name: "Book a call" });
    expect(el).toHaveClass("bg-accent", "text-black");
  });

  it("variant='link' applies the accent text-link classes (no filled background)", () => {
    render(<CalendlyCta variant="link" label="Book a call" />);
    const el = screen.getByRole("link", { name: "Book a call" });
    expect(el).toHaveClass("text-accent");
    expect(el).not.toHaveClass("bg-accent");
  });

  it("applies the focus-visible ring for keyboard users (SPEC §11.2)", () => {
    render(<CalendlyCta variant="link" label="Book a call" />);
    expect(screen.getByRole("link", { name: "Book a call" })).toHaveClass(
      "focus-visible:ring-2",
      "focus-visible:ring-[var(--color-accent)]",
    );
  });
});

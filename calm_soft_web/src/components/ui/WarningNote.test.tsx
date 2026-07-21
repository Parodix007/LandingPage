import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WarningNote } from "./WarningNote";

const TEXT = "A back-office panel — built for desktop, not adapted for mobile.";

describe("WarningNote", () => {
  it("renders its children, with the decorative icon excluded from the accessible text", () => {
    render(<WarningNote>{TEXT}</WarningNote>);

    const note = screen.getByText(TEXT);
    expect(note).toBeInTheDocument();
    expect(note.textContent).toBe(TEXT);
  });
});

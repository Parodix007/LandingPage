import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WATERMARK_MOBILE_PAD, Watermark } from "./Watermark";

describe("Watermark", () => {
  it("stays visible in every viewport with a smaller mobile scale and the desktop scale from 900px", () => {
    const { container } = render(<Watermark />);

    const mark = container.firstElementChild as HTMLElement;
    // Kontrakt (brief #11 / ServiceSalesPage.test.tsx): watermark widoczny na mobile — bez `hidden`.
    expect(mark).not.toHaveClass("hidden");
    // Mobile <900px: mniejsza czcionka; desktop ≥900px: bez zmian bit-identyczny.
    expect(mark).toHaveClass("text-[16px]", "min-[900px]:text-[24px]");
    expect(mark).toHaveTextContent("calm_soft");
  });

  it("uses the higher-opacity deco token on mobile so the watermark meets WCAG 4.5:1 at 16px", () => {
    const { container } = render(<Watermark />);

    const mark = container.firstElementChild as HTMLElement;
    // WCAG AA: 16px mobile to normalny tekst (>=4.5:1) — podniesiona opacity tylko <900px, desktop bez zmian.
    expect(mark).toHaveClass("text-ink-deco-45", "max-[899px]:text-ink-deco-55");
  });

  it("exports the shared mobile right-edge reservation used by watermark card hosts", () => {
    expect(WATERMARK_MOBILE_PAD).toBe("max-[899px]:pr-[112px]");
  });
});

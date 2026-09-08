import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CarouselArrowButton } from "./CarouselArrowButton";

describe("CarouselArrowButton", () => {
  it.each([["previous", "Previous"], ["next", "Next"]] as const)("renders the %s chevron as an accessible 44px control", (direction, label) => {
    render(<CarouselArrowButton direction={direction} label={label} atBoundary={direction === "previous"} onClick={() => {}} />);
    const button = screen.getByRole("button", { name: label });
    expect(button).toHaveAttribute("aria-disabled", direction === "previous" ? "true" : "false");
    expect(button).toHaveClass("hit-44", "h-11", "w-11", "border-border-20", "focus-visible:ring-2");
    expect(button.querySelector("svg")).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it("forwards clicks even at a boundary so the carousel hook can clamp", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<CarouselArrowButton direction="next" label="Next" atBoundary onClick={onClick} />);
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

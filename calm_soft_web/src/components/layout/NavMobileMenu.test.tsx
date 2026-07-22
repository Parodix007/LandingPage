import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NavMobileMenu } from "./NavMobileMenu";

const LINKS = [
  { href: "/#services", label: "Services" },
  { href: "/#process", label: "Process" },
  { href: "/#cases", label: "Case studies" },
];

const CTA_LABEL = "Start a project";

describe("NavMobileMenu", () => {
  it("opens the panel and shows the links on hamburger click", async () => {
    const user = userEvent.setup();
    render(<NavMobileMenu links={LINKS} ctaLabel={CTA_LABEL} />);

    const button = screen.getByRole("button", { name: "Menu" });
    expect(button).toHaveAttribute("aria-expanded", "false");

    await user.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Services" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Process" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Case studies" })).toBeVisible();
  });

  it("closes the panel when a link is clicked", async () => {
    const user = userEvent.setup();
    render(<NavMobileMenu links={LINKS} ctaLabel={CTA_LABEL} />);

    await user.click(screen.getByRole("button", { name: "Menu" }));
    await user.click(screen.getByRole("link", { name: "Process" }));

    expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the panel on Escape and returns focus to the hamburger toggle (FIX 4)", async () => {
    const user = userEvent.setup();
    render(<NavMobileMenu links={LINKS} ctaLabel={CTA_LABEL} />);

    const toggle = screen.getByRole("button", { name: "Menu" });
    await user.click(toggle);
    fireEvent.keyDown(document, { key: "Escape" });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveFocus();
  });

  it("closes the panel on an outside click", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <NavMobileMenu links={LINKS} ctaLabel={CTA_LABEL} />
        <button>Outside</button>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Menu" }));
    await user.click(screen.getByRole("button", { name: "Outside" }));

    expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-expanded", "false");
  });
});

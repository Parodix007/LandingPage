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

// Nested services submenu (optional `serviceMenu` prop) — additive only, the suite above stays
// untouched and keeps passing unchanged since the prop defaults to undefined there.
describe("NavMobileMenu — services submenu (serviceMenu prop)", () => {
  const LINKS_WITHOUT_SERVICES = [
    { href: "/#process", label: "Process" },
    { href: "/#cases", label: "Case studies" },
  ];

  const SERVICE_MENU = {
    label: "Services",
    backLabel: "Back",
    overviewHref: "/#services",
    overviewLabel: "All services",
    items: [
      { href: "/uslugi/core/", label: "Core" },
      { href: "/uslugi/automation/", label: "Automation" },
    ],
  };

  it("switches to the submenu view on the services trigger, focusing the back button", async () => {
    const user = userEvent.setup();
    render(
      <NavMobileMenu links={LINKS_WITHOUT_SERVICES} ctaLabel={CTA_LABEL} serviceMenu={SERVICE_MENU} />,
    );

    await user.click(screen.getByRole("button", { name: "Menu" }));
    await user.click(screen.getByRole("button", { name: SERVICE_MENU.label }));

    const backButton = screen.getByRole("button", { name: SERVICE_MENU.backLabel });
    expect(backButton).toBeVisible();
    expect(backButton).toHaveFocus();
    expect(screen.getByRole("link", { name: SERVICE_MENU.overviewLabel })).toBeVisible();
    expect(screen.getByRole("link", { name: SERVICE_MENU.items[0].label })).toBeVisible();
    expect(screen.getByRole("link", { name: SERVICE_MENU.items[1].label })).toBeVisible();
    // The main list (including the other nav links) is not shown while in the submenu.
    expect(screen.queryByRole("link", { name: "Process" })).not.toBeInTheDocument();
  });

  it("returns to the main list from the back button, focusing the services trigger", async () => {
    const user = userEvent.setup();
    render(
      <NavMobileMenu links={LINKS_WITHOUT_SERVICES} ctaLabel={CTA_LABEL} serviceMenu={SERVICE_MENU} />,
    );

    await user.click(screen.getByRole("button", { name: "Menu" }));
    await user.click(screen.getByRole("button", { name: SERVICE_MENU.label }));
    await user.click(screen.getByRole("button", { name: SERVICE_MENU.backLabel }));

    const servicesTrigger = screen.getByRole("button", { name: SERVICE_MENU.label });
    expect(servicesTrigger).toBeVisible();
    expect(servicesTrigger).toHaveFocus();
    expect(screen.getByRole("link", { name: "Process" })).toBeVisible();
    expect(screen.queryByRole("button", { name: SERVICE_MENU.backLabel })).not.toBeInTheDocument();
  });

  it("resets the view to the main list after a submenu link closes the whole menu", async () => {
    const user = userEvent.setup();
    render(
      <NavMobileMenu links={LINKS_WITHOUT_SERVICES} ctaLabel={CTA_LABEL} serviceMenu={SERVICE_MENU} />,
    );

    await user.click(screen.getByRole("button", { name: "Menu" }));
    await user.click(screen.getByRole("button", { name: SERVICE_MENU.label }));
    await user.click(screen.getByRole("link", { name: SERVICE_MENU.items[0].label }));

    expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-expanded", "false");

    // Reopening starts back on the main list, not on the submenu it was closed from.
    await user.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.getByRole("button", { name: SERVICE_MENU.label })).toBeVisible();
    expect(screen.queryByRole("button", { name: SERVICE_MENU.backLabel })).not.toBeInTheDocument();
  });

  it("resets the view to the main list when the submenu is closed via Escape", async () => {
    const user = userEvent.setup();
    render(
      <NavMobileMenu links={LINKS_WITHOUT_SERVICES} ctaLabel={CTA_LABEL} serviceMenu={SERVICE_MENU} />,
    );

    await user.click(screen.getByRole("button", { name: "Menu" }));
    await user.click(screen.getByRole("button", { name: SERVICE_MENU.label }));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Menu" })).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.getByRole("button", { name: SERVICE_MENU.label })).toBeVisible();
    expect(screen.queryByRole("button", { name: SERVICE_MENU.backLabel })).not.toBeInTheDocument();
  });
});

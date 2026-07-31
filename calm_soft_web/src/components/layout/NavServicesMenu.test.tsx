import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NavServicesMenu } from "./NavServicesMenu";

const TRIGGER_LABEL = "Services";
const OVERVIEW_HREF = "/#services";
const OVERVIEW_LABEL = "All services";

const ITEMS = [
  { href: "/uslugi/core/", label: "Core systems" },
  { href: "/uslugi/automation/", label: "Automation" },
];

function renderMenu() {
  return render(
    <NavServicesMenu
      triggerLabel={TRIGGER_LABEL}
      overviewHref={OVERVIEW_HREF}
      overviewLabel={OVERVIEW_LABEL}
      items={ITEMS}
    />,
  );
}

describe("NavServicesMenu", () => {
  it("starts closed with the panel links unavailable", () => {
    renderMenu();

    const trigger = screen.getByRole("button", { name: TRIGGER_LABEL });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-haspopup", "true");
    expect(screen.queryByRole("link", { name: OVERVIEW_LABEL })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: ITEMS[0].label })).not.toBeInTheDocument();
  });

  it("opens on trigger click and shows every item", async () => {
    const user = userEvent.setup();
    renderMenu();

    const trigger = screen.getByRole("button", { name: TRIGGER_LABEL });
    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: OVERVIEW_LABEL })).toBeVisible();
    expect(screen.getByRole("link", { name: ITEMS[0].label })).toBeVisible();
    expect(screen.getByRole("link", { name: ITEMS[1].label })).toBeVisible();
  });

  it("opens on mouse hover", () => {
    renderMenu();

    const trigger = screen.getByRole("button", { name: TRIGGER_LABEL });
    fireEvent.mouseEnter(trigger.parentElement as HTMLElement);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: ITEMS[0].label })).toBeVisible();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderMenu();

    const trigger = screen.getByRole("button", { name: TRIGGER_LABEL });
    await user.click(trigger);
    fireEvent.keyDown(document, { key: "Escape" });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("closes on an outside mousedown", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <NavServicesMenu
          triggerLabel={TRIGGER_LABEL}
          overviewHref={OVERVIEW_HREF}
          overviewLabel={OVERVIEW_LABEL}
          items={ITEMS}
        />
        <button>Outside</button>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: TRIGGER_LABEL }));
    fireEvent.mouseDown(screen.getByRole("button", { name: "Outside" }));

    expect(screen.getByRole("button", { name: TRIGGER_LABEL })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("toggles closed when activated by keyboard a second time", async () => {
    // userEvent.click() simulates a mouse click (event.detail >= 1), which is exactly the
    // case the trigger must NOT toggle on (see the onClick comment in NavServicesMenu.tsx).
    // To exercise the keyboard path we focus the trigger and press Enter via
    // userEvent.keyboard(), never fireEvent.click with a manually-set detail — that would
    // bypass the trigger's real keydown/keypress handling instead of testing it. We stay off
    // the mouse entirely so no `mouseenter`/hover ever fires here.
    const user = userEvent.setup();
    renderMenu();

    const trigger = screen.getByRole("button", { name: TRIGGER_LABEL });
    await user.tab();
    expect(trigger).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("renders each item's href from props rather than a hardcoded value", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: TRIGGER_LABEL }));

    expect(screen.getByRole("link", { name: OVERVIEW_LABEL })).toHaveAttribute("href", OVERVIEW_HREF);
    for (const item of ITEMS) {
      expect(screen.getByRole("link", { name: item.label })).toHaveAttribute("href", item.href);
    }
  });
});

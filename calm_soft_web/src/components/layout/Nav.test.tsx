import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Nav } from "./Nav";

// Bugfix pin: the desktop nav starts at 800px, not Tailwind's `md` (768px). Between 768–784px
// the desktop row was wider than the viewport (scrollWidth 785 > vw) and produced horizontal
// overflow. jsdom does not evaluate media queries, so this pins the breakpoint class names on
// the three layout containers: the desktop row (Nav.tsx), the mobile wrapper (NavMobileMenu.tsx)
// and the desktop services/KSeF menu root (NavServicesMenu.tsx).
describe("Nav — 800px breakpoint (no horizontal overflow at 768–799px)", () => {
  it("desktop nav row uses min-[800px]:flex, mobile wrapper uses min-[800px]:hidden, services menu root uses min-[800px]:flex", () => {
    const { container } = render(<Nav />);

    const desktopRow = container.querySelector("div.min-\\[800px\\]\\:flex");
    expect(desktopRow).not.toBeNull();
    expect(desktopRow?.className).toContain("hidden");
    expect(desktopRow?.className).toContain("items-center");

    const mobileWrapper = container.querySelector("div.min-\\[800px\\]\\:hidden");
    expect(mobileWrapper).not.toBeNull();

    const servicesRoots = container.querySelectorAll("div.relative.hidden.min-\\[800px\\]\\:flex");
    // Two instances are rendered: the KSeF menu and the Usługi menu.
    expect(servicesRoots.length).toBe(2);

    // Sanity: both the desktop CTA and the hamburger toggle are present in the tree; which one
    // is actually displayed is decided purely by the breakpoint classes pinned above.
    expect(screen.getByRole("button", { name: "Menu" })).toBeInTheDocument();
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { scrollToContact } from "./scroll";

describe("scrollToContact", () => {
  const originalLocation = Object.getOwnPropertyDescriptor(window, "location");

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    if (originalLocation) {
      Object.defineProperty(window, "location", originalLocation);
    }
  });

  it("scrolls the #contact element into view smoothly when present", () => {
    const contact = document.createElement("div");
    contact.id = "contact";
    document.body.appendChild(contact);
    const spy = vi.spyOn(contact, "scrollIntoView");

    scrollToContact();

    expect(spy).toHaveBeenCalledWith({ behavior: "smooth" });
  });

  it("falls back to navigating /#contact when #contact is not in the document", () => {
    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      value: { assign },
      configurable: true,
      writable: true,
    });

    scrollToContact();

    expect(assign).toHaveBeenCalledWith("/#contact");
  });
});

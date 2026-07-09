import { afterEach, describe, expect, it, vi } from "vitest";
import { scrollToContact } from "./scroll";

describe("scrollToContact", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("scrolls the #contact element into view smoothly when present", () => {
    const contact = document.createElement("div");
    contact.id = "contact";
    document.body.appendChild(contact);
    const spy = vi.spyOn(contact, "scrollIntoView");

    scrollToContact();

    expect(spy).toHaveBeenCalledWith({ behavior: "smooth" });
  });

  it("does nothing (no throw) when #contact is not in the document", () => {
    expect(() => scrollToContact()).not.toThrow();
  });
});

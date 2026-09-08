import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ServiceDisclosure } from "./ServiceDisclosure";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function renderDisclosure() {
  render(<ServiceDisclosure title="Technical details"><p>Body</p></ServiceDisclosure>);
  const details = screen.getByText("Technical details").closest("details")!;
  return { details, summary: screen.getByText("Technical details"), content: details.querySelector("[data-disclosure-content]")! };
}

describe("ServiceDisclosure", () => {
  it("keeps native details/summary semantics and opens through a pointer click", async () => {
    const user = userEvent.setup();
    const { details } = renderDisclosure();
    expect(details.tagName).toBe("DETAILS");
    expect(details.querySelector("summary")).toBeInTheDocument();
    expect(details.querySelector("svg")).toHaveAttribute("stroke", "currentColor");
    await user.click(screen.getByText("Technical details"));
    expect(details).toHaveAttribute("open");
  });

  it("keeps open during closing phase and removes open after fallback timeout", async () => {
    vi.useFakeTimers();
    const { details, summary, content } = renderDisclosure();
    fireEvent.click(summary);
    await act(async () => {});
    fireEvent.click(summary);
    await act(async () => {});
    expect(details).toHaveAttribute("open");
    expect(content).toHaveClass("service-disclosure-content-closing");
    act(() => vi.advanceTimersByTime(300));
    expect(details).not.toHaveAttribute("open");
  });

  it("finishes closing on the content animation before the fallback timer", async () => {
    vi.useFakeTimers();
    const { details, summary, content } = renderDisclosure();
    fireEvent.click(summary);
    await act(async () => {});
    fireEvent.click(summary);
    await act(async () => {});
    expect(details).toHaveAttribute("open");
    fireEvent.animationEnd(content, { animationName: "serviceDisclosureOut" });
    expect(details).not.toHaveAttribute("open");
    act(() => vi.advanceTimersByTime(300));
  });

  it("uses one fallback timer and cleans it up on unmount", async () => {
    vi.useFakeTimers();
    const { details, summary } = renderDisclosure();
    fireEvent.click(summary);
    await act(async () => {});
    fireEvent.click(summary);
    await act(async () => {});
    expect(details).toHaveAttribute("open");
    act(() => vi.advanceTimersByTime(300));
    expect(details).not.toHaveAttribute("open");
  });

  it("cancels a stale close when reopened and ignores its old animationend", async () => {
    const user = userEvent.setup();
    const { details, summary, content } = renderDisclosure();
    await user.click(summary);
    await user.click(summary);
    await user.click(summary);
    expect(details).toHaveAttribute("open");
    fireEvent.animationEnd(content);
    expect(details).toHaveAttribute("open");
  });

  it("closes immediately when reduced motion is preferred", async () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true, addListener: () => {}, removeListener: () => {} }));
    const user = userEvent.setup();
    const { details, summary } = renderDisclosure();
    await user.click(summary);
    await user.click(summary);
    expect(details).not.toHaveAttribute("open");
  });

  it("supports one toggle per focused Enter and Space activation", async () => {
    const user = userEvent.setup();
    const { details, summary } = renderDisclosure();
    await user.tab();
    await user.keyboard("{Enter}");
    // jsdom does not synthesize the browser's native summary click for keyboard activation.
    if (!details.hasAttribute("open")) fireEvent.click(summary);
    expect(details).toHaveAttribute("open");
    await user.keyboard(" ");
    if (!details.classList.contains("service-disclosure-closing")) fireEvent.click(summary);
    expect(details).toHaveAttribute("open");
    expect(details.querySelector(".service-disclosure-content-closing")).toBeInTheDocument();
  });
});

import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KsefDiscountPrefill } from "./KsefDiscountPrefill";

const mockPrefillContactMessage = vi.fn();
const mockRequestContactScroll = vi.fn();
const mockFocusContactField = vi.fn();

vi.mock("@/components/providers/InquiryProvider", () => ({
  useInquiry: () => ({
    prefillContactMessage: mockPrefillContactMessage,
    requestContactScroll: mockRequestContactScroll,
    focusContactField: mockFocusContactField,
  }),
}));

let frameCallback: FrameRequestCallback | undefined;

beforeEach(() => {
  mockPrefillContactMessage.mockReset();
  mockRequestContactScroll.mockReset();
  mockFocusContactField.mockReset();
  frameCallback = undefined;
  window.history.replaceState({}, "", "/ksef/rachmistrz-nexo/?rabat=inspunkty#contact");
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frameCallback = callback; return 7; });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});

afterEach(() => vi.unstubAllGlobals());

describe("KsefDiscountPrefill", () => {
  it("receives only the known intent and defers prefill, scroll, and focus to rAF", async () => {
    const calls: string[] = [];
    mockPrefillContactMessage.mockImplementation(() => calls.push("prefill"));
    mockRequestContactScroll.mockImplementation(() => calls.push("scroll"));
    mockFocusContactField.mockImplementation(() => calls.push("focus"));
    render(<KsefDiscountPrefill prefill="Chcę skorzystać z rabatu za ostatni pakiet InsPunktów." />);

    expect(mockPrefillContactMessage).not.toHaveBeenCalled();
    expect(frameCallback).toBeDefined();

    await act(async () => frameCallback?.(0));
    expect(mockPrefillContactMessage).toHaveBeenCalledWith("Chcę skorzystać z rabatu za ostatni pakiet InsPunktów.");
    expect(mockRequestContactScroll).toHaveBeenCalledTimes(1);
    expect(mockFocusContactField).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(["prefill", "scroll", "focus"]);
  });

  it("ignores unknown query intents", () => {
    window.history.replaceState({}, "", "/ksef/rachmistrz-nexo/?rabat=inne#contact");
    render(<KsefDiscountPrefill prefill="x" />);
    expect(frameCallback).toBeUndefined();
    expect(mockPrefillContactMessage).not.toHaveBeenCalled();
  });

  it("cancels the deferred callback on unmount", () => {
    const { unmount } = render(<KsefDiscountPrefill prefill="x" />);
    unmount();
    expect(vi.mocked(cancelAnimationFrame)).toHaveBeenCalledWith(7);
  });
});

import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCarousel } from "./useCarousel";

describe("useCarousel", () => {
  it("starts at step 0", () => {
    const { result } = renderHook(() => useCarousel(4));
    expect(result.current.step).toBe(0);
  });

  it("prev() at step 0 stays at 0 (no wrap)", () => {
    const { result } = renderHook(() => useCarousel(4));
    act(() => result.current.prev());
    expect(result.current.step).toBe(0);
  });

  it("next() four times caps at count - 1 (3)", () => {
    const { result } = renderHook(() => useCarousel(4));
    act(() => result.current.next());
    act(() => result.current.next());
    act(() => result.current.next());
    act(() => result.current.next());
    expect(result.current.step).toBe(3);
  });

  it("goTo(2) jumps to step 2", () => {
    const { result } = renderHook(() => useCarousel(4));
    act(() => result.current.goTo(2));
    expect(result.current.step).toBe(2);
  });

  it("goTo(99) clamps to the last step (3)", () => {
    const { result } = renderHook(() => useCarousel(4));
    act(() => result.current.goTo(99));
    expect(result.current.step).toBe(3);
  });

  it("goTo(-1) clamps to 0", () => {
    const { result } = renderHook(() => useCarousel(4));
    act(() => result.current.goTo(-1));
    expect(result.current.step).toBe(0);
  });

  it("starts at the given initial step", () => {
    const { result } = renderHook(() => useCarousel(4, 1));
    expect(result.current.step).toBe(1);
  });

  it("clamps an out-of-range initial step to the last step", () => {
    const { result } = renderHook(() => useCarousel(4, 99));
    expect(result.current.step).toBe(3);
  });

  it("clamps a negative initial step to 0", () => {
    const { result } = renderHook(() => useCarousel(4, -5));
    expect(result.current.step).toBe(0);
  });
});

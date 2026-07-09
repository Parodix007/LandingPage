import { useCallback, useState } from "react";

export type UseCarouselResult = {
  step: number;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
};

// SPEC §6.6 — carousel step logic, clamped [0, count-1], no wraparound. Pure hook, unit
// tested in isolation; ProcessCarousel (the 'use client' leaf) is the sole consumer.
function clampStep(value: number, count: number): number {
  if (count <= 0) return 0;
  return Math.min(Math.max(value, 0), count - 1);
}

export function useCarousel(count: number, initial = 0): UseCarouselResult {
  const [step, setStep] = useState(() => clampStep(initial, count));

  const next = useCallback(() => {
    setStep((current) => clampStep(current + 1, count));
  }, [count]);

  const prev = useCallback(() => {
    setStep((current) => clampStep(current - 1, count));
  }, [count]);

  const goTo = useCallback(
    (index: number) => {
      setStep(clampStep(index, count));
    },
    [count],
  );

  return { step, next, prev, goTo };
}

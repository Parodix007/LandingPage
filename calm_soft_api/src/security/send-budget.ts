export interface SendBudget {
  tryConsume(): { ok: true } | { ok: false; reason: string };
  release(): void;
}

export function createSendBudget(opts: {
  hourlyCap: number; dailyCap: number; now?: () => number;
}): SendBudget {
  const now = opts.now ?? Date.now;
  let hourStart = now(), hourCount = 0;
  let dayStart = now(), dayCount = 0;

  const roll = () => {
    const t = now();
    if (t - hourStart >= 3_600_000) { hourStart = t; hourCount = 0; }
    if (t - dayStart >= 86_400_000) { dayStart = t; dayCount = 0; }
  };
  return {
    tryConsume() {
      roll();
      if (hourCount >= opts.hourlyCap) return { ok: false, reason: 'hourly-cap' };
      if (dayCount >= opts.dailyCap) return { ok: false, reason: 'daily-cap' };
      hourCount++; dayCount++;
      return { ok: true };
    },
    release() { if (hourCount > 0) hourCount--; if (dayCount > 0) dayCount--; },
  };
}

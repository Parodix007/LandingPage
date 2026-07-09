import { describe, it, expect } from 'vitest';
import { createSendBudget } from '../src/security/send-budget.js';

describe('send budget', () => {
  it('allows up to the hourly cap then blocks', () => {
    let now = 0;
    const b = createSendBudget({ hourlyCap: 2, dailyCap: 100, now: () => now });
    expect(b.tryConsume().ok).toBe(true);
    expect(b.tryConsume().ok).toBe(true);
    expect(b.tryConsume()).toEqual({ ok: false, reason: 'hourly-cap' });
  });
  it('resets after the hour window', () => {
    let now = 0;
    const b = createSendBudget({ hourlyCap: 1, dailyCap: 100, now: () => now });
    expect(b.tryConsume().ok).toBe(true);
    now = 3_600_001;
    expect(b.tryConsume().ok).toBe(true);
  });
  it('enforces the daily cap across hours', () => {
    let now = 0;
    const b = createSendBudget({ hourlyCap: 100, dailyCap: 2, now: () => now });
    b.tryConsume(); now = 3_600_001; b.tryConsume(); now = 7_200_001;
    expect(b.tryConsume()).toEqual({ ok: false, reason: 'daily-cap' });
  });
  it('release() returns a token', () => {
    let now = 0;
    const b = createSendBudget({ hourlyCap: 1, dailyCap: 100, now: () => now });
    b.tryConsume(); b.release();
    expect(b.tryConsume().ok).toBe(true);
  });
});

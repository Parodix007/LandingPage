import { describe, it, expect, vi } from 'vitest';
import { createOutbox } from '../src/outbox/store.js';
import { createOutboxWorker } from '../src/outbox/worker.js';
import type { Submission } from '../src/outbox/store.js';

const sub: Submission = { name: 'A', email: 'a@b.com', company: '', phone: '', service: 'web', meeting: 'online', discover: false, handover: false, message: 'x', submittedAt: '', source: '' };

describe('outbox worker', () => {
  it('drains a pending row by sending it, then marks sent', async () => {
    const o = createOutbox(':memory:');
    o.enqueue(sub);
    const mailer = { sendInternal: vi.fn(async () => {}) };
    const w = createOutboxWorker({ outbox: o, mailer, maxAttempts: 3, intervalMs: 50 });
    await w.drainOnce();
    expect(mailer.sendInternal).toHaveBeenCalledTimes(1);
    expect(o.countByStatus('sent')).toBe(1);
    o.close();
  });
  it('re-queues on failure and dead-letters after maxAttempts', async () => {
    const o = createOutbox(':memory:');
    o.enqueue(sub);
    const mailer = { sendInternal: vi.fn(async () => { throw new Error('smtp'); }) };
    const w = createOutboxWorker({ outbox: o, mailer, maxAttempts: 2, intervalMs: 50 });
    await w.drainOnce(); expect(o.countByStatus('pending')).toBe(1);
    await w.drainOnce(); expect(o.countByStatus('dead')).toBe(1);
    o.close();
  });
});

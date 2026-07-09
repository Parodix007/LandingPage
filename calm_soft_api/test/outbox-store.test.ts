import { describe, it, expect } from 'vitest';
import { createOutbox } from '../src/outbox/store.js';
import type { Submission } from '../src/outbox/store.js';

const sub: Submission = {
  name: 'Anna Nowak', email: 'anna@example.com', company: '', phone: '',
  service: 'web', meeting: 'online', discover: true, handover: false,
  message: 'Hi', submittedAt: '2026-07-08 14:32', source: 'calmsoft.pro/#contact',
};

describe('outbox store (in-memory sqlite)', () => {
  it('enqueues and claims pending, then marks sent', () => {
    const o = createOutbox(':memory:');
    const { id } = o.enqueue(sub);
    const rows = o.claimPending(10);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.payload.email).toBe('anna@example.com');
    o.markSent(id);
    expect(o.claimPending(10)).toHaveLength(0);
    expect(o.countByStatus('sent')).toBe(1);
    o.close();
  });
  it('marks dead after max attempts', () => {
    const o = createOutbox(':memory:');
    const { id } = o.enqueue(sub);
    expect(o.markFailed(id, 'smtp down', 2)).toEqual({ attempts: 1, dead: false });
    expect(o.markFailed(id, 'smtp down', 2)).toEqual({ attempts: 2, dead: true });
    expect(o.countByStatus('dead')).toBe(1);
    expect(o.claimPending(10)).toHaveLength(0);
    o.close();
  });
});

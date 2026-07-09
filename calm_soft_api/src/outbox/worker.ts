import type { Outbox } from './store.js';
import type { Mailer } from '../mailer/mailer.js';

export interface OutboxWorker { start(): void; stop(): Promise<void>; drainOnce(): Promise<void>; }

export function createOutboxWorker(opts: {
  outbox: Outbox; mailer: Mailer; maxAttempts: number; intervalMs: number;
  batchSize?: number; logger?: import('pino').Logger;
}): OutboxWorker {
  let timer: NodeJS.Timeout | null = null;
  let running = false;
  const batch = opts.batchSize ?? 10;

  async function drainOnce() {
    const rows = opts.outbox.claimPending(batch);
    for (const row of rows) {
      try {
        await opts.mailer.sendInternal(row.payload, { outboxId: row.id });
        opts.outbox.markSent(row.id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const res = opts.outbox.markFailed(row.id, msg, opts.maxAttempts);
        if (res.dead) opts.logger?.error({ outboxId: row.id, attempts: res.attempts, err: msg }, 'outbox message dead-lettered');
        else opts.logger?.warn({ outboxId: row.id, attempts: res.attempts, err: msg }, 'outbox send failed, will retry');
      }
    }
  }
  return {
    drainOnce,
    start() {
      if (timer) return;
      const tick = async () => {
        if (running) return;
        running = true;
        try { await drainOnce(); } finally { running = false; }
      };
      timer = setInterval(tick, opts.intervalMs);
    },
    async stop() {
      if (timer) { clearInterval(timer); timer = null; }
      while (running) await new Promise((r) => setTimeout(r, 10));
      await drainOnce();
    },
  };
}

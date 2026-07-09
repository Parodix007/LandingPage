import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export type OutboxStatus = 'pending' | 'sent' | 'dead';
export interface Submission {
  name: string; email: string; company: string; phone: string;
  service: string; meeting: 'online' | 'onsite';
  discover: boolean; handover: boolean; message: string;
  submittedAt: string; source: string;
}
export interface OutboxRow { id: number; payload: Submission; status: OutboxStatus; attempts: number; last_error: string | null; }
export interface Outbox {
  enqueue(s: Submission): { id: number };
  claimPending(limit: number): OutboxRow[];
  markSent(id: number): void;
  markFailed(id: number, error: string, maxAttempts: number): { attempts: number; dead: boolean };
  countByStatus(status: OutboxStatus): number;
  close(): void;
}

export function createOutbox(dbPath: string): Outbox {
  if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(`CREATE TABLE IF NOT EXISTS outbox (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payload TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox(status);`);

  return {
    enqueue(s) {
      const t = Date.now();
      const info = db.prepare('INSERT INTO outbox (payload, status, created_at, updated_at) VALUES (?, ?, ?, ?)')
        .run(JSON.stringify(s), 'pending', t, t);
      return { id: Number(info.lastInsertRowid) };
    },
    claimPending(limit) {
      const rows = db.prepare("SELECT id, payload, status, attempts, last_error FROM outbox WHERE status = 'pending' ORDER BY id ASC LIMIT ?").all(limit) as any[];
      return rows.map((r) => ({ id: r.id, payload: JSON.parse(r.payload), status: r.status, attempts: r.attempts, last_error: r.last_error }));
    },
    markSent(id) {
      db.prepare("UPDATE outbox SET status = 'sent', updated_at = ? WHERE id = ?").run(Date.now(), id);
    },
    markFailed(id, error, maxAttempts) {
      const row = db.prepare('SELECT attempts FROM outbox WHERE id = ?').get(id) as { attempts: number } | undefined;
      const attempts = (row?.attempts ?? 0) + 1;
      const dead = attempts >= maxAttempts;
      db.prepare('UPDATE outbox SET attempts = ?, last_error = ?, status = ?, updated_at = ? WHERE id = ?')
        .run(attempts, error.slice(0, 500), dead ? 'dead' : 'pending', Date.now(), id);
      return { attempts, dead };
    },
    countByStatus(status) {
      return (db.prepare('SELECT COUNT(*) AS n FROM outbox WHERE status = ?').get(status) as { n: number }).n;
    },
    close() { db.close(); },
  };
}

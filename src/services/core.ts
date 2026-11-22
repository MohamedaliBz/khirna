import type { TKey, TParams } from '../i18n';
import type { Notification, NotificationType, Transaction, TransactionType } from '../types';
import { setDb, type AppState } from '../store/useStore';
import { nowIso, uid } from '../lib/id';

export type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: TKey; params?: TParams };

export function ok<T = undefined>(data?: T): Result<T> {
  return { ok: true, data };
}

export function fail(error: TKey, params?: TParams): { ok: false; error: TKey; params?: TParams } {
  return { ok: false, error, params };
}

/** Applique une mutation immuable à la base simulée. */
export function mutate(fn: (db: AppState) => Partial<AppState>) {
  setDb((s) => fn(s));
}

export function makeNotification(userId: string, type: NotificationType, params: Notification['params'], link?: string): Notification {
  return { id: uid('n'), userId, type, params, link, read: false, date: nowIso() };
}

export function makeTx(userId: string, type: TransactionType, amount: number, projectId?: string): Transaction {
  return { id: uid('t'), userId, type, amount, projectId, date: nowIso() };
}

export function creditWallet(wallets: AppState['wallets'], userId: string, delta: number): AppState['wallets'] {
  const exists = wallets.some((w) => w.userId === userId);
  if (!exists) return [...wallets, { userId, balance: Math.round(delta * 100) / 100 }];
  return wallets.map((w) => (w.userId === userId ? { ...w, balance: Math.round((w.balance + delta) * 100) / 100 } : w));
}

export const ADMIN_ID = 'u-admin';
export const STATE_AGENT_ID = 'u-state';

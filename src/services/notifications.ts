import { getDb } from '../store/useStore';
import { mutate } from './core';

export function markRead(notificationId: string) {
  mutate((s) => ({ notifications: s.notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n)) }));
}

export function markAllRead() {
  const userId = getDb().currentUserId;
  mutate((s) => ({ notifications: s.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n)) }));
}

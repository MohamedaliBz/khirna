import type { VisitStatus } from '../types';
import { getDb } from '../store/useStore';
import { getUser } from '../store/selectors';
import { nowIso, uid } from '../lib/id';
import { fail, makeNotification, mutate, ok, type Result } from './core';

export function requestVisit(projectId: string, wishedDate: string, message: string): Result {
  const db = getDb();
  const user = getUser(db, db.currentUserId ?? undefined);
  const project = db.projects.find((p) => p.id === projectId);
  if (!user || !project) return fail('common.loginRequired');
  const date = new Date(wishedDate).toISOString();
  mutate((s) => ({
    visits: [...s.visits, { id: uid('v'), projectId, citizenId: user.id, wishedDate: date, message: message.trim(), status: 'requested', createdAt: nowIso() }],
    notifications: [...s.notifications, makeNotification(project.farmerId, 'visit_requested', { projectId, name: user.name, date }, '/farmer')],
  }));
  return ok();
}

export function setVisitStatus(visitId: string, status: Exclude<VisitStatus, 'requested'>): Result {
  const visit = getDb().visits.find((v) => v.id === visitId);
  if (!visit) return fail('project.notFound');
  const notif =
    status === 'confirmed'
      ? makeNotification(visit.citizenId, 'visit_confirmed', { projectId: visit.projectId, date: visit.wishedDate }, '/me')
      : status === 'refused'
        ? makeNotification(visit.citizenId, 'visit_refused', { projectId: visit.projectId }, '/me')
        : null;
  mutate((s) => ({
    visits: s.visits.map((v) => (v.id === visitId ? { ...v, status } : v)),
    notifications: notif ? [...s.notifications, notif] : s.notifications,
  }));
  return ok();
}

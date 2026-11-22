import { useCallback } from 'react';
import type { Notification, Role } from '../types';
import { useI18n } from '../i18n';
import { useStore } from '../store/useStore';
import { getOffer, getProject } from '../store/selectors';
import { useUi } from '../store/ui';
import type { Result } from '../services/core';

/** Texte localisé d'une notification (titres résolus dans la langue courante). */
export function useNotificationText() {
  const { t, tr, money, date } = useI18n();
  const db = useStore();
  return useCallback(
    (n: Notification) => {
      const p = n.params;
      const project = getProject(db, String(p.projectId ?? ''));
      const milestone = project?.milestones.find((m) => m.id === p.milestoneId);
      const offer = getOffer(db, String(p.offerId ?? ''));
      return t(`notif.${n.type}`, {
        project: project ? tr(project.title) : '',
        milestone: milestone ? tr(milestone.title) : '',
        land: offer ? tr(offer.name) : '',
        amount: typeof p.amount === 'number' ? money(p.amount) : '',
        date: typeof p.date === 'string' ? date(p.date) : '',
        name: String(p.name ?? ''),
        reason: String(p.reason ?? ''),
      });
    },
    [db, t, tr, money, date],
  );
}

/** Affiche un toast traduit à partir du résultat d'un service. */
export function useResultToast() {
  const { t } = useI18n();
  const toast = useUi((s) => s.toast);
  return useCallback(
    <T,>(res: Result<T>, success?: string): res is { ok: true; data?: T } => {
      if (res.ok) {
        if (success) toast(success, 'success');
        return true;
      }
      toast(t(res.error, res.params), 'error');
      return false;
    },
    [t, toast],
  );
}

export function dashboardPath(role: Role | undefined): string {
  switch (role) {
    case 'citizen':
      return '/me';
    case 'farmer_t1':
    case 'farmer_t2':
      return '/farmer';
    case 'state_agent':
      return '/state';
    case 'admin':
      return '/admin';
    default:
      return '/login';
  }
}

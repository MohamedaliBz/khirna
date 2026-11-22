import type { BudgetLine, ContractType, Domain, Forecast, Land, L10n, Milestone, RiskLevel, Split } from '../types';
import { getDb } from '../store/useStore';
import { sum } from '../store/selectors';
import { nowIso, uid } from '../lib/id';
import { ADMIN_ID, fail, makeNotification, mutate, ok, type Result } from './core';

export interface ProjectDraft {
  domain: Domain;
  title: string;
  summary: string;
  description: string;
  land: Land;
  budget: { label: string; amount: number }[];
  milestones: { title: string; tranche: number; months: number }[];
  minInvestment: number;
  durationMonths: number;
  contractType: ContractType;
  presaleUnit?: string;
  presaleUnitPrice?: number;
  split: Split;
  realisticRevenue: number;
  riskLevel: RiskLevel;
  mainRisk: string;
  photos: string[];
  stateOfferId?: string;
}

const same = (s: string): L10n => ({ fr: s, ar: s });

export function submitProject(d: ProjectDraft): Result<string> {
  const db = getDb();
  const farmerId = db.currentUserId;
  if (!farmerId) return fail('common.loginRequired');
  const goal = sum(d.budget.map((b) => b.amount));
  if (goal <= 0 || sum(d.milestones.map((m) => m.tranche)) !== goal) return fail('wizard.tranchesMismatch', { amount: goal });
  if (sum(Object.values(d.split)) !== 100) return fail('wizard.splitError');

  const id = uid('p');
  const budget: BudgetLine[] = d.budget.map((b, i) => ({ id: `b${i + 1}`, label: same(b.label), amount: b.amount }));
  const milestones: Milestone[] = d.milestones.map((m, i) => ({
    id: `m${i + 1}`,
    title: same(m.title),
    tranche: m.tranche,
    dueDate: new Date(Date.now() + m.months * 30 * 86_400_000).toISOString(),
    status: 'upcoming',
  }));
  const forecast: Forecast = {
    realistic: d.realisticRevenue,
    pessimistic: Math.round(d.realisticRevenue * 0.8),
    optimistic: Math.round(d.realisticRevenue * 1.12),
  };

  mutate((s) => ({
    projects: [
      ...s.projects,
      {
        id,
        farmerId,
        domain: d.domain,
        title: same(d.title),
        summary: same(d.summary),
        description: same(d.description),
        land: d.land,
        photos: d.photos,
        goal,
        minInvestment: d.minInvestment,
        durationMonths: d.durationMonths,
        contractType: d.contractType,
        presaleUnit: d.contractType === 'presale' && d.presaleUnit ? same(d.presaleUnit) : undefined,
        presaleUnitPrice: d.contractType === 'presale' ? d.presaleUnitPrice : undefined,
        split: d.split,
        forecast,
        budget,
        milestones,
        riskLevel: d.riskLevel,
        risks: d.mainRisk.trim() ? [same(d.mainRisk.trim())] : [],
        status: 'submitted',
        stateOfferId: d.stateOfferId,
        jobs: 1,
        createdAt: nowIso(),
      },
    ],
    offers: d.stateOfferId ? s.offers.map((o) => (o.id === d.stateOfferId ? { ...o, projectId: id } : o)) : s.offers,
    notifications: [...s.notifications, makeNotification(ADMIN_ID, 'project_submitted', { projectId: id }, '/admin')],
  }));
  return ok(id);
}

export function resubmitProject(projectId: string): Result {
  mutate((s) => ({
    projects: s.projects.map((p) => (p.id === projectId ? { ...p, status: 'submitted' as const, adminNote: undefined } : p)),
    notifications: [...s.notifications, makeNotification(ADMIN_ID, 'project_submitted', { projectId }, '/admin')],
  }));
  return ok();
}

/** Admin : valider → ouverture de la collecte (+ versement du co-investissement de l'État au séquestre). */
export function approveProject(projectId: string): Result {
  const db = getDb();
  const project = db.projects.find((p) => p.id === projectId);
  if (!project) return fail('project.notFound');
  const offer = project.stateOfferId ? db.offers.find((o) => o.id === project.stateOfferId) : undefined;
  const coInvest = offer?.coInvestment ? Math.min(offer.coInvestment, project.goal) : 0;
  const alreadyState = db.investments.some((i) => i.projectId === projectId && i.investorType === 'state');
  const addState = coInvest > 0 && !alreadyState;
  const fullyFunded = addState && coInvest >= project.goal;

  mutate((s) => ({
    projects: s.projects.map((p) =>
      p.id === projectId ? { ...p, status: fullyFunded ? ('funded' as const) : ('funding' as const), adminNote: undefined } : p,
    ),
    investments: addState
      ? [
          ...s.investments,
          { id: uid('i'), projectId, investorId: 'state', investorType: 'state' as const, amount: coInvest, contractType: project.contractType, date: nowIso() },
        ]
      : s.investments,
    offers: offer ? s.offers.map((o) => (o.id === offer.id ? { ...o, status: 'in_use' as const, projectId } : o)) : s.offers,
    notifications: [...s.notifications, makeNotification(project.farmerId, 'project_validated', { projectId }, `/projects/${projectId}`)],
  }));
  return ok();
}

export function requestChanges(projectId: string, reason: string): Result {
  if (!reason.trim()) return fail('admin.reasonRequired');
  const project = getDb().projects.find((p) => p.id === projectId);
  if (!project) return fail('project.notFound');
  mutate((s) => ({
    projects: s.projects.map((p) => (p.id === projectId ? { ...p, status: 'needs_changes' as const, adminNote: reason.trim() } : p)),
    notifications: [...s.notifications, makeNotification(project.farmerId, 'project_needs_changes', { projectId, reason: reason.trim() }, '/farmer')],
  }));
  return ok();
}

export function rejectProject(projectId: string, reason: string): Result {
  if (!reason.trim()) return fail('admin.reasonRequired');
  const project = getDb().projects.find((p) => p.id === projectId);
  if (!project) return fail('project.notFound');
  mutate((s) => ({
    projects: s.projects.map((p) => (p.id === projectId ? { ...p, status: 'rejected' as const, adminNote: reason.trim() } : p)),
    offers: project.stateOfferId ? s.offers.map((o) => (o.id === project.stateOfferId ? { ...o, projectId: undefined } : o)) : s.offers,
    notifications: [...s.notifications, makeNotification(project.farmerId, 'project_rejected', { projectId, reason: reason.trim() }, '/farmer')],
  }));
  return ok();
}

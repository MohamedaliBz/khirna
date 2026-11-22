import type { UpdateKind } from '../types';
import { getDb } from '../store/useStore';
import { getEscrow, projectInvestments } from '../store/selectors';
import { nowIso, uid } from '../lib/id';
import { ADMIN_ID, creditWallet, fail, makeNotification, makeTx, mutate, ok, type Result } from './core';

export interface UpdateInput {
  projectId: string;
  kind: UpdateKind;
  text: string;
  photo?: string;
  amount?: number;
  milestoneId?: string;
}

/** Agriculteur : publier une actualité, une dépense ou une preuve d'étape (horodatage automatique). */
export function publishUpdate(input: UpdateInput): Result {
  const db = getDb();
  const authorId = db.currentUserId;
  const project = db.projects.find((p) => p.id === input.projectId);
  if (!authorId || !project) return fail('project.notFound');
  if (!input.text.trim()) return fail('wizard.required');
  if (input.kind === 'milestone_proof' && !input.milestoneId) return fail('farmer.noMilestone');

  const updateId = uid('up');
  const isProof = input.kind === 'milestone_proof';
  mutate((s) => ({
    updates: [
      ...s.updates,
      {
        id: updateId,
        projectId: input.projectId,
        authorId,
        kind: input.kind,
        text: { fr: input.text.trim(), ar: input.text.trim() },
        photo: input.photo,
        amount: input.kind === 'expense' ? input.amount : undefined,
        milestoneId: isProof ? input.milestoneId : undefined,
        date: nowIso(),
      },
    ],
    projects: isProof
      ? s.projects.map((p) =>
          p.id === input.projectId
            ? {
                ...p,
                milestones: p.milestones.map((m) =>
                  m.id === input.milestoneId ? { ...m, status: 'proof_submitted' as const, proofUpdateId: updateId, rejectionReason: undefined } : m,
                ),
              }
            : p,
        )
      : s.projects,
    notifications: isProof
      ? [...s.notifications, makeNotification(ADMIN_ID, 'proof_submitted', { projectId: input.projectId, milestoneId: input.milestoneId ?? '' }, '/admin')]
      : s.notifications,
  }));
  return ok();
}

/** Admin : valider une preuve → la tranche sort du séquestre et est versée à l'agriculteur. */
export function validateMilestone(projectId: string, milestoneId: string): Result<number> {
  const db = getDb();
  const project = db.projects.find((p) => p.id === projectId);
  const milestone = project?.milestones.find((m) => m.id === milestoneId);
  if (!project || !milestone) return fail('project.notFound');
  const escrow = getEscrow(db, project);
  if (escrow.held < milestone.tranche) return fail('invest.errBalance');

  const investorIds = Array.from(
    new Set(projectInvestments(db, projectId).filter((i) => i.investorType === 'citizen').map((i) => i.investorId)),
  );
  const params = { projectId, milestoneId };
  mutate((s) => ({
    projects: s.projects.map((p) =>
      p.id === projectId
        ? {
            ...p,
            status: p.status === 'funded' ? ('in_progress' as const) : p.status,
            milestones: p.milestones.map((m) => (m.id === milestoneId ? { ...m, status: 'validated' as const, validatedAt: nowIso() } : m)),
          }
        : p,
    ),
    wallets: creditWallet(s.wallets, project.farmerId, milestone.tranche),
    transactions: [...s.transactions, makeTx(project.farmerId, 'tranche', milestone.tranche, projectId)],
    notifications: [
      ...s.notifications,
      makeNotification(project.farmerId, 'tranche_released', { projectId, amount: milestone.tranche }, '/farmer'),
      makeNotification(project.farmerId, 'milestone_validated', params, `/projects/${projectId}`),
      ...investorIds.map((id) => makeNotification(id, 'milestone_validated', params, `/projects/${projectId}`)),
    ],
  }));
  return ok(milestone.tranche);
}

export function rejectMilestone(projectId: string, milestoneId: string, reason: string): Result {
  if (!reason.trim()) return fail('admin.reasonRequired');
  const project = getDb().projects.find((p) => p.id === projectId);
  if (!project) return fail('project.notFound');
  mutate((s) => ({
    projects: s.projects.map((p) =>
      p.id === projectId
        ? {
            ...p,
            milestones: p.milestones.map((m) =>
              m.id === milestoneId ? { ...m, status: 'rejected' as const, rejectionReason: reason.trim() } : m,
            ),
          }
        : p,
    ),
    notifications: [
      ...s.notifications,
      makeNotification(project.farmerId, 'milestone_rejected', { projectId, milestoneId, reason: reason.trim() }, '/farmer'),
    ],
  }));
  return ok();
}

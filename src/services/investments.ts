import { getDb } from '../store/useStore';
import { getUser, raised, remaining, userWallet } from '../store/selectors';
import { nowIso, uid } from '../lib/id';
import { creditWallet, fail, makeNotification, makeTx, mutate, ok, type Result } from './core';

/** Investissement simulé : débit du portefeuille → séquestre du projet. */
export function invest(projectId: string, amount: number): Result<string> {
  const db = getDb();
  const user = getUser(db, db.currentUserId ?? undefined);
  const project = db.projects.find((p) => p.id === projectId);
  if (!user || user.role !== 'citizen') return fail('invest.errRole');
  if (!project || project.status !== 'funding') return fail('invest.notOpen');
  const rest = remaining(db, project);
  const min = Math.min(project.minInvestment, rest);
  if (amount < min) return fail('invest.errMin', { amount: min });
  if (amount > rest) return fail('invest.errMax', { amount: rest });
  if (amount > userWallet(db, user.id)) return fail('invest.errBalance');

  const investmentId = uid('i');
  const willBeFunded = raised(db, projectId) + amount >= project.goal;
  mutate((s) => ({
    investments: [
      ...s.investments,
      { id: investmentId, projectId, investorId: user.id, investorType: 'citizen', amount, contractType: project.contractType, date: nowIso() },
    ],
    wallets: creditWallet(s.wallets, user.id, -amount),
    transactions: [...s.transactions, makeTx(user.id, 'investment', -amount, projectId)],
    projects: willBeFunded ? s.projects.map((p) => (p.id === projectId ? { ...p, status: 'funded' as const } : p)) : s.projects,
    notifications: [
      ...s.notifications,
      makeNotification(project.farmerId, 'investment_received', { projectId, name: user.name, amount }, `/projects/${projectId}`),
      ...(willBeFunded ? [makeNotification(project.farmerId, 'project_funded', { projectId }, '/farmer')] : []),
    ],
  }));
  return ok(investmentId);
}

export function topUp(amount: number): Result {
  const userId = getDb().currentUserId;
  if (!userId || amount <= 0) return fail('invest.errBalance');
  mutate((s) => ({
    wallets: creditWallet(s.wallets, userId, amount),
    transactions: [...s.transactions, makeTx(userId, 'topup', amount)],
  }));
  return ok();
}

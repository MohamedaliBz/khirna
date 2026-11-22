import type { Distribution, Investment, Payout, Project } from '../types';
import { getDb } from '../store/useStore';
import { projectInvestments, round2, sum } from '../store/selectors';
import { nowIso, uid } from '../lib/id';
import { ADMIN_ID, creditWallet, fail, makeNotification, makeTx, mutate, ok, type Result } from './core';

/** Agriculteur : déclarer la récolte (chiffre d'affaires et coûts). */
export function declareHarvest(projectId: string, revenue: number, costs: number, note: string): Result {
  const project = getDb().projects.find((p) => p.id === projectId);
  if (!project) return fail('project.notFound');
  if (revenue < 0 || costs <= 0) return fail('wizard.required');
  mutate((s) => ({
    saleReports: [...s.saleReports, { id: uid('sr'), projectId, revenue, costs, note: note.trim(), status: 'submitted', createdAt: nowIso() }],
    projects: s.projects.map((p) => (p.id === projectId ? { ...p, status: 'harvest' as const } : p)),
    notifications: [...s.notifications, makeNotification(ADMIN_ID, 'harvest_declared', { projectId }, '/admin')],
  }));
  return ok();
}

/**
 * Calcul de la distribution selon la clé de répartition.
 * - Bénéfice net = chiffre d'affaires − coûts.
 * - Les investisseurs récupèrent leur capital (réduit au prorata en cas de perte),
 *   puis la part « investisseurs » du bénéfice est répartie au prorata des montants (État compris).
 */
export function computeDistribution(project: Project, investments: Investment[], revenue: number, costs: number): Omit<Distribution, 'id' | 'saleReportId' | 'date'> {
  const net = revenue - costs;
  const positive = Math.max(0, net);
  const totalInvested = sum(investments.map((i) => i.amount)) || 1;
  const investorsAmount = round2((positive * project.split.investors) / 100);
  const capitalRatio = net >= 0 ? 1 : Math.max(0, revenue / costs);

  const byInvestor = new Map<string, { type: Investment['investorType']; invested: number }>();
  for (const inv of investments) {
    const cur = byInvestor.get(inv.investorId) ?? { type: inv.investorType, invested: 0 };
    cur.invested += inv.amount;
    byInvestor.set(inv.investorId, cur);
  }
  const payouts: Payout[] = Array.from(byInvestor.entries()).map(([investorId, v]) => ({
    investorId,
    investorType: v.type,
    invested: v.invested,
    capital: round2(v.invested * capitalRatio),
    gain: round2((investorsAmount * v.invested) / totalInvested),
  }));

  return {
    projectId: project.id,
    revenue,
    costs,
    net,
    farmerAmount: round2((positive * project.split.farmer) / 100),
    platformAmount: round2((positive * project.split.platform) / 100),
    reserveAmount: round2((positive * project.split.reserve) / 100),
    investorsAmount,
    payouts,
  };
}

/** Admin : valider la déclaration de récolte → distribution automatique, gains crédités. */
export function validateHarvest(reportId: string): Result<number> {
  const db = getDb();
  const report = db.saleReports.find((r) => r.id === reportId);
  const project = report && db.projects.find((p) => p.id === report.projectId);
  if (!report || !project) return fail('project.notFound');

  const calc = computeDistribution(project, projectInvestments(db, project.id), report.revenue, report.costs);
  const distribution: Distribution = { ...calc, id: uid('d'), saleReportId: report.id, date: nowIso() };
  const citizenPayouts = calc.payouts.filter((p) => p.investorType === 'citizen');

  mutate((s) => {
    let wallets = s.wallets;
    const txs = [...s.transactions];
    const notifs = [...s.notifications];
    for (const p of citizenPayouts) {
      const total = round2(p.capital + p.gain);
      wallets = creditWallet(wallets, p.investorId, total);
      txs.push(makeTx(p.investorId, 'payout', total, project.id));
      notifs.push(makeNotification(p.investorId, 'payout', { projectId: project.id, amount: total }, '/me'));
    }
    if (calc.farmerAmount > 0) {
      wallets = creditWallet(wallets, project.farmerId, calc.farmerAmount);
      txs.push(makeTx(project.farmerId, 'payout', calc.farmerAmount, project.id));
    }
    notifs.push(makeNotification(project.farmerId, 'farmer_payout', { projectId: project.id, amount: calc.farmerAmount }, '/farmer'));
    return {
      wallets,
      transactions: txs,
      notifications: notifs,
      distributions: [...s.distributions, distribution],
      saleReports: s.saleReports.map((r) => (r.id === reportId ? { ...r, status: 'validated' as const } : r)),
      projects: s.projects.map((p) => (p.id === project.id ? { ...p, status: 'distributed' as const } : p)),
    };
  });
  return ok(round2(calc.investorsAmount + sum(calc.payouts.map((p) => p.capital)) + calc.farmerAmount));
}

export function rejectHarvest(reportId: string): Result {
  const report = getDb().saleReports.find((r) => r.id === reportId);
  if (!report) return fail('project.notFound');
  mutate((s) => ({
    saleReports: s.saleReports.map((r) => (r.id === reportId ? { ...r, status: 'rejected' as const } : r)),
    projects: s.projects.map((p) => (p.id === report.projectId ? { ...p, status: 'in_progress' as const } : p)),
  }));
  return ok();
}

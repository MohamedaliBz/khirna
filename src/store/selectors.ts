import type { AppState } from './useStore';
import type { Escrow, Investment, LandApplication, Project, StateLandOffer, User } from '../types';
import { distanceKm } from '../lib/geo';
import { useStore } from './useStore';

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
export const round2 = (n: number) => Math.round(n * 100) / 100;

export const getUser = (db: AppState, id: string | undefined): User | undefined => db.users.find((u) => u.id === id);
export const getProject = (db: AppState, id: string | undefined): Project | undefined => db.projects.find((p) => p.id === id);
export const getOffer = (db: AppState, id: string | undefined): StateLandOffer | undefined => db.offers.find((o) => o.id === id);

export const projectInvestments = (db: AppState, projectId: string): Investment[] =>
  db.investments.filter((i) => i.projectId === projectId);

export const raised = (db: AppState, projectId: string) => sum(projectInvestments(db, projectId).map((i) => i.amount));

export const remaining = (db: AppState, p: Project) => Math.max(0, p.goal - raised(db, p.id));

export const progressPct = (db: AppState, p: Project) => Math.min(100, (raised(db, p.id) / p.goal) * 100);

export const investorsCount = (db: AppState, projectId: string) =>
  new Set(projectInvestments(db, projectId).map((i) => i.investorId)).size;

export const stateInvestment = (db: AppState, projectId: string) =>
  sum(projectInvestments(db, projectId).filter((i) => i.investorType === 'state').map((i) => i.amount));

export const releasedAmount = (p: Project) => sum(p.milestones.filter((m) => m.status === 'validated').map((m) => m.tranche));

export const getEscrow = (db: AppState, p: Project): Escrow => {
  const collected = raised(db, p.id);
  const released = releasedAmount(p);
  return { projectId: p.id, collected, released, held: Math.max(0, collected - released) };
};

/** Rendement estimé (scénario réaliste) pour les investisseurs, en % du capital. */
export const estReturnPct = (p: Project) => Math.max(0, ((p.forecast.realistic - p.goal) * p.split.investors) / p.goal);

export const scenarioGain = (p: Project, amount: number, revenue: number) => {
  const net = revenue - p.goal;
  return net >= 0 ? (net * (p.split.investors / 100) * amount) / p.goal : (net * amount) / p.goal;
};

export const userWallet = (db: AppState, userId: string | undefined) => db.wallets.find((w) => w.userId === userId)?.balance ?? 0;

export const unreadCount = (db: AppState, userId: string | undefined) =>
  db.notifications.filter((n) => n.userId === userId && !n.read).length;

export const isOpenForFunding = (p: Project) => p.status === 'funding';

export const PUBLIC_STATUSES: Project['status'][] = ['funding', 'funded', 'in_progress', 'harvest', 'distributed', 'closed'];

/** Score indicatif d'une candidature : proximité (50) + expérience (50). */
export const applicationScore = (db: AppState, app: LandApplication, offer: StateLandOffer) => {
  const farmer = getUser(db, app.farmerId);
  const dist = farmer?.location ? distanceKm(farmer.location, offer.coords) : 100;
  const proximity = Math.max(0, 50 - dist / 2);
  const experience = (Math.min(app.experienceYears, 15) / 15) * 50;
  return { score: Math.round(proximity + experience), distance: Math.round(dist), proximity: Math.round(proximity), experience: Math.round(experience) };
};

export function useCurrentUser(): User | undefined {
  return useStore((s) => s.users.find((u) => u.id === s.currentUserId));
}

import type { Domain, Governorate, LatLng, WaterAccess } from '../types';
import { getDb } from '../store/useStore';
import { getUser } from '../store/selectors';
import { DOMAIN_PHOTOS, PHOTOS } from '../lib/photos';
import { nowIso, uid } from '../lib/id';
import { STATE_AGENT_ID, fail, makeNotification, mutate, ok, type Result } from './core';

export interface OfferInput {
  name: string;
  description: string;
  governorate: Governorate;
  areaHa: number;
  vocation: Domain;
  water: WaterAccess;
  durationYears: number;
  coords: LatLng;
  jobsEstimate: number;
}

/** Agent de l'État : publier une parcelle domaniale (mise à disposition temporaire). */
export function publishOffer(input: OfferInput): Result<string> {
  const agentId = getDb().currentUserId;
  if (!agentId) return fail('common.loginRequired');
  if (!input.name.trim() || input.areaHa <= 0 || input.durationYears <= 0) return fail('wizard.required');
  const id = uid('o');
  const photo = PHOTOS.lands[Math.floor(Math.random() * PHOTOS.lands.length)] ?? DOMAIN_PHOTOS[input.vocation][0];
  mutate((s) => ({
    offers: [
      ...s.offers,
      {
        id,
        name: { fr: input.name.trim(), ar: input.name.trim() },
        description: { fr: input.description.trim(), ar: input.description.trim() },
        governorate: input.governorate,
        areaHa: input.areaHa,
        vocation: input.vocation,
        water: input.water,
        durationYears: input.durationYears,
        coords: input.coords,
        photo,
        status: 'open',
        agentId,
        publishedAt: nowIso(),
        jobsEstimate: input.jobsEstimate,
      },
    ],
  }));
  return ok(id);
}

export interface ApplicationInput {
  offerId: string;
  domain: Domain;
  experienceYears: number;
  plan: string;
  budgetNeeded: number;
}

/** Agriculteur type 2 : postuler à une parcelle. */
export function applyToOffer(input: ApplicationInput): Result {
  const db = getDb();
  const farmer = getUser(db, db.currentUserId ?? undefined);
  const offer = db.offers.find((o) => o.id === input.offerId);
  if (!farmer || !offer) return fail('common.loginRequired');
  if (!input.plan.trim()) return fail('wizard.required');
  mutate((s) => ({
    applications: [
      ...s.applications,
      {
        id: uid('a'),
        offerId: input.offerId,
        farmerId: farmer.id,
        domain: input.domain,
        experienceYears: input.experienceYears,
        plan: input.plan.trim(),
        budgetNeeded: input.budgetNeeded,
        status: 'sent',
        createdAt: nowIso(),
      },
    ],
    offers: s.offers.map((o) => (o.id === input.offerId && o.status === 'open' ? { ...o, status: 'reviewing' as const } : o)),
    notifications: [
      ...s.notifications,
      makeNotification(offer.agentId || STATE_AGENT_ID, 'application_received', { offerId: offer.id, name: farmer.name }, '/state'),
    ],
  }));
  return ok();
}

/** Agent de l'État : retenir un candidat → la parcelle est attribuée, les autres passent en liste d'attente. */
export function retainApplication(applicationId: string): Result {
  const db = getDb();
  const app = db.applications.find((a) => a.id === applicationId);
  if (!app) return fail('project.notFound');
  const others = db.applications.filter((a) => a.offerId === app.offerId && a.id !== app.id && a.status === 'sent');
  mutate((s) => ({
    applications: s.applications.map((a) =>
      a.id === app.id ? { ...a, status: 'accepted' as const } : others.some((o) => o.id === a.id) ? { ...a, status: 'waitlist' as const } : a,
    ),
    offers: s.offers.map((o) => (o.id === app.offerId ? { ...o, status: 'assigned' as const, assignedFarmerId: app.farmerId } : o)),
    notifications: [
      ...s.notifications,
      makeNotification(app.farmerId, 'application_accepted', { offerId: app.offerId }, '/lands'),
      ...others.map((o) => makeNotification(o.farmerId, 'application_waitlist', { offerId: app.offerId }, '/lands')),
    ],
  }));
  return ok();
}

export function refuseApplication(applicationId: string): Result {
  const app = getDb().applications.find((a) => a.id === applicationId);
  if (!app) return fail('project.notFound');
  mutate((s) => ({
    applications: s.applications.map((a) => (a.id === applicationId ? { ...a, status: 'rejected' as const } : a)),
    notifications: [...s.notifications, makeNotification(app.farmerId, 'application_rejected', { offerId: app.offerId }, '/lands')],
  }));
  return ok();
}

/** Agent de l'État : fixer le montant du co-investissement public. */
export function setCoInvestment(offerId: string, amount: number): Result {
  const db = getDb();
  const offer = db.offers.find((o) => o.id === offerId);
  if (!offer || amount <= 0) return fail('wizard.required');
  const project = offer.projectId ? db.projects.find((p) => p.id === offer.projectId) : undefined;
  mutate((s) => ({
    offers: s.offers.map((o) => (o.id === offerId ? { ...o, coInvestment: amount } : o)),
    notifications: offer.assignedFarmerId
      ? [...s.notifications, makeNotification(offer.assignedFarmerId, 'coinvest_set', { offerId, amount }, project ? `/projects/${project.id}` : '/lands')]
      : s.notifications,
  }));
  return ok();
}

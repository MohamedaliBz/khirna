import type { Governorate, Role } from '../types';
import { createSeed } from '../data/seed';
import { GOV_COORDS } from '../lib/geo';
import { nowIso, uid } from '../lib/id';
import { getDb, setDb } from '../store/useStore';
import { fail, makeTx, ok, type Result } from './core';

export function loginAs(userId: string) {
  setDb({ currentUserId: userId });
}

export function logout() {
  setDb({ currentUserId: null });
}

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  role: Role;
  governorate: Governorate;
}

export function register(input: RegisterInput): Result<string> {
  if (!input.name.trim() || !input.email.trim() || !input.phone.trim()) return fail('login.fillAll');
  const id = uid('u');
  const db = getDb();
  const welcome = input.role === 'citizen' ? 5000 : 0;
  const isFarmer = input.role === 'farmer_t1' || input.role === 'farmer_t2';
  setDb({
    users: [
      ...db.users,
      {
        id,
        name: input.name.trim(),
        email: input.email.trim(),
        phone: input.phone.trim(),
        role: input.role,
        governorate: input.governorate,
        location: GOV_COORDS[input.governorate],
        experienceYears: isFarmer ? 3 : undefined,
        rating: isFarmer ? 4.5 : undefined,
        createdAt: nowIso(),
      },
    ],
    wallets: [...db.wallets, { userId: id, balance: welcome }],
    transactions: welcome ? [...db.transactions, makeTx(id, 'topup', welcome)] : db.transactions,
    currentUserId: id,
  });
  return ok(id);
}

/** Restaure le jeu de données de démo en gardant le compte connecté (s'il existe dans le seed). */
export function resetDemo() {
  const current = getDb().currentUserId;
  const seed = createSeed();
  const keep = current && seed.users.some((u) => u.id === current) ? current : null;
  setDb({ ...seed, currentUserId: keep });
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Database } from '../types';
import { createSeed } from '../data/seed';

/**
 * Backend simulé : toute la base vit ici et est persistée dans localStorage.
 * Les composants LISENT ce store ; toutes les ÉCRITURES passent par src/services/.
 */
export interface AppState extends Database {
  currentUserId: string | null;
}

export const STORE_KEY = 'khirna-db';

export const useStore = create<AppState>()(
  persist(() => ({ ...createSeed(), currentUserId: null as string | null }), {
    name: STORE_KEY,
    version: 1,
  }),
);

export const getDb = () => useStore.getState();
export const setDb = useStore.setState;

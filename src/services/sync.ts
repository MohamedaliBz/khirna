import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { create } from 'zustand';
import type { Database } from '../types';
import { useStore } from '../store/useStore';
import { createSeed } from '../data/seed';

/**
 * Synchronisation avec Supabase.
 * - Le store Zustand reste la source de lecture des écrans (cache local, persisté).
 * - Chaque modification du store est comparée à l'état précédent et envoyée à Supabase
 *   (upsert des lignes modifiées, suppression des lignes retirées).
 * - Les modifications faites sur les autres appareils arrivent en temps réel.
 * - Sans clés Supabase (ou en cas d'erreur), l'app continue en mode local.
 */

type Key = keyof Database;
type Item = Record<string, unknown>;

const TABLES: Record<Key, string> = {
  users: 'users',
  projects: 'projects',
  investments: 'investments',
  wallets: 'wallets',
  transactions: 'transactions',
  updates: 'updates',
  visits: 'visits',
  offers: 'offers',
  applications: 'applications',
  saleReports: 'sale_reports',
  distributions: 'distributions',
  notifications: 'notifications',
};
const KEYS = Object.keys(TABLES) as Key[];
const TABLE_TO_KEY = Object.fromEntries(KEYS.map((k) => [TABLES[k], k])) as Record<string, Key>;
const PAGE = 1000;
const CHUNK = 400;

const rowId = (key: Key, item: Item): string => String(key === 'wallets' ? item.userId : item.id);

export type SyncStatus = 'local' | 'connecting' | 'online' | 'error';
export const useSync = create<{ status: SyncStatus; error?: string }>(() => ({ status: 'local' }));

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;
export const isSupabaseConfigured = !!supabase;

let started = false;
let live = false;
let applyingRemote = false;
let queue: Promise<void> = Promise.resolve();

function setError(e: unknown) {
  const message = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : String(e);
  console.warn('[KHIRNA sync]', message);
  useSync.setState({ status: 'error', error: message });
}

/** Égalité profonde indépendante de l'ordre des clés (jsonb réordonne les clés). */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => deepEqual(x, b[i]));
  const ka = Object.keys(a as Item).filter((k) => (a as Item)[k] !== undefined);
  const kb = Object.keys(b as Item).filter((k) => (b as Item)[k] !== undefined);
  return ka.length === kb.length && ka.every((k) => deepEqual((a as Item)[k], (b as Item)[k]));
}

function applyRemote(patch: Partial<Database>) {
  applyingRemote = true;
  try {
    useStore.setState(patch);
  } finally {
    applyingRemote = false;
  }
}

async function fetchTable(key: Key): Promise<Item[]> {
  const rows: Item[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase!.from(TABLES[key]).select('id,data').range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data ?? []).map((r) => r.data as Item));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

async function upsertRows(key: Key, items: Item[]) {
  const now = new Date().toISOString();
  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK).map((item) => ({ id: rowId(key, item), data: item, updated_at: now }));
    const { error } = await supabase!.from(TABLES[key]).upsert(chunk);
    if (error) throw error;
  }
}

async function deleteRows(key: Key, ids: string[]) {
  for (let i = 0; i < ids.length; i += CHUNK) {
    const { error } = await supabase!.from(TABLES[key]).delete().in('id', ids.slice(i, i + CHUNK));
    if (error) throw error;
  }
}

/** Les envois sont sérialisés pour respecter l'ordre des actions. */
function enqueue(task: () => Promise<void>) {
  queue = queue
    .then(task)
    .then(() => {
      if (useSync.getState().status === 'error') useSync.setState({ status: 'online', error: undefined });
    })
    .catch(setError);
}

function diff(key: Key, next: Item[], prev: Item[]) {
  const prevMap = new Map(prev.map((i) => [rowId(key, i), i]));
  const seen = new Set<string>();
  const upserts: Item[] = [];
  for (const item of next) {
    const id = rowId(key, item);
    seen.add(id);
    if (prevMap.get(id) !== item) upserts.push(item);
  }
  const deletes = [...prevMap.keys()].filter((id) => !seen.has(id));
  return { upserts, deletes };
}

function onLocalChange(state: Database, prev: Database) {
  if (!live || applyingRemote) return;
  for (const key of KEYS) {
    const next = state[key] as unknown as Item[];
    const before = prev[key] as unknown as Item[];
    if (next === before) continue;
    const { upserts, deletes } = diff(key, next, before);
    if (!upserts.length && !deletes.length) continue;
    enqueue(async () => {
      if (deletes.length) await deleteRows(key, deletes);
      if (upserts.length) await upsertRows(key, upserts);
    });
  }
}

function onRemoteChange(payload: { table: string; eventType: string; new: Item; old: Item }) {
  const key = TABLE_TO_KEY[payload.table];
  if (!key) return;
  const list = useStore.getState()[key] as unknown as Item[];
  if (payload.eventType === 'DELETE') {
    const id = String(payload.old?.id ?? '');
    const next = list.filter((i) => rowId(key, i) !== id);
    if (next.length !== list.length) applyRemote({ [key]: next } as Partial<Database>);
    return;
  }
  const item = payload.new?.data as Item | undefined;
  if (!item) return;
  const id = rowId(key, item);
  const idx = list.findIndex((i) => rowId(key, i) === id);
  if (idx >= 0 && deepEqual(list[idx], item)) return; // écho de notre propre envoi
  const next = idx >= 0 ? list.map((x, j) => (j === idx ? item : x)) : [...list, item];
  applyRemote({ [key]: next } as Partial<Database>);
}

/** Démarre la synchronisation (appelé une fois au lancement de l'app). */
export async function startSync() {
  if (!supabase || started) return;
  started = true;
  useSync.setState({ status: 'connecting' });
  try {
    const remote: Partial<Database> = {};
    await Promise.all(
      KEYS.map(async (k) => {
        (remote as unknown as Record<Key, Item[]>)[k] = await fetchTable(k);
      }),
    );

    if (!remote.projects?.length && !remote.users?.length) {
      // Base vide : on y envoie le jeu de données de démo.
      const seed = createSeed();
      for (const k of KEYS) await upsertRows(k, seed[k] as unknown as Item[]);
      applyRemote(seed);
    } else {
      applyRemote(remote);
    }

    live = true;
    useStore.subscribe(onLocalChange);
    supabase
      .channel('khirna-db')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => onRemoteChange(payload as unknown as Parameters<typeof onRemoteChange>[0]))
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setError(new Error(`realtime ${status}`));
      });
    useSync.setState({ status: 'online', error: undefined });
  } catch (e) {
    started = false;
    setError(e);
  }
}

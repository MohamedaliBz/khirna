import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { fr, type Dict } from './fr';
import { ar } from './ar';
import { useUi } from '../store/ui';
import type { L10n, Lang } from '../types';
import { formatDate, formatDateTime, formatMoney, formatPct } from '../lib/format';

type Paths<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Paths<T[K], `${P}${K}.`>;
}[keyof T & string];

/** Toutes les clés de traduction valides (vérifiées à la compilation). */
export type TKey = Paths<Dict>;
export type TParams = Record<string, string | number>;

const DICTS: Record<Lang, Dict> = { fr, ar };

function lookup(dict: Dict, key: string): string {
  let node: unknown = dict;
  for (const part of key.split('.')) {
    if (node && typeof node === 'object' && part in node) node = (node as Record<string, unknown>)[part];
    else return key;
  }
  return typeof node === 'string' ? node : key;
}

export function translate(lang: Lang, key: TKey, params?: TParams): string {
  let s = lookup(DICTS[lang], key);
  if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

interface I18nValue {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: (key: TKey, params?: TParams) => string;
  tr: (text: L10n | undefined) => string;
  money: (n: number) => string;
  pct: (n: number, decimals?: number) => string;
  date: (iso: string) => string;
  dateTime: (iso: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const lang = useUi((s) => s.lang);
  const setLang = useUi((s) => s.setLang);

  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const toggleLang = useCallback(() => setLang(lang === 'ar' ? 'fr' : 'ar'), [lang, setLang]);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      dir: lang === 'ar' ? 'rtl' : 'ltr',
      setLang,
      toggleLang,
      t: (key, params) => translate(lang, key, params),
      tr: (text) => (text ? text[lang] || text.fr : ''),
      money: (n) => formatMoney(n, lang),
      pct: (n, decimals = 0) => formatPct(n, decimals),
      date: (iso) => formatDate(iso, lang),
      dateTime: (iso) => formatDateTime(iso, lang),
    }),
    [lang, setLang, toggleLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}

import type { Lang } from '../types';

/** Regroupe les milliers avec une espace fine : 1250 → « 1 250 ». */
export function groupNumber(n: number, decimals = 0): string {
  const fixed = Math.abs(n).toFixed(decimals);
  const [int, dec] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (n < 0 ? '-' : '') + grouped + (dec && Number(dec) !== 0 ? ',' + dec : '');
}

/** « 1 250 DT » en français, « 1 250 د.ت » en arabe. */
export function formatMoney(n: number, lang: Lang, decimals = 0): string {
  const value = groupNumber(Math.round(n * 10 ** decimals) / 10 ** decimals, decimals);
  return lang === 'ar' ? `${value} د.ت` : `${value} DT`;
}

export function formatPct(n: number, decimals = 0): string {
  return `${groupNumber(n, decimals)} %`;
}

const locale = (lang: Lang) => (lang === 'ar' ? 'ar-TN-u-nu-latn' : 'fr-FR');

export function formatDate(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleDateString(locale(lang), { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleString(locale(lang), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatMonthYear(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleDateString(locale(lang), { month: 'long', year: 'numeric' });
}

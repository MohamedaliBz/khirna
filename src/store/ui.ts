import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Lang } from '../types';

export interface Toast {
  id: number;
  message: string;
  tone: 'success' | 'error' | 'info';
}

interface UiState {
  lang: Lang;
  toasts: Toast[];
  setLang: (lang: Lang) => void;
  toast: (message: string, tone?: Toast['tone']) => void;
  dismiss: (id: number) => void;
}

let toastSeq = 1;

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      lang: 'fr',
      toasts: [],
      setLang: (lang) => set({ lang }),
      toast: (message, tone = 'success') => {
        const id = toastSeq++;
        set((s) => ({ toasts: [...s.toasts, { id, message, tone }].slice(-2) }));
        window.setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3800);
      },
      dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    { name: 'khirna-ui', partialize: (s) => ({ lang: s.lang }) },
  ),
);

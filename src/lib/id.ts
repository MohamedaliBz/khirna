export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const nowIso = () => new Date().toISOString();

export const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, UserPlus } from 'lucide-react';
import type { Governorate, Role, User } from '../types';
import { useI18n } from '../i18n';
import { useStore } from '../store/useStore';
import { userWallet } from '../store/selectors';
import { useUi } from '../store/ui';
import { loginAs, register } from '../services/auth';
import { DEMO_IDS } from '../data/seed';
import { GOVERNORATES } from '../lib/geo';
import { dashboardPath, useResultToast } from '../components/hooks';
import { UserAvatar } from '../components/Layout';
import { Card, Field } from '../components/ui';

const ROLES: Role[] = ['citizen', 'farmer_t1', 'farmer_t2', 'state_agent', 'admin'];

export default function Login() {
  const { t, lang, money } = useI18n();
  const db = useStore();
  const toast = useUi((s) => s.toast);
  const showResult = useResultToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect');
  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;

  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'citizen' as Role, governorate: 'tunis' as Governorate });

  const demoUsers = (Object.values(DEMO_IDS) as string[]).map((id) => db.users.find((u) => u.id === id)).filter((u): u is User => !!u);

  const enter = (u: User) => {
    loginAs(u.id);
    toast(t('login.welcome', { name: u.name }), 'info');
    navigate(redirect || dashboardPath(u.role));
  };

  const onRegister = (e: FormEvent) => {
    e.preventDefault();
    const res = register(form);
    if (showResult(res, t('login.registered', { name: form.name }))) navigate(redirect || dashboardPath(form.role));
  };

  return (
    <div className="container-app py-8 sm:py-12">
      <div className="mb-8 text-center">
        <img src="/logo.jpeg" alt="KHIRNA" className="mx-auto mb-4 h-20 w-auto rounded-2xl mix-blend-multiply" />
        <h1 className="text-2xl font-extrabold sm:text-3xl">{t('login.title')}</h1>
        <p className="mt-2 text-ink-soft">{t('login.subtitle')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-muted">{t('login.enterAs')}</h2>
          <div className="space-y-3">
            {demoUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => enter(u)}
                className="card group flex w-full items-center gap-4 p-4 text-start transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
              >
                <UserAvatar user={u} size={52} />
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{u.name}</div>
                  <div className="text-sm font-semibold text-primary">{t(`roles.${u.role}`)}</div>
                  <div className="text-xs text-ink-muted">
                    {t(`roleDesc.${u.role}`)}
                    {u.role === 'citizen' && ` · ${money(userWallet(db, u.id))}`}
                    {(u.role === 'farmer_t1' || u.role === 'farmer_t2') && ` · ${t(`gov.${u.governorate}`)}`}
                  </div>
                </div>
                <span className="rounded-full bg-primary-50 p-2 text-primary transition group-hover:bg-primary group-hover:text-white">
                  <Arrow size={18} />
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-muted">{t('login.registerTitle')}</h2>
          <Card>
            <form className="space-y-3" onSubmit={onRegister}>
              <Field label={t('login.name')}>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
              </Field>
              <Field label={t('login.email')}>
                <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
              </Field>
              <Field label={t('login.phone')}>
                <input className="input" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
              </Field>
              <Field label={t('login.role')}>
                <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                  {ROLES.filter((r) => r !== 'admin' && r !== 'state_agent').map((r) => (
                    <option key={r} value={r}>
                      {t(`roles.${r}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('login.governorate')}>
                <select className="input" value={form.governorate} onChange={(e) => setForm({ ...form, governorate: e.target.value as Governorate })}>
                  {GOVERNORATES.map((g) => (
                    <option key={g} value={g}>
                      {t(`gov.${g}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <button className="btn-primary w-full" type="submit">
                <UserPlus size={18} /> {t('login.register')}
              </button>
            </form>
          </Card>
        </section>
      </div>
    </div>
  );
}

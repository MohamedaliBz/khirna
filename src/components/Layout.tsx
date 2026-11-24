import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Building2,
  ChevronDown,
  FlaskConical,
  Home,
  Landmark,
  LayoutDashboard,
  Languages,
  LogIn,
  LogOut,
  Map as MapIcon,
  RotateCcw,
  ShieldCheck,
  Sprout,
  CheckCircle2,
  AlertCircle,
  Info,
  Loader2,
} from 'lucide-react';
import { useI18n, type TKey } from '../i18n';
import { useStore } from '../store/useStore';
import { unreadCount, useCurrentUser } from '../store/selectors';
import { useUi } from '../store/ui';
import { loginAs, logout, resetDemo } from '../services/auth';
import { markAllRead, markRead } from '../services/notifications';
import { DEMO_IDS } from '../data/seed';
import { ErrorBoundary } from './ErrorBoundary';
import { AssistantWidget } from './AssistantWidget';
import { isSupabaseConfigured, useSync } from '../services/sync';
import { Avatar } from './visuals';
import { dashboardPath, useNotificationText } from './hooks';
import type { Role, User } from '../types';

export const ROLE_ICONS: Record<Role, typeof Sprout> = {
  citizen: LayoutDashboard,
  farmer_t1: Sprout,
  farmer_t2: MapIcon,
  state_agent: Landmark,
  admin: ShieldCheck,
};

export function UserAvatar({ user, size = 36 }: { user: User; size?: number }) {
  const Icon = ROLE_ICONS[user.role];
  const iconOnly = user.role === 'state_agent' || user.role === 'admin';
  return <Avatar src={user.avatar} name={user.name} size={size} icon={iconOnly ? <Icon size={size * 0.5} /> : undefined} />;
}

function useClickOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, close]);
  return ref;
}

function SyncIndicator() {
  const { t } = useI18n();
  const status = useSync((s) => s.status);
  const error = useSync((s) => s.error);
  const map = {
    online: { color: 'bg-emerald-500', label: t('common.syncOnline') },
    connecting: { color: 'bg-wheat animate-pulse', label: t('common.syncConnecting') },
    error: { color: 'bg-red-500', label: t('common.syncError') },
    local: { color: 'bg-ink/30', label: t('common.syncLocal') },
  }[status];
  return (
    <span className="flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold text-ink-muted" title={error ? `${map.label} · ${error}` : map.label}>
      <span className={`h-2 w-2 rounded-full ${map.color}`} />
      <span className="hidden xl:inline">{map.label}</span>
    </span>
  );
}

function LangToggle() {
  const { t, toggleLang } = useI18n();
  return (
    <button onClick={toggleLang} className="btn-ghost rounded-full px-3 py-2 font-bold" aria-label={t('common.language')} title={t('common.language')}>
      <Languages size={18} />
      <span className="hidden sm:inline">{t('common.language')}</span>
      <span className="sm:hidden">{t('common.languageShort')}</span>
    </button>
  );
}

function NotificationBell() {
  const { t, dateTime } = useI18n();
  const db = useStore();
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(open, () => setOpen(false));
  const text = useNotificationText();
  const navigate = useNavigate();
  if (!user) return null;
  const count = unreadCount(db, user.id);
  const list = db.notifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  return (
    <div className="relative" ref={ref}>
      <button className="btn-ghost relative rounded-full p-2.5" onClick={() => setOpen((o) => !o)} aria-label={t('nav.notifications')}>
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-wheat px-1 text-[11px] font-bold text-ink ring-2 ring-white">
            {count}
          </span>
        )}
      </button>
      {open && (
        <div className="fixed inset-x-3 top-16 z-[1100] overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-2xl animate-fadeUp sm:absolute sm:inset-x-auto sm:end-0 sm:top-12 sm:w-96">
          <div className="flex items-center justify-between border-b border-ink/5 px-4 py-3">
            <b>{t('notifications.title')}</b>
            {count > 0 && (
              <button className="text-xs font-semibold text-primary hover:underline" onClick={markAllRead}>
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>
          <ul className="max-h-[60vh] overflow-y-auto">
            {list.length === 0 && <li className="px-4 py-8 text-center text-sm text-ink-muted">{t('notifications.empty')}</li>}
            {list.map((n) => (
              <li key={n.id}>
                <button
                  className={`flex w-full gap-3 px-4 py-3 text-start text-sm hover:bg-cream ${n.read ? 'text-ink-soft' : 'bg-primary-50/50 font-semibold text-ink'}`}
                  onClick={() => {
                    markRead(n.id);
                    setOpen(false);
                    if (n.link) navigate(n.link);
                  }}
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-wheat'}`} />
                  <span>
                    {text(n)}
                    <span className="mt-0.5 block text-xs font-normal text-ink-muted">{dateTime(n.date)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <Link to="/notifications" onClick={() => setOpen(false)} className="block border-t border-ink/5 px-4 py-2.5 text-center text-sm font-semibold text-primary hover:bg-cream">
            {t('common.seeAll')}
          </Link>
        </div>
      )}
    </div>
  );
}

function AccountMenu() {
  const { t } = useI18n();
  const user = useCurrentUser();
  const users = useStore((s) => s.users);
  const toast = useUi((s) => s.toast);
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(open, () => setOpen(false));
  const navigate = useNavigate();
  const demoUsers = (Object.values(DEMO_IDS) as string[]).map((id) => users.find((u) => u.id === id)).filter((u): u is User => !!u);

  const switchTo = (u: User) => {
    loginAs(u.id);
    setOpen(false);
    toast(t('login.welcome', { name: u.name }), 'info');
    navigate(dashboardPath(u.role));
  };

  if (!user) {
    return (
      <Link to="/login" className="btn-primary btn-sm">
        <LogIn size={16} /> <span className="hidden sm:inline">{t('common.login')}</span>
      </Link>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button className="flex items-center gap-2 rounded-full p-1 pe-2 hover:bg-ink/5" onClick={() => setOpen((o) => !o)} aria-label={t('common.switchAccount')}>
        <UserAvatar user={user} size={34} />
        <span className="hidden max-w-[150px] text-start leading-tight lg:block">
          <span className="block truncate text-sm font-bold">{user.name}</span>
          <span className="block truncate text-[11px] text-ink-muted">{t(`roles.${user.role}`)}</span>
        </span>
        <ChevronDown size={16} className="hidden text-ink-muted sm:block" />
      </button>
      {open && (
        <div className="fixed inset-x-3 top-16 z-[1100] overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-2xl animate-fadeUp sm:absolute sm:inset-x-auto sm:end-0 sm:top-12 sm:w-80">
          <p className="px-4 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-ink-muted">{t('common.switchAccount')}</p>
          <ul>
            {demoUsers.map((u) => (
              <li key={u.id}>
                <button
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-start hover:bg-cream ${u.id === user.id ? 'bg-primary-50' : ''}`}
                  onClick={() => switchTo(u)}
                >
                  <UserAvatar user={u} size={32} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{u.name}</span>
                    <span className="block truncate text-xs text-ink-muted">{t(`roles.${u.role}`)}</span>
                  </span>
                  {u.id === user.id && <CheckCircle2 size={16} className="text-primary" />}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-ink/5 p-2">
            <button
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-wheat-dark hover:bg-wheat-50"
              onClick={() => {
                if (window.confirm(t(isSupabaseConfigured ? 'common.resetConfirmOnline' : 'common.resetConfirm'))) {
                  resetDemo();
                  setOpen(false);
                  toast(t('common.resetDone'), 'info');
                }
              }}
            >
              <RotateCcw size={16} /> {t('common.resetDemo')}
            </button>
            <button
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-ink/5"
              onClick={() => {
                logout();
                setOpen(false);
                navigate('/');
              }}
            >
              <LogOut size={16} /> {t('common.logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface NavItem {
  to: string;
  label: TKey;
  icon: typeof Home;
  end?: boolean;
}

function useNavItems(): NavItem[] {
  const user = useCurrentUser();
  const items: NavItem[] = [
    { to: '/', label: 'nav.home', icon: Home, end: true },
    { to: '/projects', label: 'nav.projects', icon: Sprout },
  ];
  if (user?.role === 'farmer_t2') items.push({ to: '/lands', label: 'nav.lands', icon: MapIcon });
  if (user) {
    const label: TKey = user.role === 'state_agent' ? 'nav.state' : user.role === 'admin' ? 'nav.admin' : 'nav.dashboard';
    const icon = user.role === 'state_agent' ? Building2 : user.role === 'admin' ? ShieldCheck : LayoutDashboard;
    items.push({ to: dashboardPath(user.role), label, icon });
  }
  return items;
}

function Header() {
  const { t } = useI18n();
  const items = useNavItems();
  return (
    <header className="sticky top-0 z-[900] border-b border-ink/5 bg-cream/90 backdrop-blur">
      <div className="container-app flex h-16 items-center gap-3">
        <Link to="/" className="flex shrink-0 items-center" aria-label={t('common.appName')}>
          <img src="/logo.jpeg" alt="KHIRNA" className="h-11 w-auto rounded-lg mix-blend-multiply" />
        </Link>
        <nav className="ms-4 hidden items-center gap-1 md:flex">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) => `rounded-xl px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-primary text-white' : 'text-ink-soft hover:bg-ink/5'}`}
            >
              {t(it.label)}
            </NavLink>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-1">
          <SyncIndicator />
          <LangToggle />
          <NotificationBell />
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}

function BottomNav() {
  const { t } = useI18n();
  const items = useNavItems();
  const user = useCurrentUser();
  const all: NavItem[] = user ? [...items, { to: '/notifications', label: 'nav.notifications', icon: Bell }] : items;
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-[900] border-t border-ink/10 bg-white/95 backdrop-blur md:hidden">
      <ul className="flex">
        {all.map((it) => (
          <li key={it.to} className="flex-1">
            <NavLink
              to={it.to}
              end={it.end}
              className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${isActive ? 'text-primary' : 'text-ink-muted'}`}
            >
              {({ isActive }) => (
                <>
                  <span className={`rounded-full px-3 py-1 ${isActive ? 'bg-primary-50' : ''}`}>
                    <it.icon size={20} />
                  </span>
                  <span className="max-w-full truncate px-1">{t(it.label)}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Toaster() {
  const toasts = useUi((s) => s.toasts);
  const dismiss = useUi((s) => s.dismiss);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[2000] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`pointer-events-auto flex max-w-md items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold shadow-xl animate-fadeUp ${
            t.tone === 'error' ? 'bg-red-600 text-white' : t.tone === 'info' ? 'bg-ink text-white' : 'bg-primary text-white'
          }`}
        >
          {t.tone === 'error' ? <AlertCircle size={18} /> : t.tone === 'info' ? <Info size={18} /> : <CheckCircle2 size={18} />}
          {t.message}
        </button>
      ))}
    </div>
  );
}

export function Layout() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-primary-dark py-1 text-center text-[11px] font-semibold text-white/90">
        <FlaskConical size={12} className="me-1 inline" />
        {t('common.prototypeBanner')}
      </div>
      <Header />
      <main className="flex-1 pb-24 md:pb-10">
        <Suspense
          fallback={
            <div className="flex justify-center py-24 text-primary">
              <Loader2 className="animate-spin" size={32} />
            </div>
          }
        >
          <ErrorBoundary
            key={pathname}
            fallback={(error) => (
              <div className="container-app py-16 text-center">
                <p className="mb-2 font-bold text-red-700">{t('notFound.title')}</p>
                <pre id="page-error" className="mx-auto max-w-2xl whitespace-pre-wrap text-start text-xs text-ink-muted">{error.message}</pre>
                <a href="/" className="btn-primary btn-sm mt-4">{t('notFound.back')}</a>
              </div>
            )}
          >
            <Outlet />
          </ErrorBoundary>
        </Suspense>
      </main>
      <footer className="hidden border-t border-ink/5 py-6 text-center text-xs text-ink-muted md:block">
        <span className="font-bold text-primary">KHIRNA · خيرنا</span> — {t('common.slogan')} · {t('common.prototypeBanner')}
      </footer>
      <BottomNav />
      <Toaster />
      <AssistantWidget />
    </div>
  );
}

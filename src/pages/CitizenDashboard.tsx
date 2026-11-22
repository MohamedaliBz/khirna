import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, CalendarCheck, Coins, History, LayoutDashboard, Newspaper, Plus, Sprout, TrendingUp, Wallet } from 'lucide-react';
import { useI18n } from '../i18n';
import { useStore } from '../store/useStore';
import { getProject, progressPct, round2, sum, userWallet, useCurrentUser } from '../store/selectors';
import { topUp } from '../services/investments';
import { useResultToast } from '../components/hooks';
import { UpdateFeed } from '../components/UpdateFeed';
import { Img, ProgressBar, ProjectStatusBadge, StatCard, VisitBadge } from '../components/visuals';
import { Card, CardTitle, EmptyState, Modal, PageHeader } from '../components/ui';

export default function CitizenDashboard() {
  const { t, tr, money, pct, date } = useI18n();
  const db = useStore();
  const user = useCurrentUser()!;
  const showResult = useResultToast();
  const [topupOpen, setTopupOpen] = useState(false);

  const myInv = db.investments.filter((i) => i.investorId === user.id);
  const byProject = Array.from(new Set(myInv.map((i) => i.projectId)))
    .map((pid) => ({ project: getProject(db, pid)!, amount: sum(myInv.filter((i) => i.projectId === pid).map((i) => i.amount)) }))
    .filter((x) => x.project)
    .sort((a, b) => b.amount - a.amount);
  const gains = round2(sum(db.distributions.flatMap((d) => d.payouts.filter((p) => p.investorId === user.id).map((p) => p.gain))));
  const projectIds = new Set(byProject.map((x) => x.project.id));
  const feed = db.updates.filter((u) => projectIds.has(u.projectId));
  const visits = db.visits.filter((v) => v.citizenId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const txs = db.transactions.filter((tx) => tx.userId === user.id).sort((a, b) => b.date.localeCompare(a.date));

  const doTopup = (amount: number) => {
    if (showResult(topUp(amount), t('citizen.topupDone', { amount: money(amount) }))) setTopupOpen(false);
  };

  return (
    <div className="container-app py-8">
      <PageHeader
        title={t('citizen.hello', { name: user.name.split(' ')[0] })}
        subtitle={t('citizen.title')}
        icon={<LayoutDashboard size={24} />}
        actions={
          <Link to="/projects" className="btn-primary">
            <Sprout size={18} /> {t('home.discover')}
          </Link>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card col-span-2 flex items-center justify-between gap-3 bg-primary p-4 text-white lg:col-span-1">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white/80">
              <Wallet size={14} /> {t('citizen.wallet')}
            </div>
            <div className="text-2xl font-extrabold">{money(userWallet(db, user.id))}</div>
          </div>
          <button className="btn-wheat btn-sm" onClick={() => setTopupOpen(true)}>
            <Plus size={14} /> {t('citizen.topup')}
          </button>
        </div>
        <StatCard icon={<Coins size={20} />} label={t('citizen.invested')} value={money(sum(myInv.map((i) => i.amount)))} />
        <StatCard icon={<TrendingUp size={20} />} label={t('citizen.gains')} value={money(gains)} tone="wheat" />
        <StatCard icon={<Sprout size={20} />} label={t('citizen.projectsCount')} value={String(byProject.length)} tone="olive" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardTitle icon={<Sprout size={18} />}>{t('citizen.myInvestments')}</CardTitle>
            {byProject.length === 0 ? (
              <EmptyState text={t('citizen.noInvestments')} action={<Link to="/projects" className="btn-primary btn-sm">{t('home.discover')}</Link>} />
            ) : (
              <ul className="divide-y divide-ink/5">
                {byProject.map(({ project, amount }) => {
                  const done = project.milestones.filter((m) => m.status === 'validated').length;
                  const funding = project.status === 'funding';
                  const dist = db.distributions.find((d) => d.projectId === project.id);
                  const myPayout = dist?.payouts.find((p) => p.investorId === user.id);
                  return (
                    <li key={project.id} className="py-3 first:pt-0 last:pb-0">
                      <Link to={`/projects/${project.id}`} className="flex gap-3 rounded-xl p-1 hover:bg-cream">
                        <Img src={project.photos[0]} alt="" domain={project.domain} className="h-20 w-24 shrink-0 rounded-xl sm:w-28" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="font-bold leading-snug">{tr(project.title)}</p>
                            <ProjectStatusBadge status={project.status} />
                          </div>
                          <p className="mt-0.5 text-sm">
                            <b className="text-primary">{money(amount)}</b>
                            <span className="text-ink-muted"> · {t('citizen.myStake', { pct: pct((amount / project.goal) * 100, 2) })}</span>
                          </p>
                          <div className="mt-2">
                            <ProgressBar
                              size="sm"
                              value={funding ? progressPct(db, project) : (done / project.milestones.length) * 100}
                              tone={funding ? 'primary' : 'olive'}
                            />
                            <p className="mt-1 text-xs text-ink-muted">
                              {funding
                                ? t('card.funded', { pct: pct(progressPct(db, project)) })
                                : t('citizen.milestonesDone', { done, total: project.milestones.length })}
                            </p>
                          </div>
                          {myPayout && (
                            <p className="mt-1 text-sm font-bold text-wheat-dark">
                              {t('citizen.gainReceived', { amount: money(myPayout.gain) })} (+{money(myPayout.capital)})
                            </p>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <CardTitle icon={<Newspaper size={18} />}>{t('citizen.feed')}</CardTitle>
            <UpdateFeed updates={feed} showProject limit={8} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardTitle icon={<CalendarCheck size={18} />}>{t('citizen.visits')}</CardTitle>
            {visits.length === 0 ? (
              <p className="text-sm text-ink-muted">{t('citizen.noVisits')}</p>
            ) : (
              <ul className="space-y-3">
                {visits.map((v) => {
                  const p = getProject(db, v.projectId);
                  return (
                    <li key={v.id} className="rounded-xl bg-cream p-3">
                      <div className="flex items-start justify-between gap-2">
                        <Link to={`/projects/${v.projectId}`} className="text-sm font-semibold hover:text-primary">
                          {p ? tr(p.title) : ''}
                        </Link>
                        <VisitBadge status={v.status} />
                      </div>
                      <p className="mt-1 text-xs text-ink-muted">{date(v.wishedDate)}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <CardTitle icon={<History size={18} />}>{t('citizen.history')}</CardTitle>
            <ul className="space-y-2">
              {txs.slice(0, 10).map((tx) => {
                const p = tx.projectId ? getProject(db, tx.projectId) : undefined;
                const positive = tx.amount > 0;
                return (
                  <li key={tx.id} className="flex items-center gap-3 text-sm">
                    <span className={`rounded-full p-1.5 ${positive ? 'bg-primary-50 text-primary' : 'bg-wheat-50 text-wheat-dark'}`}>
                      {positive ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{t(`txType.${tx.type}`)}</span>
                      <span className="block truncate text-xs text-ink-muted">
                        {date(tx.date)}
                        {p ? ` · ${tr(p.title)}` : ''}
                      </span>
                    </span>
                    <b className={`whitespace-nowrap ${positive ? 'text-primary' : 'text-ink'}`}>
                      {positive ? '+' : ''}
                      {money(tx.amount)}
                    </b>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>

      <Modal open={topupOpen} onClose={() => setTopupOpen(false)} title={t('citizen.topupTitle')}>
        <div className="grid grid-cols-2 gap-3">
          {[500, 1000, 2000, 5000].map((v) => (
            <button key={v} className="btn-secondary py-4 text-lg" onClick={() => doTopup(v)}>
              +{money(v)}
            </button>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-ink-muted">{t('invest.simulated')}</p>
      </Modal>
    </div>
  );
}

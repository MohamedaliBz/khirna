import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, FileSignature, Lock, PartyPopper, ShieldAlert, Wallet } from 'lucide-react';
import { useI18n } from '../i18n';
import { useStore } from '../store/useStore';
import { getProject, getUser, remaining, scenarioGain, userWallet, useCurrentUser } from '../store/selectors';
import { invest, topUp } from '../services/investments';
import { useResultToast } from '../components/hooks';
import { Img } from '../components/visuals';
import { Card, CardTitle, EmptyState } from '../components/ui';

function Confetti() {
  const colors = ['#1F5D3A', '#D4A537', '#6B8E23', '#E9C66B', '#2E7A4F'];
  return (
    <div className="pointer-events-none fixed inset-0 z-[1500] overflow-hidden" aria-hidden>
      {Array.from({ length: 60 }).map((_, i) => (
        <span
          key={i}
          className="absolute top-0 block h-3 w-2 animate-confetti rounded-sm"
          style={{ left: `${(i * 37) % 100}%`, background: colors[i % colors.length], animationDelay: `${(i % 12) * 0.12}s` }}
        />
      ))}
    </div>
  );
}

export default function Invest() {
  const { id } = useParams();
  const { t, tr, lang, money, pct } = useI18n();
  const db = useStore();
  const user = useCurrentUser();
  const showResult = useResultToast();
  const project = getProject(db, id);
  const rest = project ? remaining(db, project) : 0;
  const min = project ? Math.min(project.minInvestment, rest) : 0;
  const [amount, setAmount] = useState(() => Math.max(min, Math.min(500, rest)));
  const [accepted, setAccepted] = useState(false);
  const [success, setSuccess] = useState<number | null>(null);
  const Back = lang === 'ar' ? ArrowRight : ArrowLeft;

  const scenarios = useMemo(() => {
    if (!project) return [];
    return (['pessimistic', 'realistic', 'optimistic'] as const).map((k) => {
      const revenue = project.forecast[k];
      const gain = scenarioGain(project, amount, revenue);
      return { k, revenue, gain, total: amount + gain };
    });
  }, [project, amount]);

  if (!project) return <div className="container-app py-16"><EmptyState text={t('project.notFound')} /></div>;

  const farmer = getUser(db, project.farmerId);
  const balance = userWallet(db, user?.id);

  if (success !== null) {
    return (
      <div className="container-app flex flex-col items-center py-16 text-center">
        <Confetti />
        <div className="mb-6 rounded-full bg-primary p-6 text-white shadow-xl animate-pop">
          <PartyPopper size={56} />
        </div>
        <h1 className="mb-3 text-3xl font-extrabold">{t('invest.successTitle')}</h1>
        <p className="max-w-lg text-ink-soft">{t('invest.successText', { amount: money(success), project: tr(project.title) })}</p>
        <div className="mt-4 flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-sm font-semibold text-primary">
          <Lock size={16} /> {t('project.escrow')} · {money(success)}
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/me" className="btn-primary px-6 py-3">
            {t('invest.toDashboard')}
          </Link>
          <Link to={`/projects/${project.id}`} className="btn-secondary px-6 py-3">
            {t('invest.toProject')}
          </Link>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'citizen') {
    return (
      <div className="container-app py-16">
        <EmptyState text={t('invest.errRole')} action={<Link to="/login" className="btn-primary btn-sm">{t('common.goLogin')}</Link>} />
      </div>
    );
  }
  if (project.status !== 'funding' || rest <= 0) {
    return (
      <div className="container-app py-16">
        <EmptyState text={t('invest.notOpen')} action={<Link to={`/projects/${project.id}`} className="btn-primary btn-sm">{t('invest.toProject')}</Link>} />
      </div>
    );
  }

  const share = (amount / project.goal) * 100;
  const insufficient = amount > balance;
  const step = rest - min >= 1000 ? 50 : 10;
  const presaleQty = project.contractType === 'presale' && project.presaleUnitPrice ? Math.floor(amount / project.presaleUnitPrice) : 0;

  const confirm = () => {
    if (showResult(invest(project.id, amount))) setSuccess(amount);
  };

  return (
    <div className="container-app py-6">
      <Link to={`/projects/${project.id}`} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
        <Back size={16} /> {tr(project.title)}
      </Link>
      <h1 className="mb-6 text-2xl font-extrabold sm:text-3xl">{t('invest.title')}</h1>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          {/* Montant */}
          <Card>
            <div className="mb-4 flex items-center gap-3">
              <Img src={project.photos[0]} alt="" domain={project.domain} className="h-14 w-20 shrink-0 rounded-xl" />
              <div className="min-w-0">
                <div className="truncate font-bold">{tr(project.title)}</div>
                <div className="text-xs text-ink-muted">{t('project.remaining', { amount: money(rest) })}</div>
              </div>
            </div>
            <label className="label" htmlFor="amount">
              {t('invest.amount')}
            </label>
            <div className="mb-3 flex items-center gap-3">
              <input
                id="amount"
                type="number"
                className="input max-w-[180px] text-2xl font-extrabold text-primary"
                min={min}
                max={rest}
                step={step}
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Math.min(rest, Number(e.target.value) || 0)))}
              />
              <span className="text-lg font-bold text-ink-muted">{lang === 'ar' ? 'د.ت' : 'DT'}</span>
            </div>
            {rest > min && (
              <input type="range" className="w-full" min={min} max={rest} step={step} value={amount} onChange={(e) => setAmount(Number(e.target.value))} aria-label={t('invest.amount')} />
            )}
            <div className="mt-1 flex justify-between text-xs text-ink-muted">
              <span>{t('invest.min', { amount: money(min) })}</span>
              <span>{t('invest.max', { amount: money(rest) })}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {[100, 250, 500, 1000, 2000].filter((v) => v >= min && v <= rest).map((v) => (
                <button key={v} className={`chip border px-3 py-1.5 ${amount === v ? 'border-primary bg-primary text-white' : 'border-ink/15 bg-white text-ink-soft'}`} onClick={() => setAmount(v)}>
                  {money(v)}
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-primary-50 p-3">
                <div className="text-xs text-ink-muted">{t('invest.share')}</div>
                <div className="text-xl font-extrabold text-primary">{pct(share, 2)}</div>
              </div>
              <div className="rounded-2xl bg-cream p-3">
                <div className="text-xs text-ink-muted">{t('invest.balance')}</div>
                <div className={`text-xl font-extrabold ${insufficient ? 'text-red-600' : ''}`}>{money(balance)}</div>
              </div>
            </div>
            {presaleQty > 0 && project.presaleUnit && (
              <p className="mt-3 text-sm font-semibold text-olive">{t('invest.presaleQty', { qty: presaleQty, unit: tr(project.presaleUnit) })}</p>
            )}
          </Card>

          {/* Scénarios */}
          <Card>
            <CardTitle>{t('invest.scenarios')}</CardTitle>
            <div className="grid gap-3 sm:grid-cols-3">
              {scenarios.map((s) => (
                <div
                  key={s.k}
                  className={`rounded-2xl border p-4 ${s.k === 'realistic' ? 'border-primary bg-primary text-white' : 'border-ink/10 bg-white'}`}
                >
                  <div className={`text-sm font-bold ${s.k === 'realistic' ? 'text-white' : 'text-ink'}`}>{t(`invest.${s.k}`)}</div>
                  <div className={`mb-2 text-[11px] ${s.k === 'realistic' ? 'text-white/70' : 'text-ink-muted'}`}>{t('invest.revenue', { amount: money(s.revenue) })}</div>
                  <div className={`text-xs ${s.k === 'realistic' ? 'text-white/80' : 'text-ink-muted'}`}>{t('invest.gain')}</div>
                  <div className={`text-2xl font-extrabold ${s.k === 'realistic' ? 'text-wheat-light' : s.gain < 0 ? 'text-red-600' : 'text-primary'}`}>
                    {s.gain >= 0 ? '+' : ''}
                    {money(s.gain)}
                  </div>
                  <div className={`mt-1 text-xs ${s.k === 'realistic' ? 'text-white/80' : 'text-ink-muted'}`}>
                    {t('invest.getBack')} : <b>{money(s.total)}</b>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-ink-muted">{t('invest.scenarioNote', { pct: pct(project.split.investors) })}</p>
          </Card>
        </div>

        {/* Contrat */}
        <div className="lg:col-span-2">
          <Card className="lg:sticky lg:top-24">
            <CardTitle icon={<FileSignature size={18} />}>{t('invest.contractTitle')}</CardTitle>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-semibold text-ink-muted">{t('invest.contractType')}</dt>
                <dd className="font-bold">{t(`contract.${project.contractType}`)}</dd>
                <dd className="text-xs text-ink-soft">{t(`contractDesc.${project.contractType}`)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-muted">{t('invest.parties')}</dt>
                <dd>{t(project.land.owner === 'state' ? 'invest.partiesState' : 'invest.partiesValue', { farmer: farmer?.name ?? '' })}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-muted">{t('common.amount')}</dt>
                <dd className="text-lg font-extrabold text-primary">
                  {money(amount)} <span className="text-xs font-semibold text-ink-muted">({pct(share, 2)})</span>
                </dd>
              </div>
              <ul className="space-y-2 rounded-xl bg-cream p-3 text-xs text-ink-soft">
                <li className="flex gap-2">
                  <Lock size={14} className="mt-0.5 shrink-0 text-primary" /> {t('invest.escrowClause')}
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-primary" />
                  {t('invest.splitClause', {
                    farmer: pct(project.split.farmer),
                    investors: pct(project.split.investors),
                    platform: pct(project.split.platform),
                    reserve: pct(project.split.reserve),
                  })}
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-primary" /> {t('invest.durationClause', { n: project.durationMonths })}
                </li>
              </ul>
            </dl>

            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-wheat/50 bg-wheat-50 p-3 text-sm">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
              <span>
                <ShieldAlert size={14} className="me-1 inline text-wheat-dark" />
                {t('invest.risksAccept')}
              </span>
            </label>

            {insufficient && (
              <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                <span>{t('invest.insufficient')}</span>
                <button className="btn-secondary btn-sm" onClick={() => showResult(topUp(1000), t('citizen.topupDone', { amount: money(1000) }))}>
                  <Wallet size={14} /> +{money(1000)}
                </button>
              </div>
            )}

            <button className="btn-primary mt-4 w-full py-3 text-base" disabled={!accepted || insufficient || amount < min || amount > rest} onClick={confirm}>
              <CheckCircle2 size={18} /> {t('invest.confirm', { amount: money(amount) })}
            </button>
            <p className="mt-2 text-center text-[11px] text-ink-muted">{t('invest.simulated')}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

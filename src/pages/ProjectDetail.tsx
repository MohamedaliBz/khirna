import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Banknote,
  CalendarCheck,
  Droplets,
  FileText,
  Landmark,
  ListChecks,
  Lock,
  MapPin,
  Newspaper,
  PieChart,
  Ruler,
  Star,
  TrendingUp,
  Unlock,
  Users,
  Briefcase,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { useStore } from '../store/useStore';
import {
  estReturnPct,
  getEscrow,
  getOffer,
  getProject,
  getUser,
  investorsCount,
  progressPct,
  raised,
  remaining,
  stateInvestment,
  sum,
  useCurrentUser,
} from '../store/selectors';
import { requestVisit } from '../services/visits';
import { useResultToast } from '../components/hooks';
import { MapView } from '../components/MapView';
import { MilestoneTimeline } from '../components/MilestoneTimeline';
import { UpdateFeed } from '../components/UpdateFeed';
import { Avatar, DomainIcon, Img, ProgressBar, ProjectStatusBadge, RiskBanner, SplitDonut, StateLandBadge } from '../components/visuals';
import { Badge, Card, CardTitle, EmptyState, Field, Modal } from '../components/ui';

export default function ProjectDetail() {
  const { id } = useParams();
  const { t, tr, money, pct, date } = useI18n();
  const db = useStore();
  const user = useCurrentUser();
  const navigate = useNavigate();
  const showResult = useResultToast();
  const [photo, setPhoto] = useState(0);
  const [visitOpen, setVisitOpen] = useState(false);
  const [visitDate, setVisitDate] = useState(() => new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10));
  const [visitMsg, setVisitMsg] = useState('');

  const project = getProject(db, id);
  if (!project) {
    return (
      <div className="container-app py-16">
        <EmptyState text={t('project.notFound')} action={<Link to="/projects" className="btn-primary btn-sm">{t('nav.projects')}</Link>} />
      </div>
    );
  }

  const farmer = getUser(db, project.farmerId);
  const farmerProjects = db.projects.filter((p) => p.farmerId === project.farmerId && p.status !== 'submitted' && p.status !== 'rejected').length;
  const collected = raised(db, project.id);
  const progress = progressPct(db, project);
  const escrow = getEscrow(db, project);
  const stateAmount = stateInvestment(db, project.id);
  const offer = getOffer(db, project.stateOfferId);
  const updates = db.updates.filter((u) => u.projectId === project.id);
  const myStake = user ? sum(db.investments.filter((i) => i.projectId === project.id && i.investorId === user.id).map((i) => i.amount)) : 0;
  const maxBudget = Math.max(...project.budget.map((b) => b.amount));
  const isState = project.land.owner === 'state';
  const canInvest = project.status === 'funding';

  const onInvest = () => {
    if (!user) navigate(`/login?redirect=/projects/${project.id}/invest`);
    else navigate(`/projects/${project.id}/invest`);
  };
  const onVisit = () => {
    if (!user) navigate(`/login?redirect=/projects/${project.id}`);
    else setVisitOpen(true);
  };
  const submitVisit = () => {
    if (showResult(requestVisit(project.id, visitDate, visitMsg), t('project.visitSent'))) {
      setVisitOpen(false);
      setVisitMsg('');
    }
  };

  const fundingCard = (
    <Card className="lg:sticky lg:top-24">
      <div className="mb-1 text-xs font-semibold text-ink-muted">{t('project.collected')}</div>
      <div className="text-3xl font-extrabold text-primary">{money(collected)}</div>
      <div className="mb-3 text-sm text-ink-muted">
        {t('project.sought')} : <b className="text-ink">{money(project.goal)}</b>
      </div>
      <ProgressBar value={progress} />
      <div className="mt-2 flex justify-between text-sm">
        <span className="font-bold">{pct(progress)}</span>
        <span className="flex items-center gap-1 text-ink-muted">
          <Users size={14} /> {t('common.investorsN', { n: investorsCount(db, project.id) })}
        </span>
      </div>
      {canInvest && <p className="mt-1 text-xs text-ink-muted">{t('project.remaining', { amount: money(remaining(db, project)) })}</p>}

      <div className="my-4 grid grid-cols-2 gap-2 text-center text-xs">
        <div className="rounded-xl bg-cream p-2">
          <div className="text-ink-muted">{t('card.min')}</div>
          <div className="font-bold">{money(project.minInvestment)}</div>
        </div>
        <div className="rounded-xl bg-cream p-2">
          <div className="text-ink-muted">{t('project.duration')}</div>
          <div className="font-bold">{t('common.months', { n: project.durationMonths })}</div>
        </div>
        <div className="rounded-xl bg-wheat-50 p-2">
          <div className="text-ink-muted">{t('card.estReturn')}</div>
          <div className="font-bold text-wheat-dark">{pct(estReturnPct(project), 1)}</div>
        </div>
        <div className="rounded-xl bg-cream p-2">
          <div className="text-ink-muted">{t('project.contract')}</div>
          <div className="font-bold leading-tight">{t(`contract.${project.contractType}`)}</div>
        </div>
      </div>

      {project.contractType === 'presale' && project.presaleUnit && project.presaleUnitPrice && (
        <p className="-mt-2 mb-3 text-center text-xs text-ink-muted">
          {t('project.presalePrice', { price: money(project.presaleUnitPrice), unit: tr(project.presaleUnit) })}
        </p>
      )}

      {myStake > 0 && (
        <div className="mb-3 rounded-xl bg-primary-50 p-2 text-center text-sm font-semibold text-primary">{t('project.yourStake', { amount: money(myStake) })}</div>
      )}

      <div className="space-y-2">
        <button className="btn-primary w-full py-3 text-base" onClick={onInvest} disabled={!canInvest || (!!user && user.role !== 'citizen')}>
          <Banknote size={18} /> {canInvest ? t('project.invest') : t('project.closed')}
        </button>
        {user && user.role !== 'citizen' && canInvest && <p className="text-center text-xs text-ink-muted">{t('project.citizenOnly')}</p>}
        <button className="btn-secondary w-full" onClick={onVisit}>
          <CalendarCheck size={18} /> {t('project.requestVisit')}
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-primary/10 bg-primary-50/50 p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-primary">
          <Lock size={15} /> {t('project.escrow')}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="flex items-center gap-1 text-ink-muted">
              <Lock size={12} /> {t('project.escrowHeld')}
            </div>
            <div className="font-bold">{money(escrow.held)}</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-ink-muted">
              <Unlock size={12} /> {t('project.escrowReleased')}
            </div>
            <div className="font-bold">{money(escrow.released)}</div>
          </div>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">{t('project.escrowText')}</p>
      </div>
    </Card>
  );

  return (
    <div className="container-app py-6">
      {/* En-tête + galerie */}
      <div className="mb-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge tone="green" icon={<DomainIcon domain={project.domain} size={13} />}>
            {t(`domains.${project.domain}`)}
          </Badge>
          <ProjectStatusBadge status={project.status} />
          {isState && <StateLandBadge until={project.land.availableUntil} />}
          <Badge tone={project.riskLevel === 'high' ? 'red' : project.riskLevel === 'medium' ? 'wheat' : 'gray'} icon={<AlertTriangle size={13} />}>
            {t(`risk.${project.riskLevel}`)}
          </Badge>
        </div>
        <h1 className="text-2xl font-extrabold sm:text-4xl">{tr(project.title)}</h1>
        <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
          <MapPin size={15} /> {project.land.place} · {t(`gov.${project.land.governorate}`)}
        </p>
        <p className="mt-2 max-w-3xl text-ink-soft">{tr(project.summary)}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <Img src={project.photos[photo]} alt={tr(project.title)} domain={project.domain} className="aspect-[16/9] w-full rounded-3xl" />
            {project.photos.length > 1 && (
              <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
                {project.photos.map((src, i) => (
                  <button key={src + i} onClick={() => setPhoto(i)} className={`shrink-0 overflow-hidden rounded-xl ring-2 ${i === photo ? 'ring-primary' : 'ring-transparent opacity-70'}`}>
                    <Img src={src.replace('w=1200', 'w=300')} alt="" className="h-16 w-24" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:hidden">{fundingCard}</div>

          {/* Agriculteur */}
          {farmer && (
            <Card>
              <CardTitle>{t('project.farmer')}</CardTitle>
              <div className="flex items-start gap-4">
                <Avatar src={farmer.avatar} name={farmer.name} size={64} />
                <div className="min-w-0">
                  <div className="text-lg font-bold">{farmer.name}</div>
                  <div className="text-sm font-semibold text-primary">{t(`roles.${farmer.role}`)}</div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
                    {farmer.experienceYears !== undefined && <span>{t('common.experienceYears', { n: farmer.experienceYears })}</span>}
                    {farmer.rating !== undefined && (
                      <span className="flex items-center gap-1">
                        <Star size={14} className="fill-wheat text-wheat" /> {t('project.rating', { n: farmer.rating })}
                      </span>
                    )}
                    <span>{t('project.projectsN', { n: farmerProjects })}</span>
                  </div>
                  {farmer.bio && <p className="mt-2 text-sm text-ink-soft">{tr(farmer.bio)}</p>}
                </div>
              </div>
            </Card>
          )}

          {/* Description */}
          <Card>
            <CardTitle icon={<FileText size={18} />}>{t('project.about')}</CardTitle>
            <p className="whitespace-pre-line leading-relaxed text-ink-soft">{tr(project.description)}</p>
          </Card>

          {/* Parcelle */}
          <Card>
            <CardTitle icon={<MapPin size={18} />}>{t('project.parcel')}</CardTitle>
            <MapView markers={[{ id: project.id, position: project.land.coords, label: project.land.place, tone: isState ? 'wheat' : 'green' }]} zoom={10} height="h-64" />
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div className="flex items-center gap-2">
                <Ruler size={16} className="text-primary" />
                <span>
                  <span className="block text-xs text-ink-muted">{t('project.area')}</span>
                  <b>{t('common.ha', { n: project.land.areaHa })}</b>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Droplets size={16} className="text-primary" />
                <span>
                  <span className="block text-xs text-ink-muted">{t('project.water')}</span>
                  <b>{t(`water.${project.land.water}`)}</b>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-primary" />
                <span>
                  <span className="block text-xs text-ink-muted">{t('project.jobs')}</span>
                  <b>{project.jobs}</b>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Landmark size={16} className="text-primary" />
                <span>
                  <span className="block text-xs text-ink-muted">{t('project.parcel')}</span>
                  <b>{isState ? t('common.stateOwned') : t('project.ownLand')}</b>
                </span>
              </div>
            </div>
          </Card>

          {/* Partenaire État */}
          {isState && (
            <div className="card overflow-hidden border-wheat/40">
              <div className="flex items-center gap-3 bg-wheat px-5 py-3 text-ink">
                <Landmark size={22} />
                <h2 className="text-lg font-bold">{t('project.stateTitle')}</h2>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-3">
                <p className="text-sm text-ink-soft sm:col-span-2">{t('project.stateText')}</p>
                <div className="rounded-2xl bg-wheat-50 p-4 text-center">
                  <div className="text-xs font-semibold text-ink-muted">{t('project.coInvest')}</div>
                  <div className="text-2xl font-extrabold text-wheat-dark">{money(stateAmount || offer?.coInvestment || 0)}</div>
                  <div className="text-xs text-ink-muted">{t('project.coInvestShare', { pct: pct(((stateAmount || offer?.coInvestment || 0) / project.goal) * 100) })}</div>
                </div>
                {project.land.availableUntil && (
                  <div className="sm:col-span-3">
                    <StateLandBadge until={project.land.availableUntil} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Budget */}
          <Card>
            <CardTitle icon={<Banknote size={18} />}>{t('project.budget')}</CardTitle>
            <ul className="space-y-3">
              {project.budget.map((b) => (
                <li key={b.id}>
                  <div className="mb-1 flex justify-between gap-3 text-sm">
                    <span className="text-ink-soft">{tr(b.label)}</span>
                    <b className="whitespace-nowrap">{money(b.amount)}</b>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink/5">
                    <div className="h-full rounded-full bg-olive" style={{ width: `${(b.amount / maxBudget) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-ink/10 pt-3 font-bold">
              <span>{t('common.total')}</span>
              <span className="text-primary">{money(project.goal)}</span>
            </div>
          </Card>

          {/* Étapes */}
          <Card>
            <CardTitle icon={<ListChecks size={18} />}>{t('project.milestones')}</CardTitle>
            <MilestoneTimeline milestones={project.milestones} updates={updates} />
          </Card>

          {/* Clé de répartition */}
          <Card>
            <CardTitle icon={<PieChart size={18} />}>{t('project.splitTitle')}</CardTitle>
            <SplitDonut split={project.split} />
            <p className="mt-4 text-xs text-ink-muted">{t('project.splitNote')}</p>
          </Card>

          {/* Risques */}
          <Card>
            <CardTitle icon={<AlertTriangle size={18} />}>{t('project.risks')}</CardTitle>
            <RiskBanner />
            <ul className="mt-3 space-y-2 text-sm">
              {project.risks.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-ink-soft">
                  <TrendingUp size={15} className="mt-0.5 shrink-0 rotate-180 text-wheat-dark" /> {tr(r)}
                </li>
              ))}
            </ul>
          </Card>

          {/* Actualités */}
          <Card>
            <CardTitle icon={<Newspaper size={18} />}>{t('project.news')}</CardTitle>
            <UpdateFeed updates={updates} />
          </Card>
        </div>

        <aside className="hidden lg:block">{fundingCard}</aside>
      </div>

      <Modal open={visitOpen} onClose={() => setVisitOpen(false)} title={t('project.visitTitle')}>
        <div className="space-y-3">
          <p className="text-sm font-semibold text-primary">{tr(project.title)}</p>
          <Field label={t('project.visitDate')}>
            <input type="date" className="input" value={visitDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setVisitDate(e.target.value)} />
          </Field>
          <Field label={`${t('project.visitMessage')} (${t('common.optional')})`}>
            <textarea className="input min-h-[90px]" value={visitMsg} placeholder={t('project.visitPlaceholder')} onChange={(e) => setVisitMsg(e.target.value)} />
          </Field>
          <p className="text-xs text-ink-muted">{date(new Date(visitDate || Date.now()).toISOString())}</p>
          <button className="btn-primary w-full" onClick={submitVisit} disabled={!visitDate}>
            <CalendarCheck size={18} /> {t('common.submit')}
          </button>
        </div>
      </Modal>
    </div>
  );
}

import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, Briefcase, Building2, Check, Coins, Droplets, HandCoins, Landmark, MapPin, Plus, Ruler, Timer, Users, X } from 'lucide-react';
import { DOMAINS, type Domain, type Governorate, type LatLng, type WaterAccess } from '../types';
import { useI18n } from '../i18n';
import { useStore } from '../store/useStore';
import { applicationScore, getProject, getUser, projectInvestments, sum } from '../store/selectors';
import { publishOffer, refuseApplication, retainApplication, setCoInvestment } from '../services/lands';
import { useResultToast } from '../components/hooks';
import { MapView } from '../components/MapView';
import { ApplicationBadge, Avatar, DomainIcon, Img, OfferStatusBadge, ProgressBar, StatCard } from '../components/visuals';
import { Badge, Card, CardTitle, EmptyState, Field, Modal, PageHeader } from '../components/ui';
import { GOV_COORDS, GOVERNORATES } from '../lib/geo';

const WATER: WaterAccess[] = ['well', 'irrigation', 'rain', 'none'];

export default function StateSpace() {
  const { t, tr, money, date } = useI18n();
  const db = useStore();
  const showResult = useResultToast();
  const detailRef = useRef<HTMLDivElement>(null);

  const offers = [...db.offers].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const defaultSel = db.offers.find((o) => db.applications.some((a) => a.offerId === o.id && a.status === 'sent'))?.id ?? offers[0]?.id ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(defaultSel);
  const selected = db.offers.find((o) => o.id === selectedId);
  const [coInvest, setCoInvest] = useState<number>(0);

  // Publication
  const [pubOpen, setPubOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    governorate: 'kef' as Governorate,
    areaHa: 10,
    vocation: 'fodder' as Domain,
    water: 'irrigation' as WaterAccess,
    durationYears: 5,
    jobsEstimate: 3,
  });
  const [coords, setCoords] = useState<LatLng>(GOV_COORDS.kef);

  // Impact
  const usedOffers = db.offers.filter((o) => o.status === 'in_use' || o.status === 'assigned');
  const stateProjects = db.projects.filter((p) => p.land.owner === 'state' && p.status !== 'rejected');
  const hectares = sum(usedOffers.map((o) => o.areaHa));
  const jobs = sum(stateProjects.map((p) => p.jobs)) + sum(usedOffers.filter((o) => !o.projectId).map((o) => o.jobsEstimate));
  const publicFunds = sum(db.offers.map((o) => o.coInvestment ?? 0));
  const citizenFunds = sum(stateProjects.flatMap((p) => projectInvestments(db, p.id).filter((i) => i.investorType === 'citizen').map((i) => i.amount)));

  const select = (id: string) => {
    setSelectedId(id);
    const o = db.offers.find((x) => x.id === id);
    const accepted = db.applications.find((a) => a.offerId === id && a.status === 'accepted');
    setCoInvest(o?.coInvestment ?? Math.round(((accepted?.budgetNeeded ?? 30000) * 0.4) / 500) * 500);
    if (window.innerWidth < 1024) window.setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const submitOffer = () => {
    const res = publishOffer({ ...form, coords });
    if (showResult(res, t('state.published'))) {
      setPubOpen(false);
      setForm({ ...form, name: '', description: '' });
    }
  };

  const retain = (appId: string) => {
    const app = db.applications.find((a) => a.id === appId);
    if (showResult(retainApplication(appId), t('state.retained'))) {
      setCoInvest(Math.round(((app?.budgetNeeded ?? 30000) * 0.4) / 500) * 500);
    }
  };

  const apps = selected
    ? db.applications
        .filter((a) => a.offerId === selected.id)
        .map((a) => ({ app: a, ...applicationScore(db, a, selected) }))
        .sort((a, b) => b.score - a.score)
    : [];
  const assignedFarmer = selected?.assignedFarmerId ? getUser(db, selected.assignedFarmerId) : undefined;
  const linkedProject = getProject(db, selected?.projectId);

  return (
    <div className="container-app py-8">
      <PageHeader
        title={t('state.title')}
        subtitle={t('state.subtitle')}
        icon={<Building2 size={24} />}
        actions={
          <button className="btn-wheat" onClick={() => setPubOpen(true)}>
            <Plus size={18} /> {t('state.publish')}
          </button>
        }
      />

      {/* Impact */}
      <h2 className="mb-3 text-lg font-bold">{t('state.impact')}</h2>
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard icon={<Ruler size={20} />} label={t('state.impactHectares')} value={`${hectares} ha`} tone="wheat" />
        <StatCard icon={<Briefcase size={20} />} label={t('state.impactJobs')} value={String(jobs)} tone="olive" />
        <StatCard icon={<Landmark size={20} />} label={t('state.impactPublic')} value={money(publicFunds)} />
        <StatCard icon={<Users size={20} />} label={t('state.impactCitizens')} value={money(citizenFunds)} tone="blue" />
        <StatCard icon={<MapPin size={20} />} label={t('state.impactParcels')} value={String(db.offers.length)} tone="gray" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <MapView
            height="h-60"
            markers={db.offers.map((o) => ({
              id: o.id,
              position: o.coords,
              label: tr(o.name),
              tone: o.status === 'open' || o.status === 'reviewing' ? 'wheat' : 'green',
              active: o.id === selectedId,
              onClick: () => select(o.id),
            }))}
          />
          <h2 className="text-lg font-bold">{t('state.parcels')}</h2>
          <ul className="space-y-3">
            {offers.map((o) => {
              const pending = db.applications.filter((a) => a.offerId === o.id && a.status === 'sent').length;
              return (
                <li key={o.id}>
                  <button
                    onClick={() => select(o.id)}
                    className={`card flex w-full gap-3 p-3 text-start transition hover:shadow-lg ${o.id === selectedId ? 'ring-2 ring-primary' : ''}`}
                  >
                    <Img src={o.photo.replace('w=1200', 'w=300')} alt="" className="h-20 w-20 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{tr(o.name)}</p>
                      <p className="text-xs text-ink-muted">
                        {t(`gov.${o.governorate}`)} · {t('common.ha', { n: o.areaHa })} · {t(`domains.${o.vocation}`)}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <OfferStatusBadge status={o.status} />
                        {pending > 0 && <Badge tone="blue">{t('state.applications', { n: pending })}</Badge>}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="lg:col-span-3" ref={detailRef}>
          {!selected ? (
            <EmptyState text={t('state.selectParcel')} />
          ) : (
            <div className="space-y-4 lg:sticky lg:top-24">
              <Card>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Img src={selected.photo} alt={tr(selected.name)} className="h-36 w-full shrink-0 rounded-xl sm:w-44" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h2 className="text-xl font-bold">{tr(selected.name)}</h2>
                      <OfferStatusBadge status={selected.status} />
                    </div>
                    <p className="mt-1 text-sm text-ink-soft">{tr(selected.description)}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge tone="green" icon={<DomainIcon domain={selected.vocation} size={12} />}>
                        {t(`domains.${selected.vocation}`)}
                      </Badge>
                      <Badge icon={<MapPin size={12} />}>{t(`gov.${selected.governorate}`)}</Badge>
                      <Badge icon={<Ruler size={12} />}>{t('common.ha', { n: selected.areaHa })}</Badge>
                      <Badge icon={<Droplets size={12} />}>{t(`water.${selected.water}`)}</Badge>
                      <Badge icon={<Timer size={12} />}>{t('lands.availability', { n: selected.durationYears })}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-ink-muted">
                      {date(selected.publishedAt)} · {t('state.ownerNote')}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Attribution + co-investissement */}
              {assignedFarmer && (
                <Card className="border-wheat/40">
                  <CardTitle icon={<HandCoins size={18} />}>{t('state.coInvestTitle')}</CardTitle>
                  <div className="mb-4 flex items-center gap-3 rounded-xl bg-primary-50 p-3">
                    <Avatar src={assignedFarmer.avatar} name={assignedFarmer.name} size={40} />
                    <div className="text-sm">
                      <p className="font-bold">{t('state.assignedTo', { name: assignedFarmer.name })}</p>
                      <p className="text-xs text-ink-muted">{t('common.experienceYears', { n: assignedFarmer.experienceYears ?? 0 })}</p>
                    </div>
                  </div>
                  <p className="mb-2 text-xs text-ink-muted">{t('state.coInvestHelp')}</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="number"
                      min={0}
                      step={500}
                      className="input sm:max-w-[200px]"
                      value={coInvest || ''}
                      onChange={(e) => setCoInvest(Number(e.target.value))}
                      aria-label={t('state.coInvestAmount')}
                    />
                    <button
                      className="btn-wheat"
                      disabled={coInvest <= 0}
                      onClick={() => showResult(setCoInvestment(selected.id, coInvest), t('state.coInvestSet', { amount: money(coInvest) }))}
                    >
                      <Banknote size={16} /> {t('state.setCoInvest')}
                    </button>
                  </div>
                  {selected.coInvestment ? (
                    <p className="mt-3 flex items-center gap-2 text-sm font-bold text-wheat-dark">
                      <Coins size={16} /> {t('lands.coInvest', { amount: money(selected.coInvestment) })}
                    </p>
                  ) : null}
                  <div className="mt-3 border-t border-ink/5 pt-3 text-sm">
                    <span className="text-ink-muted">{t('state.linkedProject')} : </span>
                    {linkedProject ? (
                      <Link to={`/projects/${linkedProject.id}`} className="font-semibold text-primary hover:underline">
                        {tr(linkedProject.title)}
                      </Link>
                    ) : (
                      <span className="italic text-ink-muted">{t('state.waitingProject')}</span>
                    )}
                  </div>
                </Card>
              )}

              {/* Candidatures */}
              <Card>
                <CardTitle icon={<Users size={18} />}>{t('state.applications', { n: apps.length })}</CardTitle>
                {apps.length === 0 ? (
                  <p className="text-sm text-ink-muted">{t('state.noApplications')}</p>
                ) : (
                  <ul className="space-y-3">
                    {apps.map(({ app, score, distance, proximity, experience }) => {
                      const farmer = getUser(db, app.farmerId);
                      return (
                        <li key={app.id} className="rounded-2xl border border-ink/10 p-3">
                          <div className="flex items-start gap-3">
                            <Avatar src={farmer?.avatar} name={farmer?.name ?? '?'} size={44} />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <p className="font-bold">{farmer?.name}</p>
                                  <p className="text-xs text-ink-muted">
                                    {farmer ? t(`gov.${farmer.governorate}`) : ''} · {t('common.km', { n: distance })} · {t('common.experienceYears', { n: app.experienceYears })}
                                  </p>
                                </div>
                                <ApplicationBadge status={app.status} />
                              </div>
                              <p className="mt-2 text-sm text-ink-soft">
                                <b>{t('state.plan')} :</b> {app.plan}
                              </p>
                              <p className="text-xs text-ink-muted">
                                {t(`domains.${app.domain}`)} · {t('state.need')} : {money(app.budgetNeeded)}
                              </p>
                              <div className="mt-2">
                                <div className="mb-1 flex justify-between text-xs">
                                  <span className="font-semibold text-ink-soft" title={t('state.scoreHelp')}>
                                    {t('state.score')} ({t('state.scoreHelp')})
                                  </span>
                                  <b className="text-primary">{score}/100</b>
                                </div>
                                <ProgressBar value={score} size="sm" tone={score >= 60 ? 'primary' : 'wheat'} />
                                <p className="mt-0.5 text-[11px] text-ink-muted">
                                  {proximity} + {experience}
                                </p>
                              </div>
                              {app.status === 'sent' && !selected.assignedFarmerId && (
                                <div className="mt-3 flex gap-2">
                                  <button className="btn-primary btn-sm flex-1" onClick={() => retain(app.id)}>
                                    <Check size={14} /> {t('state.retain')}
                                  </button>
                                  <button className="btn-danger btn-sm flex-1" onClick={() => showResult(refuseApplication(app.id), t('state.refused'))}>
                                    <X size={14} /> {t('state.refuse')}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Modale : publier une parcelle */}
      <Modal open={pubOpen} onClose={() => setPubOpen(false)} title={t('state.publishTitle')} wide>
        <div className="space-y-3">
          <Field label={`${t('state.name')} *`}>
            <input className="input" value={form.name} placeholder={t('state.namePlaceholder')} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label={t('state.description')}>
            <textarea className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label={t('state.governorate')}>
              <select
                className="input"
                value={form.governorate}
                onChange={(e) => {
                  const g = e.target.value as Governorate;
                  setForm({ ...form, governorate: g });
                  setCoords(GOV_COORDS[g]);
                }}
              >
                {GOVERNORATES.map((g) => (
                  <option key={g} value={g}>
                    {t(`gov.${g}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('state.area')}>
              <input type="number" min={1} className="input" value={form.areaHa} onChange={(e) => setForm({ ...form, areaHa: Number(e.target.value) })} />
            </Field>
            <Field label={t('state.vocation')}>
              <select className="input" value={form.vocation} onChange={(e) => setForm({ ...form, vocation: e.target.value as Domain })}>
                {DOMAINS.map((d) => (
                  <option key={d} value={d}>
                    {t(`domains.${d}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('state.water')}>
              <select className="input" value={form.water} onChange={(e) => setForm({ ...form, water: e.target.value as WaterAccess })}>
                {WATER.map((w) => (
                  <option key={w} value={w}>
                    {t(`water.${w}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('state.duration')}>
              <input type="number" min={1} className="input" value={form.durationYears} onChange={(e) => setForm({ ...form, durationYears: Number(e.target.value) })} />
            </Field>
            <Field label={t('state.jobs')}>
              <input type="number" min={0} className="input" value={form.jobsEstimate} onChange={(e) => setForm({ ...form, jobsEstimate: Number(e.target.value) })} />
            </Field>
          </div>
          <p className="label">{t('state.position')}</p>
          <MapView center={GOV_COORDS[form.governorate]} zoom={9} height="h-56" onPick={setCoords} picked={coords} />
          <button className="btn-wheat w-full" onClick={submitOffer} disabled={!form.name.trim()}>
            <Plus size={18} /> {t('state.publish')}
          </button>
        </div>
      </Modal>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckCircle2, ClipboardList, Droplets, Landmark, MapPin, Ruler, Send, Timer } from 'lucide-react';
import { DOMAINS, type Domain, type StateLandOffer } from '../types';
import { useI18n } from '../i18n';
import { useStore } from '../store/useStore';
import { getOffer, getProject, useCurrentUser } from '../store/selectors';
import { applyToOffer } from '../services/lands';
import { useResultToast } from '../components/hooks';
import { MapView } from '../components/MapView';
import { ApplicationBadge, DomainIcon, Img, OfferStatusBadge } from '../components/visuals';
import { Badge, Card, CardTitle, EmptyState, Field, Modal, PageHeader } from '../components/ui';
import { distanceKm } from '../lib/geo';

export default function StateLands() {
  const { t, tr, money, date } = useI18n();
  const db = useStore();
  const user = useCurrentUser()!;
  const showResult = useResultToast();
  const [selected, setSelected] = useState<string | null>(null);
  const [applyFor, setApplyFor] = useState<StateLandOffer | null>(null);
  const [domain, setDomain] = useState<Domain>('sheep');
  const [experience, setExperience] = useState(user.experienceYears ?? 1);
  const [plan, setPlan] = useState('');
  const [need, setNeed] = useState(30000);

  const myApps = db.applications.filter((a) => a.farmerId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const dist = (o: StateLandOffer) => (user.location ? Math.round(distanceKm(user.location, o.coords)) : 0);
  const open = db.offers.filter((o) => o.status === 'open' || o.status === 'reviewing').sort((a, b) => dist(a) - dist(b));

  const openApply = (o: StateLandOffer) => {
    setApplyFor(o);
    setDomain(o.vocation);
    setExperience(user.experienceYears ?? 1);
    setPlan('');
    setNeed(30000);
  };
  const submit = () => {
    if (!applyFor) return;
    if (showResult(applyToOffer({ offerId: applyFor.id, domain, experienceYears: experience, plan, budgetNeeded: need }), t('lands.applied'))) setApplyFor(null);
  };

  return (
    <div className="container-app py-8">
      <PageHeader title={t('lands.title')} subtitle={t('lands.subtitle')} icon={<Landmark size={24} />} />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <MapView
            height="h-64 sm:h-80"
            markers={db.offers.map((o) => ({
              id: o.id,
              position: o.coords,
              label: `${tr(o.name)} · ${t(`offerStatus.${o.status}`)}`,
              tone: o.status === 'open' || o.status === 'reviewing' ? 'green' : 'gray',
              active: selected === o.id,
              onClick: () => setSelected(o.id),
            }))}
          />
          <h2 className="text-lg font-bold">{t('lands.open')}</h2>
          {open.length === 0 && <EmptyState text={t('lands.noOffers')} />}
          {open.map((o) => {
            const applied = myApps.some((a) => a.offerId === o.id);
            return (
              <div key={o.id} className={`card overflow-hidden transition ${selected === o.id ? 'ring-2 ring-primary' : ''}`} onMouseEnter={() => setSelected(o.id)}>
                <div className="flex flex-col sm:flex-row">
                  <Img src={o.photo} alt={tr(o.name)} className="h-40 w-full shrink-0 sm:h-auto sm:w-48" />
                  <div className="flex-1 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold">{tr(o.name)}</h3>
                        <p className="flex items-center gap-1 text-xs text-ink-muted">
                          <MapPin size={12} /> {t(`gov.${o.governorate}`)} · {t('lands.distance', { n: dist(o) })}
                        </p>
                      </div>
                      <OfferStatusBadge status={o.status} />
                    </div>
                    <p className="mt-2 text-sm text-ink-soft">{tr(o.description)}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone="green" icon={<DomainIcon domain={o.vocation} size={12} />}>
                        {t('lands.vocation')} : {t(`domains.${o.vocation}`)}
                      </Badge>
                      <Badge icon={<Ruler size={12} />}>{t('common.ha', { n: o.areaHa })}</Badge>
                      <Badge icon={<Droplets size={12} />}>{t(`water.${o.water}`)}</Badge>
                      <Badge icon={<Timer size={12} />}>{t('lands.availability', { n: o.durationYears })}</Badge>
                      <Badge icon={<Briefcase size={12} />}>{t('common.jobsN', { n: o.jobsEstimate })}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-ink-muted">{t('lands.ownerNote')}</span>
                      {applied ? (
                        <span className="chip bg-primary-50 text-primary">
                          <CheckCircle2 size={14} /> {t('lands.alreadyApplied')}
                        </span>
                      ) : (
                        <button className="btn-primary btn-sm" onClick={() => openApply(o)}>
                          <Send size={14} /> {t('lands.apply')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-2">
          <Card className="lg:sticky lg:top-24">
            <CardTitle icon={<ClipboardList size={18} />}>{t('lands.myApplications')}</CardTitle>
            {myApps.length === 0 ? (
              <p className="text-sm text-ink-muted">{t('lands.noApplications')}</p>
            ) : (
              <ul className="space-y-3">
                {myApps.map((a) => {
                  const o = getOffer(db, a.offerId);
                  if (!o) return null;
                  const project = getProject(db, o.projectId);
                  const mine = o.assignedFarmerId === user.id;
                  return (
                    <li key={a.id} className="rounded-xl bg-cream p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{tr(o.name)}</p>
                          <p className="text-xs text-ink-muted">
                            {t(`gov.${o.governorate}`)} · {t('common.ha', { n: o.areaHa })} · {date(a.createdAt)}
                          </p>
                        </div>
                        <ApplicationBadge status={a.status} />
                      </div>
                      {a.status === 'accepted' && mine && (
                        <div className="mt-2 space-y-2">
                          <p className="text-xs font-semibold text-wheat-dark">
                            {o.coInvestment ? t('lands.coInvest', { amount: money(o.coInvestment) }) : t('lands.coInvestPending')}
                          </p>
                          {project ? (
                            <Link to={`/projects/${project.id}`} className="btn-secondary btn-sm w-full">
                              {t('lands.projectLinked')} · {tr(project.title)}
                            </Link>
                          ) : (
                            <Link to={`/farmer/new?offer=${o.id}`} className="btn-primary btn-sm w-full">
                              {t('lands.createProject')}
                            </Link>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Modal open={!!applyFor} onClose={() => setApplyFor(null)} title={applyFor ? t('lands.applyTitle', { land: tr(applyFor.name) }) : ''}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('lands.domain')}>
              <select className="input" value={domain} onChange={(e) => setDomain(e.target.value as Domain)}>
                {DOMAINS.map((d) => (
                  <option key={d} value={d}>
                    {t(`domains.${d}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('lands.experience')}>
              <input type="number" min={0} className="input" value={experience} onChange={(e) => setExperience(Number(e.target.value))} />
            </Field>
          </div>
          <Field label={t('lands.plan')}>
            <textarea className="input min-h-[100px]" value={plan} placeholder={t('lands.planPlaceholder')} onChange={(e) => setPlan(e.target.value)} />
          </Field>
          <Field label={t('lands.budgetNeeded')}>
            <input type="number" min={0} step={1000} className="input" value={need} onChange={(e) => setNeed(Number(e.target.value))} />
          </Field>
          <button className="btn-primary w-full" onClick={submit} disabled={!plan.trim()}>
            <Send size={18} /> {t('lands.apply')}
          </button>
        </div>
      </Modal>
    </div>
  );
}

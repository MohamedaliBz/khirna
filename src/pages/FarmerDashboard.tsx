import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Camera,
  Check,
  Clock,
  Coins,
  Landmark,
  Lock,
  Megaphone,
  Plus,
  RefreshCcw,
  Sprout,
  Tractor,
  Unlock,
  Users,
  Wallet,
  Wheat,
  X,
} from 'lucide-react';
import type { Project, UpdateKind } from '../types';
import { useI18n } from '../i18n';
import { useStore } from '../store/useStore';
import { getEscrow, getProject, getUser, investorsCount, progressPct, raised, sum, userWallet, useCurrentUser } from '../store/selectors';
import { publishUpdate } from '../services/milestones';
import { setVisitStatus } from '../services/visits';
import { declareHarvest } from '../services/harvest';
import { resubmitProject } from '../services/projects';
import { useResultToast } from '../components/hooks';
import { PhotoPicker } from '../components/PhotoPicker';
import { Img, ProgressBar, ProjectStatusBadge, StatCard, StateLandBadge, VisitBadge } from '../components/visuals';
import { Card, CardTitle, EmptyState, Field, Modal, PageHeader } from '../components/ui';
import { DOMAIN_PHOTOS, PHOTOS } from '../lib/photos';
import { nowIso } from '../lib/id';

const PROOF_STATUSES: Project['status'][] = ['funded', 'in_progress'];
const NEWS_STATUSES: Project['status'][] = ['funding', 'funded', 'in_progress', 'harvest'];
const nextMilestones = (p: Project) => p.milestones.filter((m) => m.status === 'upcoming' || m.status === 'rejected');

export default function FarmerDashboard() {
  const { t, tr, money, pct, date, dateTime } = useI18n();
  const db = useStore();
  const user = useCurrentUser()!;
  const showResult = useResultToast();

  const projects = db.projects.filter((p) => p.farmerId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const projectIds = new Set(projects.map((p) => p.id));
  const visits = db.visits.filter((v) => projectIds.has(v.projectId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const received = sum(db.transactions.filter((tx) => tx.userId === user.id && tx.type === 'tranche').map((tx) => tx.amount));
  const blocked = sum(projects.map((p) => getEscrow(db, p).held));
  const collected = sum(projects.map((p) => raised(db, p.id)));

  // Agriculteur type 2 : parcelle attribuée sans projet
  const assignedOffer = db.offers.find((o) => o.assignedFarmerId === user.id && !o.projectId);

  // ── Publication ──
  const newsEligible = projects.filter((p) => NEWS_STATUSES.includes(p.status));
  const proofEligible = projects.filter((p) => PROOF_STATUSES.includes(p.status) && nextMilestones(p).length > 0);
  const [pubOpen, setPubOpen] = useState(false);
  const [pubProject, setPubProject] = useState('');
  const [pubKind, setPubKind] = useState<UpdateKind>('milestone_proof');
  const [pubMilestone, setPubMilestone] = useState('');
  const [pubText, setPubText] = useState('');
  const [pubAmount, setPubAmount] = useState(0);
  const [pubPhotos, setPubPhotos] = useState<string[]>([]);

  const openPublish = (projectId?: string, kind?: UpdateKind) => {
    const k: UpdateKind = kind ?? (proofEligible.length ? 'milestone_proof' : 'news');
    const list = k === 'milestone_proof' ? proofEligible : newsEligible;
    const pid = projectId && list.some((p) => p.id === projectId) ? projectId : list[0]?.id ?? '';
    const p = getProject(db, pid);
    setPubKind(k);
    setPubProject(pid);
    setPubMilestone(p ? nextMilestones(p)[0]?.id ?? '' : '');
    setPubText('');
    setPubAmount(0);
    setPubPhotos([]);
    setPubOpen(true);
  };
  const pubList = pubKind === 'milestone_proof' ? proofEligible : newsEligible;
  const selectedPubProject = getProject(db, pubProject);
  const samplePhotos = useMemo(
    () => [...(selectedPubProject ? DOMAIN_PHOTOS[selectedPubProject.domain] : []), ...PHOTOS.work],
    [selectedPubProject],
  );

  const changeKind = (k: UpdateKind) => {
    setPubKind(k);
    const list = k === 'milestone_proof' ? proofEligible : newsEligible;
    if (!list.some((p) => p.id === pubProject)) {
      const first = list[0];
      setPubProject(first?.id ?? '');
      setPubMilestone(first ? nextMilestones(first)[0]?.id ?? '' : '');
    }
  };
  const changeProject = (pid: string) => {
    setPubProject(pid);
    const p = getProject(db, pid);
    setPubMilestone(p ? nextMilestones(p)[0]?.id ?? '' : '');
  };
  const submitPublish = () => {
    const res = publishUpdate({
      projectId: pubProject,
      kind: pubKind,
      text: pubText,
      photo: pubPhotos[0],
      amount: pubAmount,
      milestoneId: pubKind === 'milestone_proof' ? pubMilestone : undefined,
    });
    if (showResult(res, pubKind === 'milestone_proof' ? t('farmer.proofSent') : t('farmer.published'))) setPubOpen(false);
  };

  // ── Récolte ──
  const [harvestProject, setHarvestProject] = useState<Project | null>(null);
  const [revenue, setRevenue] = useState(0);
  const [costs, setCosts] = useState(0);
  const [note, setNote] = useState('');
  const openHarvest = (p: Project) => {
    setHarvestProject(p);
    setRevenue(p.forecast.realistic);
    setCosts(p.goal);
    setNote('');
  };
  const submitHarvest = () => {
    if (!harvestProject) return;
    if (showResult(declareHarvest(harvestProject.id, revenue, costs, note), t('farmer.harvestSent'))) setHarvestProject(null);
  };

  return (
    <div className="container-app py-8">
      <PageHeader
        title={t('farmer.title')}
        subtitle={`${user.name} · ${t(`roles.${user.role}`)}`}
        icon={<Tractor size={24} />}
        actions={
          <>
            <button className="btn-secondary" onClick={() => openPublish()} disabled={!newsEligible.length}>
              <Megaphone size={18} /> {t('farmer.publish')}
            </button>
            <Link to="/farmer/new" className="btn-primary">
              <Plus size={18} /> {t('farmer.newProject')}
            </Link>
          </>
        }
      />

      {user.role === 'farmer_t2' && (
        <div className="card mb-6 flex flex-col gap-3 border-wheat/40 bg-wheat-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Landmark className="mt-0.5 shrink-0 text-wheat-dark" />
            <div>
              {assignedOffer ? (
                <>
                  <p className="font-bold">{tr(assignedOffer.name)}</p>
                  <p className="text-sm text-ink-soft">{t('notif.application_accepted', { land: tr(assignedOffer.name) })}</p>
                </>
              ) : (
                <p className="text-sm text-ink-soft">{t('farmer.t2Hint')}</p>
              )}
            </div>
          </div>
          <Link to={assignedOffer ? `/farmer/new?offer=${assignedOffer.id}` : '/lands'} className="btn-wheat shrink-0">
            {assignedOffer ? t('lands.createProject') : t('farmer.goLands')}
          </Link>
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<Wallet size={20} />} label={t('farmer.wallet')} value={money(userWallet(db, user.id))} tone="dark" />
        <StatCard icon={<Coins size={20} />} label={t('farmer.collected')} value={money(collected)} />
        <StatCard icon={<Unlock size={20} />} label={t('farmer.received')} value={money(received)} tone="olive" />
        <StatCard icon={<Lock size={20} />} label={t('farmer.blocked')} value={money(blocked)} tone="wheat" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-lg font-bold">{t('farmer.myProjects')}</h2>
          {projects.length === 0 && <EmptyState icon={<Sprout size={36} />} text={t('farmer.noProjects')} />}
          {projects.map((p) => {
            const esc = getEscrow(db, p);
            const next = nextMilestones(p)[0];
            const pending = p.milestones.find((m) => m.status === 'proof_submitted');
            return (
              <Card key={p.id}>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link to={`/projects/${p.id}`} className="shrink-0">
                    <Img src={p.photos[0]} alt="" domain={p.domain} className="h-32 w-full rounded-xl sm:h-28 sm:w-36" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <Link to={`/projects/${p.id}`} className="font-bold leading-snug hover:text-primary">
                        {tr(p.title)}
                      </Link>
                      <div className="flex flex-wrap gap-1">
                        {p.land.owner === 'state' && <StateLandBadge compact />}
                        <ProjectStatusBadge status={p.status} />
                      </div>
                    </div>
                    <div className="mt-2">
                      <ProgressBar value={progressPct(db, p)} size="sm" />
                      <div className="mt-1 flex flex-wrap justify-between gap-2 text-xs text-ink-muted">
                        <span>
                          <b className="text-primary">{money(esc.collected)}</b> / {money(p.goal)} ({pct(progressPct(db, p))})
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={12} /> {investorsCount(db, p.id)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-olive-50 px-2 py-1.5">
                        <span className="text-ink-muted">{t('farmer.received')} : </span>
                        <b>{money(esc.released)}</b>
                      </div>
                      <div className="rounded-lg bg-wheat-50 px-2 py-1.5">
                        <span className="text-ink-muted">{t('farmer.blocked')} : </span>
                        <b>{money(esc.held)}</b>
                      </div>
                    </div>
                    {pending && (
                      <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-sky-700">
                        <Clock size={13} /> {t('farmer.pendingProof')} · {tr(pending.title)}
                      </p>
                    )}
                    {!pending && next && PROOF_STATUSES.includes(p.status) && (
                      <p className="mt-2 text-xs text-ink-soft">{t('farmer.nextMilestone', { title: tr(next.title) })}</p>
                    )}
                    {p.adminNote && (p.status === 'needs_changes' || p.status === 'rejected') && (
                      <p className="mt-2 rounded-lg bg-red-50 px-2 py-1.5 text-xs text-red-700">{t('farmer.adminNote', { note: p.adminNote })}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {PROOF_STATUSES.includes(p.status) && next && !pending && (
                        <button className="btn-primary btn-sm" onClick={() => openPublish(p.id, 'milestone_proof')}>
                          <Camera size={14} /> {t('updateKind.milestone_proof')}
                        </button>
                      )}
                      {NEWS_STATUSES.includes(p.status) && (
                        <button className="btn-secondary btn-sm" onClick={() => openPublish(p.id, 'news')}>
                          <Megaphone size={14} /> {t('updateKind.news')}
                        </button>
                      )}
                      {p.status === 'in_progress' && (
                        <button className="btn-wheat btn-sm" onClick={() => openHarvest(p)}>
                          <Wheat size={14} /> {t('farmer.declareHarvest')}
                        </button>
                      )}
                      {p.status === 'needs_changes' && (
                        <button className="btn-secondary btn-sm" onClick={() => showResult(resubmitProject(p.id), t('farmer.resubmitted'))}>
                          <RefreshCcw size={14} /> {t('farmer.resubmit')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div>
          <Card>
            <CardTitle icon={<CalendarCheck size={18} />}>{t('farmer.visits')}</CardTitle>
            {visits.length === 0 ? (
              <p className="text-sm text-ink-muted">{t('farmer.noVisits')}</p>
            ) : (
              <ul className="space-y-3">
                {visits.map((v) => {
                  const citizen = getUser(db, v.citizenId);
                  const p = getProject(db, v.projectId);
                  return (
                    <li key={v.id} className="rounded-xl bg-cream p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold">{citizen?.name}</p>
                          <p className="truncate text-xs text-ink-muted">{p ? tr(p.title) : ''}</p>
                        </div>
                        <VisitBadge status={v.status} />
                      </div>
                      <p className="mt-1 text-xs font-semibold text-primary">{date(v.wishedDate)}</p>
                      {v.message && <p className="mt-1 text-xs italic text-ink-soft">« {v.message} »</p>}
                      {v.status === 'requested' && (
                        <div className="mt-2 flex gap-2">
                          <button className="btn-primary btn-sm flex-1" onClick={() => showResult(setVisitStatus(v.id, 'confirmed'), t('farmer.visitConfirmed'))}>
                            <Check size={14} /> {t('farmer.confirmVisit')}
                          </button>
                          <button className="btn-danger btn-sm flex-1" onClick={() => showResult(setVisitStatus(v.id, 'refused'), t('farmer.visitRefused'))}>
                            <X size={14} /> {t('farmer.refuseVisit')}
                          </button>
                        </div>
                      )}
                      {v.status === 'confirmed' && (
                        <button className="btn-ghost btn-sm mt-2 w-full border border-ink/10" onClick={() => showResult(setVisitStatus(v.id, 'done'))}>
                          <Check size={14} /> {t('farmer.markDone')}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Modale de publication */}
      <Modal open={pubOpen} onClose={() => setPubOpen(false)} title={t('farmer.publishTitle')} wide>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {(['milestone_proof', 'news', 'expense'] as UpdateKind[]).map((k) => (
              <button
                key={k}
                type="button"
                disabled={k === 'milestone_proof' ? !proofEligible.length : !newsEligible.length}
                onClick={() => changeKind(k)}
                className={`btn border px-2 text-xs sm:text-sm ${pubKind === k ? 'border-primary bg-primary text-white' : 'border-ink/15 bg-white text-ink-soft'}`}
              >
                {t(`updateKind.${k}`)}
              </button>
            ))}
          </div>
          {pubList.length === 0 ? (
            <p className="text-sm text-ink-muted">{t('farmer.noEligible')}</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t('farmer.project')}>
                  <select className="input" value={pubProject} onChange={(e) => changeProject(e.target.value)}>
                    {pubList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {tr(p.title)}
                      </option>
                    ))}
                  </select>
                </Field>
                {pubKind === 'milestone_proof' && selectedPubProject && (
                  <Field label={t('farmer.milestone')}>
                    <select className="input" value={pubMilestone} onChange={(e) => setPubMilestone(e.target.value)}>
                      {nextMilestones(selectedPubProject).map((m) => (
                        <option key={m.id} value={m.id}>
                          {tr(m.title)} · {money(m.tranche)}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                {pubKind === 'expense' && (
                  <Field label={t('farmer.expenseAmount')}>
                    <input type="number" min={0} className="input" value={pubAmount} onChange={(e) => setPubAmount(Number(e.target.value))} />
                  </Field>
                )}
              </div>
              <Field label={t('farmer.text')}>
                <textarea className="input min-h-[100px]" value={pubText} placeholder={t('farmer.textPlaceholder')} onChange={(e) => setPubText(e.target.value)} />
              </Field>
              <PhotoPicker value={pubPhotos} onChange={setPubPhotos} samples={samplePhotos} />
              <p className="flex items-center gap-1 text-xs text-ink-muted">
                <Clock size={13} /> {t('farmer.timestamp', { date: dateTime(nowIso()) })}
              </p>
              <button className="btn-primary w-full" onClick={submitPublish} disabled={!pubText.trim() || (pubKind === 'milestone_proof' && !pubMilestone)}>
                {pubKind === 'milestone_proof' ? <Camera size={18} /> : <Megaphone size={18} />} {t('common.submit')}
              </button>
            </>
          )}
        </div>
      </Modal>

      {/* Modale de récolte */}
      <Modal open={!!harvestProject} onClose={() => setHarvestProject(null)} title={harvestProject ? t('farmer.harvestTitle', { project: tr(harvestProject.title) }) : ''}>
        <div className="space-y-3">
          <Field label={t('farmer.revenue')}>
            <input type="number" min={0} className="input" value={revenue} onChange={(e) => setRevenue(Number(e.target.value))} />
          </Field>
          <Field label={t('farmer.costs')}>
            <input type="number" min={0} className="input" value={costs} onChange={(e) => setCosts(Number(e.target.value))} />
          </Field>
          <div className={`rounded-xl p-3 text-center ${revenue - costs >= 0 ? 'bg-primary-50 text-primary' : 'bg-red-50 text-red-700'}`}>
            <div className="text-xs font-semibold">{t('farmer.net')}</div>
            <div className="text-2xl font-extrabold">{money(revenue - costs)}</div>
          </div>
          <Field label={`${t('farmer.note')} (${t('common.optional')})`}>
            <textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <button className="btn-wheat w-full" onClick={submitHarvest} disabled={costs <= 0}>
            <Wheat size={18} /> {t('common.submit')}
          </button>
        </div>
      </Modal>
    </div>
  );
}

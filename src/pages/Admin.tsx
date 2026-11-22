import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, Camera, Check, ClipboardCheck, Coins, FileClock, History, Landmark, Lock, PencilLine, ShieldCheck, Sprout, Unlock, Users, Wheat, X } from 'lucide-react';
import type { Project } from '../types';
import { useI18n, type TKey } from '../i18n';
import { useStore } from '../store/useStore';
import { getEscrow, getProject, getUser, projectInvestments, round2, sum } from '../store/selectors';
import { approveProject, rejectProject, requestChanges } from '../services/projects';
import { rejectMilestone, validateMilestone } from '../services/milestones';
import { computeDistribution, rejectHarvest, validateHarvest } from '../services/harvest';
import { useResultToast } from '../components/hooks';
import { DomainIcon, Img, SplitDonut, StatCard, StateLandBadge } from '../components/visuals';
import { Badge, Card, EmptyState, Field, Modal, PageHeader } from '../components/ui';

type Tab = 'proofs' | 'projects' | 'harvest' | 'history';
type ReasonAction = { kind: 'changes' | 'reject'; projectId: string } | { kind: 'proof'; projectId: string; milestoneId: string };

export default function Admin() {
  const { t, tr, money, pct, date, dateTime } = useI18n();
  const db = useStore();
  const showResult = useResultToast();

  const submitted = db.projects.filter((p) => p.status === 'submitted');
  const proofs = db.projects.flatMap((p) => p.milestones.filter((m) => m.status === 'proof_submitted').map((m) => ({ project: p, milestone: m })));
  const reports = db.saleReports.filter((r) => r.status === 'submitted');
  const initialTab: Tab = proofs.length ? 'proofs' : reports.length ? 'harvest' : 'projects';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [reasonAction, setReasonAction] = useState<ReasonAction | null>(null);
  const [reason, setReason] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  // Statistiques
  const collected = sum(db.investments.map((i) => i.amount));
  const released = sum(db.projects.map((p) => getEscrow(db, p).released));
  const held = sum(db.projects.map((p) => getEscrow(db, p).held));
  const distributed = round2(sum(db.distributions.map((d) => d.investorsAmount + d.farmerAmount)));
  const active = db.projects.filter((p) => ['funding', 'funded', 'in_progress', 'harvest'].includes(p.status)).length;

  const submitReason = () => {
    if (!reasonAction) return;
    let ok = false;
    if (reasonAction.kind === 'changes') ok = showResult(requestChanges(reasonAction.projectId, reason), t('admin.changesRequested'));
    if (reasonAction.kind === 'reject') ok = showResult(rejectProject(reasonAction.projectId, reason), t('admin.rejected'));
    if (reasonAction.kind === 'proof') ok = showResult(rejectMilestone(reasonAction.projectId, reasonAction.milestoneId, reason), t('admin.proofRejected'));
    if (ok) {
      setReasonAction(null);
      setReason('');
    }
  };

  const tabs: { id: Tab; label: TKey; count: number; icon: typeof Camera }[] = [
    { id: 'proofs', label: 'admin.proofsQueue', count: proofs.length, icon: Camera },
    { id: 'projects', label: 'admin.projectsQueue', count: submitted.length, icon: FileClock },
    { id: 'harvest', label: 'admin.harvestQueue', count: reports.length, icon: Wheat },
    { id: 'history', label: 'admin.history', count: db.distributions.length, icon: History },
  ];

  const farmerLine = (p: Project) => {
    const f = getUser(db, p.farmerId);
    return f ? t('admin.by', { name: f.name }) : '';
  };

  return (
    <div className="container-app py-8">
      <PageHeader title={t('admin.title')} icon={<ShieldCheck size={24} />} />

      <h2 className="mb-3 text-lg font-bold">{t('admin.stats')}</h2>
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard icon={<Coins size={20} />} label={t('admin.totalCollected')} value={money(collected)} />
        <StatCard icon={<Lock size={20} />} label={t('admin.escrowHeld')} value={money(held)} tone="wheat" />
        <StatCard icon={<Unlock size={20} />} label={t('admin.released')} value={money(released)} tone="olive" />
        <StatCard icon={<Banknote size={20} />} label={t('admin.distributed')} value={money(distributed)} tone="blue" />
        <StatCard icon={<Sprout size={20} />} label={t('admin.activeProjects')} value={String(active)} tone="gray" />
        <StatCard icon={<Users size={20} />} label={t('admin.users')} value={String(db.users.length)} tone="gray" />
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`btn shrink-0 border ${tab === tb.id ? 'border-primary bg-primary text-white' : 'border-ink/10 bg-white text-ink-soft'}`}
          >
            <tb.icon size={16} /> {t(tb.label)}
            <span className={`rounded-full px-2 text-xs ${tab === tb.id ? 'bg-white/20' : tb.count ? 'bg-wheat text-ink' : 'bg-ink/10'}`}>{tb.count}</span>
          </button>
        ))}
      </div>

      {/* Preuves d'étape */}
      {tab === 'proofs' && (
        <div className="space-y-4">
          {proofs.length === 0 && <EmptyState icon={<ClipboardCheck size={36} />} text={t('admin.noProofs')} />}
          {proofs.map(({ project, milestone }) => {
            const proof = db.updates.find((u) => u.id === milestone.proofUpdateId);
            const esc = getEscrow(db, project);
            return (
              <Card key={project.id + milestone.id}>
                <div className="flex flex-col gap-4 md:flex-row">
                  {proof?.photo && <Img src={proof.photo} alt="" className="aspect-[4/3] w-full shrink-0 rounded-xl md:w-64" />}
                  <div className="min-w-0 flex-1">
                    <Link to={`/projects/${project.id}`} className="text-sm font-semibold text-primary hover:underline">
                      {tr(project.title)}
                    </Link>
                    <p className="text-xs text-ink-muted">{farmerLine(project)}</p>
                    <h3 className="mt-2 text-lg font-bold">✓ {tr(milestone.title)}</h3>
                    {proof && (
                      <>
                        <p className="mt-1 text-sm text-ink-soft">{tr(proof.text)}</p>
                        <p className="mt-1 text-xs text-ink-muted">{dateTime(proof.date)}</p>
                      </>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <Badge tone="green">{t('admin.trancheOf', { amount: money(milestone.tranche) })}</Badge>
                      <Badge tone="wheat" icon={<Lock size={12} />}>
                        {t('project.escrowHeld')} : {money(esc.held)}
                      </Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        className="btn-primary"
                        onClick={() => showResult(validateMilestone(project.id, milestone.id), t('admin.proofValidated', { amount: money(milestone.tranche) }))}
                      >
                        <Unlock size={16} /> {t('admin.validateProof', { amount: money(milestone.tranche) })}
                      </button>
                      <button className="btn-danger" onClick={() => setReasonAction({ kind: 'proof', projectId: project.id, milestoneId: milestone.id })}>
                        <X size={16} /> {t('admin.rejectProof')}
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Projets soumis */}
      {tab === 'projects' && (
        <div className="space-y-4">
          {submitted.length === 0 && <EmptyState icon={<ClipboardCheck size={36} />} text={t('admin.noProjects')} />}
          {submitted.map((p) => {
            const offer = db.offers.find((o) => o.id === p.stateOfferId);
            return (
              <Card key={p.id}>
                <div className="flex flex-col gap-4 md:flex-row">
                  <Img src={p.photos[0]} alt="" domain={p.domain} className="aspect-[4/3] w-full shrink-0 rounded-xl md:w-56" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="green" icon={<DomainIcon domain={p.domain} size={12} />}>
                        {t(`domains.${p.domain}`)}
                      </Badge>
                      {p.land.owner === 'state' && <StateLandBadge compact />}
                      <Badge>{t(`contract.${p.contractType}`)}</Badge>
                    </div>
                    <h3 className="mt-2 text-lg font-bold">{tr(p.title)}</h3>
                    <p className="text-xs text-ink-muted">
                      {farmerLine(p)} · {p.land.place} · {t(`gov.${p.land.governorate}`)} · {date(p.createdAt)}
                    </p>
                    <p className="mt-2 text-sm text-ink-soft">{tr(p.summary)}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <span>
                        {t('project.sought')} : <b>{money(p.goal)}</b>
                      </span>
                      <span>
                        {t('card.min')} : <b>{money(p.minInvestment)}</b>
                      </span>
                      <span>
                        {t('project.duration')} : <b>{t('common.months', { n: p.durationMonths })}</b>
                      </span>
                      {offer?.coInvestment ? (
                        <span className="text-wheat-dark">
                          <Landmark size={13} className="me-1 inline" />
                          {t('lands.coInvest', { amount: money(offer.coInvestment) })}
                        </span>
                      ) : null}
                    </div>
                    <button className="mt-2 text-xs font-semibold text-primary hover:underline" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                      {t('common.details')}
                    </button>
                    {expanded === p.id && (
                      <div className="mt-3 grid gap-4 rounded-xl bg-cream p-3 md:grid-cols-2">
                        <div>
                          <p className="label">{t('project.budget')}</p>
                          <ul className="space-y-1 text-xs">
                            {p.budget.map((b) => (
                              <li key={b.id} className="flex justify-between gap-2">
                                <span>{tr(b.label)}</span>
                                <b>{money(b.amount)}</b>
                              </li>
                            ))}
                          </ul>
                          <p className="label mt-3">{t('project.milestones')}</p>
                          <ul className="space-y-1 text-xs">
                            {p.milestones.map((m) => (
                              <li key={m.id} className="flex justify-between gap-2">
                                <span>{tr(m.title)}</span>
                                <b>{money(m.tranche)}</b>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <SplitDonut split={p.split} size={110} />
                      </div>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button className="btn-primary" onClick={() => showResult(approveProject(p.id), t('admin.validated'))}>
                        <Check size={16} /> {t('admin.validate')}
                      </button>
                      <button className="btn-secondary" onClick={() => setReasonAction({ kind: 'changes', projectId: p.id })}>
                        <PencilLine size={16} /> {t('admin.requestChanges')}
                      </button>
                      <button className="btn-danger" onClick={() => setReasonAction({ kind: 'reject', projectId: p.id })}>
                        <X size={16} /> {t('admin.reject')}
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Déclarations de récolte */}
      {tab === 'harvest' && (
        <div className="space-y-4">
          {reports.length === 0 && <EmptyState icon={<Wheat size={36} />} text={t('admin.noHarvest')} />}
          {reports.map((r) => {
            const p = getProject(db, r.projectId);
            if (!p) return null;
            const calc = computeDistribution(p, projectInvestments(db, p.id), r.revenue, r.costs);
            const capital = sum(calc.payouts.map((x) => x.capital));
            const topPayouts = [...calc.payouts].sort((a, b) => b.invested - a.invested).slice(0, 6);
            const total = round2(capital + calc.investorsAmount + calc.farmerAmount);
            return (
              <Card key={r.id}>
                <div className="flex flex-col gap-4 md:flex-row">
                  <Img src={p.photos[0]} alt="" domain={p.domain} className="aspect-[4/3] w-full shrink-0 rounded-xl md:w-56" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/projects/${p.id}`} className="text-lg font-bold hover:text-primary">
                      {tr(p.title)}
                    </Link>
                    <p className="text-xs text-ink-muted">
                      {farmerLine(p)} · {date(r.createdAt)}
                    </p>
                    {r.note && <p className="mt-2 text-sm italic text-ink-soft">« {r.note} »</p>}
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-cream p-2">
                        <div className="text-[11px] text-ink-muted">{t('admin.revenue')}</div>
                        <div className="font-bold">{money(r.revenue)}</div>
                      </div>
                      <div className="rounded-xl bg-cream p-2">
                        <div className="text-[11px] text-ink-muted">{t('admin.costs')}</div>
                        <div className="font-bold">{money(r.costs)}</div>
                      </div>
                      <div className={`rounded-xl p-2 ${calc.net >= 0 ? 'bg-primary-50 text-primary' : 'bg-red-50 text-red-700'}`}>
                        <div className="text-[11px]">{t('admin.net')}</div>
                        <div className="font-extrabold">{money(calc.net)}</div>
                      </div>
                    </div>

                    <p className="label mt-4">{t('admin.preview')}</p>
                    <ul className="space-y-1.5 rounded-xl border border-ink/10 p-3 text-sm">
                      <li className="flex justify-between">
                        <span>{t('admin.capitalBack')}</span>
                        <b>{money(capital)}</b>
                      </li>
                      <li className="flex justify-between">
                        <span>
                          {t('admin.investorsShare')} ({pct(p.split.investors)})
                        </span>
                        <b className="text-wheat-dark">{money(calc.investorsAmount)}</b>
                      </li>
                      <li className="flex justify-between">
                        <span>
                          {t('admin.farmerShare')} ({pct(p.split.farmer)})
                        </span>
                        <b>{money(calc.farmerAmount)}</b>
                      </li>
                      <li className="flex justify-between text-ink-muted">
                        <span>
                          {t('admin.platformShare')} ({pct(p.split.platform)})
                        </span>
                        <span>{money(calc.platformAmount)}</span>
                      </li>
                      <li className="flex justify-between text-ink-muted">
                        <span>
                          {t('admin.reserveShare')} ({pct(p.split.reserve)})
                        </span>
                        <span>{money(calc.reserveAmount)}</span>
                      </li>
                    </ul>
                    <ul className="mt-3 space-y-1 text-xs">
                      {topPayouts.map((x) => {
                        const u = x.investorType === 'state' ? undefined : getUser(db, x.investorId);
                        return (
                          <li key={x.investorId} className={`flex justify-between gap-2 rounded-lg px-2 py-1 ${x.investorType === 'state' ? 'bg-wheat-50' : 'bg-cream'}`}>
                            <span className="truncate">
                              {x.investorType === 'state' ? t('project.state') : u?.name} · {money(x.invested)}
                            </span>
                            <b className="whitespace-nowrap text-primary">
                              +{money(x.gain)} <span className="font-normal text-ink-muted">(+{money(x.capital)})</span>
                            </b>
                          </li>
                        );
                      })}
                      {calc.payouts.length > topPayouts.length && <li className="px-2 text-ink-muted">… {t('common.investorsN', { n: calc.payouts.length })}</li>}
                    </ul>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button className="btn-primary" onClick={() => showResult(validateHarvest(r.id), t('admin.harvestValidated', { amount: money(total) }))}>
                        <Banknote size={16} /> {t('admin.validateHarvest')}
                      </button>
                      <button className="btn-danger" onClick={() => showResult(rejectHarvest(r.id), t('admin.harvestRejected'))}>
                        <X size={16} /> {t('admin.reject')}
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Historique des distributions */}
      {tab === 'history' && (
        <div className="space-y-3">
          {db.distributions.length === 0 && <EmptyState icon={<History size={36} />} text={t('common.noData')} />}
          {[...db.distributions].reverse().map((d) => {
            const p = getProject(db, d.projectId);
            return (
              <Card key={d.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold">{p ? tr(p.title) : ''}</p>
                    <p className="text-xs text-ink-muted">{dateTime(d.date)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge tone="green">
                      {t('admin.net')} : {money(d.net)}
                    </Badge>
                    <Badge tone="wheat">
                      {t('admin.investorsShare')} : {money(d.investorsAmount)}
                    </Badge>
                    <Badge>
                      {t('admin.farmerShare')} : {money(d.farmerAmount)}
                    </Badge>
                    <Badge tone="blue">{t('common.investorsN', { n: d.payouts.length })}</Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={!!reasonAction}
        onClose={() => setReasonAction(null)}
        title={reasonAction?.kind === 'changes' ? t('admin.requestChanges') : reasonAction?.kind === 'proof' ? t('admin.rejectProof') : t('admin.reject')}
      >
        <div className="space-y-3">
          <Field label={t('common.reason')}>
            <textarea className="input min-h-[100px]" value={reason} placeholder={t('admin.reasonPlaceholder')} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <button className="btn-primary w-full" onClick={submitReason} disabled={!reason.trim()}>
            {t('common.confirm')}
          </button>
        </div>
      </Modal>
    </div>
  );
}

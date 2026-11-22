import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Landmark, Plus, Send, Trash2, Wand2 } from 'lucide-react';
import { DOMAINS, type ContractType, type Domain, type Governorate, type LatLng, type RiskLevel, type Split, type WaterAccess } from '../types';
import { useI18n } from '../i18n';
import { useStore } from '../store/useStore';
import { sum, useCurrentUser } from '../store/selectors';
import { submitProject } from '../services/projects';
import { useResultToast } from '../components/hooks';
import { MapView } from '../components/MapView';
import { PhotoPicker } from '../components/PhotoPicker';
import { DomainIcon, StateLandBadge } from '../components/visuals';
import { Card, EmptyState, Field, PageHeader } from '../components/ui';
import { GOV_COORDS, GOVERNORATES } from '../lib/geo';
import { DOMAIN_PHOTOS } from '../lib/photos';

const WATER: WaterAccess[] = ['well', 'irrigation', 'rain', 'none'];
const RISKS: RiskLevel[] = ['low', 'medium', 'high'];
const SPLIT_KEYS: (keyof Split)[] = ['farmer', 'investors', 'platform', 'reserve'];

export default function CreateProject() {
  const { t, tr, lang, money, pct } = useI18n();
  const db = useStore();
  const user = useCurrentUser()!;
  const navigate = useNavigate();
  const showResult = useResultToast();
  const [params] = useSearchParams();
  const Next = lang === 'ar' ? ArrowLeft : ArrowRight;
  const Prev = lang === 'ar' ? ArrowRight : ArrowLeft;

  const isT2 = user.role === 'farmer_t2';
  const offer = isT2
    ? db.offers.find((o) => o.assignedFarmerId === user.id && !o.projectId && (!params.get('offer') || o.id === params.get('offer'))) ??
      db.offers.find((o) => o.assignedFarmerId === user.id && !o.projectId)
    : undefined;

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  // Étape 1
  const [domain, setDomain] = useState<Domain>(offer?.vocation ?? 'olives');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  // Étape 2
  const [governorate, setGovernorate] = useState<Governorate>(offer?.governorate ?? user.governorate);
  const [place, setPlace] = useState('');
  const [area, setArea] = useState(2);
  const [water, setWater] = useState<WaterAccess>('well');
  const [coords, setCoords] = useState<LatLng | undefined>(user.location);
  // Étape 3
  const [budget, setBudget] = useState([
    { label: '', amount: 0 },
    { label: '', amount: 0 },
  ]);
  const [milestones, setMilestones] = useState([
    { title: t('wizard.defaultMilestone1'), tranche: 0, months: 1 },
    { title: t('wizard.defaultMilestone2'), tranche: 0, months: 4 },
    { title: t('wizard.defaultMilestone3'), tranche: 0, months: 8 },
  ]);
  // Étape 4
  const [minInvestment, setMinInvestment] = useState(100);
  const [duration, setDuration] = useState(12);
  const [contract, setContract] = useState<ContractType>('profit_share');
  const [presaleUnit, setPresaleUnit] = useState('');
  const [presalePrice, setPresalePrice] = useState(10);
  const [split, setSplit] = useState<Split>({ farmer: 40, investors: 50, platform: 5, reserve: 5 });
  const [revenue, setRevenue] = useState(0);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('medium');
  const [mainRisk, setMainRisk] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const total = sum(budget.map((b) => b.amount));
  const tranchesTotal = sum(milestones.map((m) => m.tranche));
  const splitTotal = sum(SPLIT_KEYS.map((k) => split[k]));
  const estReturn = total > 0 ? Math.max(0, ((revenue - total) * split.investors) / total) : 0;
  const samples = useMemo(() => DOMAIN_PHOTOS[domain], [domain]);

  if (isT2 && !offer) {
    return (
      <div className="container-app py-16">
        <EmptyState icon={<Landmark size={36} />} text={t('wizard.noStateLand')} action={<Link to="/lands" className="btn-primary btn-sm">{t('farmer.goLands')}</Link>} />
      </div>
    );
  }

  const validate = (s: number): boolean => {
    let ok = true;
    if (s === 1) ok = !!title.trim() && !!summary.trim();
    if (s === 2) ok = isT2 || (!!place.trim() && area > 0 && !!coords);
    if (s === 3) {
      ok = budget.every((b) => b.label.trim() && b.amount > 0) && milestones.every((m) => m.title.trim() && m.tranche > 0) && total > 0;
      if (ok && tranchesTotal !== total) {
        setError(t('wizard.tranchesMismatch', { amount: money(total) }));
        return false;
      }
    }
    if (s === 4) {
      if (splitTotal !== 100) {
        setError(t('wizard.splitError'));
        return false;
      }
      ok = minInvestment > 0 && duration > 0 && revenue > 0 && photos.length > 0 && (contract !== 'presale' || (!!presaleUnit.trim() && presalePrice > 0));
    }
    setError(ok ? '' : t('wizard.required'));
    return ok;
  };

  const goNext = () => {
    if (validate(step)) setStep((s) => Math.min(4, s + 1));
  };

  const balanceTranches = () => {
    const others = sum(milestones.slice(0, -1).map((m) => m.tranche));
    setMilestones(milestones.map((m, i) => (i === milestones.length - 1 ? { ...m, tranche: Math.max(0, total - others) } : m)));
  };

  const submit = () => {
    if (!validate(4)) return;
    const land = offer
      ? {
          owner: 'state' as const,
          governorate: offer.governorate,
          areaHa: offer.areaHa,
          coords: offer.coords,
          place: tr(offer.name),
          water: offer.water,
          availableUntil: new Date(Date.now() + offer.durationYears * 365 * 86_400_000).toISOString(),
          stateOfferId: offer.id,
        }
      : { owner: 'farmer' as const, governorate, areaHa: area, coords: coords ?? GOV_COORDS[governorate], place: place.trim(), water };
    const res = submitProject({
      domain,
      title,
      summary,
      description: description || summary,
      land,
      budget,
      milestones,
      minInvestment,
      durationMonths: duration,
      contractType: contract,
      presaleUnit,
      presaleUnitPrice: presalePrice,
      split,
      realisticRevenue: revenue,
      riskLevel,
      mainRisk,
      photos,
      stateOfferId: offer?.id,
    });
    if (showResult(res, t('wizard.submitted'))) navigate('/farmer');
  };

  const steps = [t('wizard.s1'), t('wizard.s2'), t('wizard.s3'), t('wizard.s4')];

  return (
    <div className="container-app max-w-3xl py-8">
      <PageHeader title={t('wizard.title')} subtitle={t('wizard.step', { n: step })} />

      {/* Indicateur d'étapes */}
      <ol className="mb-6 grid grid-cols-4 gap-2">
        {steps.map((label, i) => {
          const n = i + 1;
          const state = n < step ? 'done' : n === step ? 'current' : 'todo';
          return (
            <li key={label} className="flex flex-col items-center gap-1 text-center">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                  state === 'done' ? 'bg-primary text-white' : state === 'current' ? 'bg-wheat text-ink ring-4 ring-wheat/30' : 'bg-ink/10 text-ink-muted'
                }`}
              >
                {state === 'done' ? <Check size={16} /> : n}
              </span>
              <span className={`text-[11px] font-semibold leading-tight sm:text-xs ${state === 'todo' ? 'text-ink-muted' : 'text-ink'}`}>{label}</span>
            </li>
          );
        })}
      </ol>

      <Card>
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <span className="label">{t('wizard.domain')}</span>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {DOMAINS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDomain(d)}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-semibold ${domain === d ? 'border-primary bg-primary-50 text-primary' : 'border-ink/10 text-ink-soft hover:bg-cream'}`}
                  >
                    <DomainIcon domain={d} size={22} />
                    {t(`domains.${d}`)}
                  </button>
                ))}
              </div>
            </div>
            <Field label={`${t('wizard.projectTitle')} *`}>
              <input className="input" value={title} placeholder={t('wizard.titlePlaceholder')} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label={`${t('wizard.summary')} *`}>
              <input className="input" value={summary} onChange={(e) => setSummary(e.target.value)} />
            </Field>
            <Field label={t('wizard.description')}>
              <textarea className="input min-h-[120px]" value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
          </div>
        )}

        {step === 2 &&
          (offer ? (
            <div className="space-y-3">
              <p className="label">{t('wizard.stateLand')}</p>
              <div className="rounded-2xl border border-wheat/40 bg-wheat-50 p-4">
                <p className="text-lg font-bold">{tr(offer.name)}</p>
                <p className="text-sm text-ink-soft">
                  {t(`gov.${offer.governorate}`)} · {t('common.ha', { n: offer.areaHa })} · {t(`water.${offer.water}`)} · {t('lands.availability', { n: offer.durationYears })}
                </p>
                <div className="mt-2">
                  <StateLandBadge compact />
                </div>
                <p className="mt-2 text-xs text-ink-muted">{t('lands.ownerNote')}</p>
              </div>
              <MapView markers={[{ id: offer.id, position: offer.coords, label: tr(offer.name), tone: 'wheat' }]} zoom={10} height="h-56" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t('wizard.governorate')}>
                  <select
                    className="input"
                    value={governorate}
                    onChange={(e) => {
                      const g = e.target.value as Governorate;
                      setGovernorate(g);
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
                <Field label={`${t('wizard.place')} *`}>
                  <input className="input" value={place} onChange={(e) => setPlace(e.target.value)} />
                </Field>
                <Field label={t('wizard.area')}>
                  <input type="number" min={0.1} step={0.1} className="input" value={area} onChange={(e) => setArea(Number(e.target.value))} />
                </Field>
                <Field label={t('wizard.water')}>
                  <select className="input" value={water} onChange={(e) => setWater(e.target.value as WaterAccess)}>
                    {WATER.map((w) => (
                      <option key={w} value={w}>
                        {t(`water.${w}`)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <p className="text-xs font-semibold text-ink-soft">{t('wizard.pickOnMap')}</p>
              <MapView center={GOV_COORDS[governorate]} zoom={9} height="h-64" onPick={setCoords} picked={coords} />
            </div>
          ))}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <p className="label">{t('wizard.budgetLines')}</p>
              <div className="space-y-2">
                {budget.map((b, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className="input flex-1"
                      placeholder={t('wizard.lineLabel')}
                      value={b.label}
                      onChange={(e) => setBudget(budget.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                    />
                    <input
                      type="number"
                      min={0}
                      className="input w-28 sm:w-36"
                      value={b.amount || ''}
                      placeholder="DT"
                      onChange={(e) => setBudget(budget.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) } : x)))}
                    />
                    <button type="button" className="btn-ghost px-2" disabled={budget.length <= 1} onClick={() => setBudget(budget.filter((_, j) => j !== i))} aria-label={t('common.remove')}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="btn-ghost btn-sm mt-2 text-primary" onClick={() => setBudget([...budget, { label: '', amount: 0 }])}>
                <Plus size={14} /> {t('wizard.addLine')}
              </button>
              <div className="mt-2 flex justify-between rounded-xl bg-primary-50 px-3 py-2 text-sm font-bold text-primary">
                <span>{t('wizard.budgetTotal')}</span>
                <span>{money(total)}</span>
              </div>
            </div>

            <div>
              <p className="label">{t('wizard.milestones')}</p>
              <div className="space-y-2">
                {milestones.map((m, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className="input flex-1"
                      placeholder={t('wizard.milestoneTitle')}
                      value={m.title}
                      onChange={(e) => setMilestones(milestones.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                    />
                    <input
                      type="number"
                      min={0}
                      className="input w-24 sm:w-32"
                      placeholder={t('wizard.tranche')}
                      value={m.tranche || ''}
                      onChange={(e) => setMilestones(milestones.map((x, j) => (j === i ? { ...x, tranche: Number(e.target.value) } : x)))}
                    />
                    <input
                      type="number"
                      min={0}
                      className="input w-16"
                      title={t('wizard.dueMonths')}
                      value={m.months}
                      onChange={(e) => setMilestones(milestones.map((x, j) => (j === i ? { ...x, months: Number(e.target.value) } : x)))}
                    />
                    <button type="button" className="btn-ghost px-2" disabled={milestones.length <= 1} onClick={() => setMilestones(milestones.filter((_, j) => j !== i))} aria-label={t('common.remove')}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className="btn-ghost btn-sm text-primary" onClick={() => setMilestones([...milestones, { title: '', tranche: 0, months: 6 }])}>
                  <Plus size={14} /> {t('wizard.addMilestone')}
                </button>
                <button type="button" className="btn-ghost btn-sm text-wheat-dark" onClick={balanceTranches} disabled={total <= 0}>
                  <Wand2 size={14} /> {t('wizard.balance')}
                </button>
              </div>
              <div className={`mt-2 flex justify-between rounded-xl px-3 py-2 text-sm font-bold ${tranchesTotal === total && total > 0 ? 'bg-primary-50 text-primary' : 'bg-wheat-50 text-wheat-dark'}`}>
                <span>{t('wizard.tranchesTotal')}</span>
                <span>
                  {money(tranchesTotal)} / {money(total)}
                </span>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label={t('wizard.minInvestment')}>
                <input type="number" min={10} className="input" value={minInvestment} onChange={(e) => setMinInvestment(Number(e.target.value))} />
              </Field>
              <Field label={t('wizard.duration')}>
                <input type="number" min={1} className="input" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
              </Field>
              <Field label={t('wizard.contract')}>
                <select className="input" value={contract} onChange={(e) => setContract(e.target.value as ContractType)}>
                  <option value="profit_share">{t('contract.profit_share')}</option>
                  <option value="presale">{t('contract.presale')}</option>
                </select>
              </Field>
            </div>
            {contract === 'presale' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t('wizard.presaleUnit')}>
                  <input className="input" value={presaleUnit} placeholder={t('wizard.presaleUnitPlaceholder')} onChange={(e) => setPresaleUnit(e.target.value)} />
                </Field>
                <Field label={t('wizard.presalePrice')}>
                  <input type="number" min={0} className="input" value={presalePrice} onChange={(e) => setPresalePrice(Number(e.target.value))} />
                </Field>
              </div>
            )}
            <div>
              <p className="label">{t('wizard.split')}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {SPLIT_KEYS.map((k) => (
                  <Field key={k} label={t(`split.${k}`)}>
                    <input type="number" min={0} max={100} className="input" value={split[k]} onChange={(e) => setSplit({ ...split, [k]: Number(e.target.value) })} />
                  </Field>
                ))}
              </div>
              <p className={`mt-1 text-xs font-bold ${splitTotal === 100 ? 'text-primary' : 'text-red-600'}`}>{t('wizard.splitSum', { pct: pct(splitTotal) })}</p>
            </div>
            <Field label={`${t('wizard.revenue')} *`}>
              <input type="number" min={0} className="input" value={revenue || ''} onChange={(e) => setRevenue(Number(e.target.value))} />
            </Field>
            {revenue > 0 && <p className="-mt-3 text-xs font-semibold text-wheat-dark">{t('wizard.estReturn', { pct: pct(estReturn, 1) })}</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('wizard.riskLevel')}>
                <select className="input" value={riskLevel} onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}>
                  {RISKS.map((r) => (
                    <option key={r} value={r}>
                      {t(`risk.${r}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('wizard.mainRisk')}>
                <input className="input" value={mainRisk} onChange={(e) => setMainRisk(e.target.value)} />
              </Field>
            </div>
            <div>
              <p className="label">{t('wizard.photos')} *</p>
              <PhotoPicker value={photos} onChange={setPhotos} samples={samples} multiple />
            </div>
          </div>
        )}

        {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

        <div className="mt-6 flex justify-between gap-3 border-t border-ink/5 pt-4">
          <button className="btn-ghost" onClick={() => (step === 1 ? navigate('/farmer') : setStep(step - 1))}>
            <Prev size={16} /> {step === 1 ? t('common.cancel') : t('common.previous')}
          </button>
          {step < 4 ? (
            <button className="btn-primary" onClick={goNext}>
              {t('common.next')} <Next size={16} />
            </button>
          ) : (
            <button className="btn-wheat" onClick={submit}>
              <Send size={16} /> {t('wizard.submit')}
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Landmark, SearchX, SlidersHorizontal, Sprout } from 'lucide-react';
import { DOMAINS, type ContractType, type Domain, type Governorate } from '../types';
import { useI18n } from '../i18n';
import { useStore } from '../store/useStore';
import { PUBLIC_STATUSES, estReturnPct, progressPct } from '../store/selectors';
import { ProjectCard } from '../components/ProjectCard';
import { EmptyState, PageHeader } from '../components/ui';

type Sort = 'newest' | 'progress' | 'return' | 'min';

export default function Catalog() {
  const { t } = useI18n();
  const db = useStore();
  const [params] = useSearchParams();
  const [domain, setDomain] = useState<Domain | ''>('');
  const [gov, setGov] = useState<Governorate | ''>('');
  const [contract, setContract] = useState<ContractType | ''>('');
  const [openOnly, setOpenOnly] = useState(false);
  const [withState, setWithState] = useState(params.get('state') === '1');
  const [sort, setSort] = useState<Sort>('newest');

  const base = db.projects.filter((p) => PUBLIC_STATUSES.includes(p.status));
  const govs = Array.from(new Set(base.map((p) => p.land.governorate)));

  const list = useMemo(() => {
    const filtered = base.filter(
      (p) =>
        (!domain || p.domain === domain) &&
        (!gov || p.land.governorate === gov) &&
        (!contract || p.contractType === contract) &&
        (!openOnly || p.status === 'funding') &&
        (!withState || p.land.owner === 'state'),
    );
    const sorters: Record<Sort, (a: (typeof base)[number], b: (typeof base)[number]) => number> = {
      newest: (a, b) => Number(b.status === 'funding') - Number(a.status === 'funding') || b.createdAt.localeCompare(a.createdAt),
      progress: (a, b) => progressPct(db, b) - progressPct(db, a),
      return: (a, b) => estReturnPct(b) - estReturnPct(a),
      min: (a, b) => a.minInvestment - b.minInvestment,
    };
    return filtered.sort(sorters[sort]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, domain, gov, contract, openOnly, withState, sort]);

  const reset = () => {
    setDomain('');
    setGov('');
    setContract('');
    setOpenOnly(false);
    setWithState(false);
  };

  return (
    <div className="container-app py-8">
      <PageHeader title={t('catalog.title')} subtitle={t('catalog.subtitle')} icon={<Sprout size={24} />} />

      <div className="card mb-6 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-soft">
          <SlidersHorizontal size={16} /> {t('catalog.results', { n: list.length })}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <select className="input" value={domain} onChange={(e) => setDomain(e.target.value as Domain | '')} aria-label={t('catalog.domain')}>
            <option value="">{t('catalog.domain')} · {t('common.all')}</option>
            {DOMAINS.map((d) => (
              <option key={d} value={d}>
                {t(`domains.${d}`)}
              </option>
            ))}
          </select>
          <select className="input" value={gov} onChange={(e) => setGov(e.target.value as Governorate | '')} aria-label={t('catalog.governorate')}>
            <option value="">{t('catalog.governorate')} · {t('common.all')}</option>
            {govs.map((g) => (
              <option key={g} value={g}>
                {t(`gov.${g}`)}
              </option>
            ))}
          </select>
          <select className="input" value={contract} onChange={(e) => setContract(e.target.value as ContractType | '')} aria-label={t('catalog.contract')}>
            <option value="">{t('catalog.contract')} · {t('common.all')}</option>
            <option value="profit_share">{t('contract.profit_share')}</option>
            <option value="presale">{t('contract.presale')}</option>
          </select>
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label={t('catalog.sort')}>
            <option value="newest">{t('catalog.sort')} : {t('catalog.sortNewest')}</option>
            <option value="progress">{t('catalog.sort')} : {t('catalog.sortProgress')}</option>
            <option value="return">{t('catalog.sort')} : {t('catalog.sortReturn')}</option>
            <option value="min">{t('catalog.sort')} : {t('catalog.sortMin')}</option>
          </select>
          <button
            type="button"
            onClick={() => setOpenOnly((v) => !v)}
            className={`btn border ${openOnly ? 'border-primary bg-primary text-white' : 'border-ink/15 bg-white text-ink-soft'}`}
          >
            <Sprout size={16} /> {t('catalog.openOnly')}
          </button>
          <button
            type="button"
            onClick={() => setWithState((v) => !v)}
            className={`btn border ${withState ? 'border-wheat bg-wheat text-ink' : 'border-ink/15 bg-white text-ink-soft'}`}
          >
            <Landmark size={16} /> {t('catalog.withState')}
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<SearchX size={36} />}
          text={t('catalog.empty')}
          action={
            <button className="btn-secondary btn-sm" onClick={reset}>
              {t('catalog.reset')}
            </button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}

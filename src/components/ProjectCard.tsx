import { Link } from 'react-router-dom';
import { Clock, MapPin, TrendingUp, Wallet } from 'lucide-react';
import type { Project } from '../types';
import { useI18n } from '../i18n';
import { useStore } from '../store/useStore';
import { estReturnPct, investorsCount, progressPct, raised } from '../store/selectors';
import { DomainIcon, Img, ProgressBar, ProjectStatusBadge, StateLandBadge } from './visuals';
import { Badge } from './ui';

export function ProjectCard({ project }: { project: Project }) {
  const { t, tr, money, pct } = useI18n();
  const db = useStore();
  const progress = progressPct(db, project);
  const collected = raised(db, project.id);
  const isState = project.land.owner === 'state';

  return (
    <Link
      to={`/projects/${project.id}`}
      className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Img src={project.photos[0]} alt={tr(project.title)} domain={project.domain} className="h-full w-full transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-2">
          <Badge tone="dark" icon={<DomainIcon domain={project.domain} size={13} />}>
            {t(`domains.${project.domain}`)}
          </Badge>
          {isState && <StateLandBadge compact />}
        </div>
        <div className="absolute bottom-3 start-3">
          <ProjectStatusBadge status={project.status} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-2 text-base font-bold leading-snug group-hover:text-primary">{tr(project.title)}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
            <MapPin size={13} /> {project.land.place} · {t(`gov.${project.land.governorate}`)}
          </p>
        </div>
        <div>
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="font-bold text-primary">{money(collected)}</span>
            <span className="text-xs font-semibold text-ink-muted">{t('card.funded', { pct: pct(progress) })}</span>
          </div>
          <ProgressBar value={progress} tone={progress >= 100 ? 'olive' : 'primary'} />
          <div className="mt-1 flex justify-between text-xs text-ink-muted">
            <span>{t('common.investorsN', { n: investorsCount(db, project.id) })}</span>
            <span>{t('admin.goalShort', { amount: money(project.goal) })}</span>
          </div>
        </div>
        <div className="mt-auto grid grid-cols-3 gap-2 border-t border-ink/5 pt-3 text-center">
          <div>
            <Wallet size={15} className="mx-auto mb-0.5 text-ink-muted" />
            <div className="text-[11px] text-ink-muted">{t('card.min')}</div>
            <div className="text-xs font-bold">{money(project.minInvestment)}</div>
          </div>
          <div>
            <Clock size={15} className="mx-auto mb-0.5 text-ink-muted" />
            <div className="text-[11px] text-ink-muted">{t('card.duration')}</div>
            <div className="text-xs font-bold">{t('common.months', { n: project.durationMonths })}</div>
          </div>
          <div>
            <TrendingUp size={15} className="mx-auto mb-0.5 text-wheat-dark" />
            <div className="text-[11px] text-ink-muted">{t('card.estReturn')}</div>
            <div className="text-xs font-bold text-wheat-dark">{pct(estReturnPct(project), 1)}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

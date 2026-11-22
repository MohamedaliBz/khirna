import { useState, type ReactNode } from 'react';
import { Carrot, Cherry, Egg, Hexagon, Milk, PawPrint, Sprout, TreeDeciduous, TreePalm, Wheat, Landmark, ShieldAlert } from 'lucide-react';
import type { Domain, MilestoneStatus, OfferStatus, ProjectStatus, ApplicationStatus, VisitStatus, Split } from '../types';
import { useI18n } from '../i18n';
import { Badge, type Tone } from './ui';

// ───────────── Icônes de domaine ─────────────
const DOMAIN_ICONS: Record<Domain, typeof Sprout> = {
  olives: TreeDeciduous,
  dairy: Milk,
  poultry: Egg,
  sheep: PawPrint,
  strawberries: Cherry,
  vegetables: Carrot,
  beekeeping: Hexagon,
  fodder: Wheat,
  dates: TreePalm,
};

export function DomainIcon({ domain, size = 16 }: { domain: Domain; size?: number }) {
  const Icon = DOMAIN_ICONS[domain] ?? Sprout;
  return <Icon size={size} />;
}

// ───────────── Image avec repli (jamais d'image cassée en démo) ─────────────
export function Img({ src, alt, className = '', domain }: { src?: string; alt: string; className?: string; domain?: Domain }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-primary to-olive text-white/80 ${className}`} aria-label={alt}>
        {domain ? <DomainIcon domain={domain} size={40} /> : <Sprout size={40} />}
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" className={`object-cover ${className}`} onError={() => setFailed(true)} />;
}

export function Avatar({ src, name, size = 40, icon }: { src?: string; name: string; size?: number; icon?: ReactNode }) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  const style = { width: size, height: size, fontSize: size * 0.38 };
  if (src && !failed) {
    return <img src={src} alt={name} style={style} className="shrink-0 rounded-full object-cover ring-2 ring-white" onError={() => setFailed(true)} />;
  }
  return (
    <div style={style} className="flex shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white ring-2 ring-white">
      {icon ?? initials}
    </div>
  );
}

// ───────────── Barre de progression ─────────────
export function ProgressBar({ value, tone = 'primary', size = 'md' }: { value: number; tone?: 'primary' | 'wheat' | 'olive'; size?: 'sm' | 'md' }) {
  const color = tone === 'wheat' ? 'bg-wheat' : tone === 'olive' ? 'bg-olive' : 'bg-primary';
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={`w-full overflow-hidden rounded-full bg-ink/10 ${size === 'sm' ? 'h-1.5' : 'h-2.5'}`} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${v}%` }} />
    </div>
  );
}

// ───────────── Carte de statistique ─────────────
export function StatCard({ icon, label, value, tone = 'green', sub }: { icon: ReactNode; label: string; value: string; tone?: Tone; sub?: string }) {
  const tones: Record<string, string> = {
    green: 'bg-primary-50 text-primary',
    wheat: 'bg-wheat-50 text-wheat-dark',
    olive: 'bg-olive-50 text-olive',
    gray: 'bg-ink/5 text-ink-soft',
    blue: 'bg-sky-50 text-sky-700',
    red: 'bg-red-50 text-red-700',
    dark: 'bg-ink text-white',
  };
  return (
    <div className="card flex items-start gap-3 p-4">
      <div className={`rounded-xl p-2.5 ${tones[tone]}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-ink-muted">{label}</div>
        <div className="truncate text-lg font-extrabold sm:text-xl">{value}</div>
        {sub && <div className="text-xs text-ink-muted">{sub}</div>}
      </div>
    </div>
  );
}

// ───────────── Anneau de répartition (SVG) ─────────────
export const SPLIT_COLORS: Record<keyof Split, string> = {
  farmer: '#1F5D3A',
  investors: '#D4A537',
  platform: '#6B8E23',
  reserve: '#A9B4AD',
};

export function SplitDonut({ split, size = 160 }: { split: Split; size?: number }) {
  const { t, pct } = useI18n();
  const keys: (keyof Split)[] = ['farmer', 'investors', 'platform', 'reserve'];
  let offset = 25; // départ en haut
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <svg width={size} height={size} viewBox="0 0 42 42" className="shrink-0" role="img" aria-label={keys.map((k) => `${t(`split.${k}`)} ${split[k]}%`).join(', ')}>
        <circle cx="21" cy="21" r="15.915" fill="none" stroke="#EEE9DC" strokeWidth="6" />
        {keys.map((k) => {
          const value = split[k];
          const el = (
            <circle
              key={k}
              cx="21"
              cy="21"
              r="15.915"
              fill="none"
              stroke={SPLIT_COLORS[k]}
              strokeWidth="6"
              strokeDasharray={`${value} ${100 - value}`}
              strokeDashoffset={offset}
            />
          );
          offset -= value;
          return el;
        })}
        <text x="21" y="20.5" textAnchor="middle" className="fill-ink" style={{ fontSize: 6, fontWeight: 800 }}>
          {split.investors}%
        </text>
        <text x="21" y="26" textAnchor="middle" className="fill-ink-muted" style={{ fontSize: 2.6, fontWeight: 600 }}>
          {t('split.investors')}
        </text>
      </svg>
      <ul className="w-full space-y-2 text-sm">
        {keys.map((k) => (
          <li key={k} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: SPLIT_COLORS[k] }} />
              {t(`split.${k}`)}
            </span>
            <span className="font-bold">{pct(split[k])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ───────────── Badges de statut ─────────────
const PROJECT_TONES: Record<ProjectStatus, Tone> = {
  draft: 'gray', submitted: 'blue', needs_changes: 'wheat', funding: 'green', funded: 'olive',
  in_progress: 'olive', harvest: 'wheat', distributed: 'green', closed: 'gray', rejected: 'red',
};
export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const { t } = useI18n();
  return <Badge tone={PROJECT_TONES[status]}>{t(`projectStatus.${status}`)}</Badge>;
}

const MILESTONE_TONES: Record<MilestoneStatus, Tone> = { upcoming: 'gray', proof_submitted: 'blue', validated: 'green', rejected: 'red' };
export function MilestoneBadge({ status }: { status: MilestoneStatus }) {
  const { t } = useI18n();
  return <Badge tone={MILESTONE_TONES[status]}>{t(`milestoneStatus.${status}`)}</Badge>;
}

const OFFER_TONES: Record<OfferStatus, Tone> = { open: 'green', reviewing: 'wheat', assigned: 'blue', in_use: 'olive' };
export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  const { t } = useI18n();
  return <Badge tone={OFFER_TONES[status]}>{t(`offerStatus.${status}`)}</Badge>;
}

const APP_TONES: Record<ApplicationStatus, Tone> = { sent: 'blue', accepted: 'green', rejected: 'red', waitlist: 'wheat' };
export function ApplicationBadge({ status }: { status: ApplicationStatus }) {
  const { t } = useI18n();
  return <Badge tone={APP_TONES[status]}>{t(`appStatus.${status}`)}</Badge>;
}

const VISIT_TONES: Record<VisitStatus, Tone> = { requested: 'blue', confirmed: 'green', refused: 'red', done: 'gray' };
export function VisitBadge({ status }: { status: VisitStatus }) {
  const { t } = useI18n();
  return <Badge tone={VISIT_TONES[status]}>{t(`visitStatus.${status}`)}</Badge>;
}

export function StateLandBadge({ until, compact }: { until?: string; compact?: boolean }) {
  const { t, date } = useI18n();
  return (
    <Badge tone="wheat" icon={<Landmark size={13} />}>
      {compact || !until ? t('common.stateOwned') : t('project.stateLandBadge', { date: date(until) })}
    </Badge>
  );
}

export function RiskBanner() {
  const { t } = useI18n();
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-wheat/40 bg-wheat-50 p-4 text-sm text-ink">
      <ShieldAlert className="mt-0.5 shrink-0 text-wheat-dark" size={20} />
      <p>{t('project.riskBanner')}</p>
    </div>
  );
}

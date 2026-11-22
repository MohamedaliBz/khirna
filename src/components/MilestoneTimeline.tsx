import { CheckCircle2, Circle, Clock3, XCircle } from 'lucide-react';
import type { Milestone, Update } from '../types';
import { useI18n } from '../i18n';
import { Img, MilestoneBadge } from './visuals';

const ICONS = {
  validated: <CheckCircle2 size={22} className="text-primary" />,
  proof_submitted: <Clock3 size={22} className="text-sky-600" />,
  rejected: <XCircle size={22} className="text-red-600" />,
  upcoming: <Circle size={22} className="text-ink/25" />,
};

export function MilestoneTimeline({ milestones, updates = [] }: { milestones: Milestone[]; updates?: Update[] }) {
  const { t, tr, money, date } = useI18n();
  return (
    <ol className="relative">
      {milestones.map((m, i) => {
        const proof = m.proofUpdateId ? updates.find((u) => u.id === m.proofUpdateId) : undefined;
        const last = i === milestones.length - 1;
        return (
          <li key={m.id} className="relative flex gap-3 pb-5">
            {!last && <span className={`absolute start-[10px] top-7 h-[calc(100%-1.5rem)] w-0.5 ${m.status === 'validated' ? 'bg-primary/50' : 'bg-ink/10'}`} />}
            <div className="relative z-10 shrink-0 bg-white">{ICONS[m.status]}</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">
                  {i + 1}. {tr(m.title)}
                </p>
                <MilestoneBadge status={m.status} />
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                <span>
                  {t('project.tranche')} : <b className="text-ink">{money(m.tranche)}</b>
                </span>
                <span>
                  {t('project.due')} : {date(m.validatedAt ?? m.dueDate)}
                </span>
              </div>
              {m.rejectionReason && m.status === 'rejected' && <p className="mt-1 text-xs text-red-700">{m.rejectionReason}</p>}
              {proof && (
                <div className="mt-2 flex items-start gap-3 rounded-xl bg-cream p-2">
                  {proof.photo && <Img src={proof.photo} alt={tr(proof.text)} className="h-14 w-20 shrink-0 rounded-lg" />}
                  <div className="min-w-0 text-xs">
                    <p className="line-clamp-2 text-ink-soft">{tr(proof.text)}</p>
                    <p className="mt-0.5 text-ink-muted">{date(proof.date)}</p>
                  </div>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

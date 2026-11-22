import { Link } from 'react-router-dom';
import { Camera, Newspaper, Receipt } from 'lucide-react';
import type { Update } from '../types';
import { useI18n } from '../i18n';
import { useStore } from '../store/useStore';
import { getProject, getUser } from '../store/selectors';
import { Avatar, Img } from './visuals';
import { Badge, EmptyState } from './ui';

const KIND_ICON = { news: <Newspaper size={13} />, expense: <Receipt size={13} />, milestone_proof: <Camera size={13} /> };
const KIND_TONE = { news: 'gray', expense: 'wheat', milestone_proof: 'green' } as const;

export function UpdateFeed({ updates, showProject = false, limit }: { updates: Update[]; showProject?: boolean; limit?: number }) {
  const { t, tr, money, dateTime } = useI18n();
  const db = useStore();
  const list = [...updates].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit ?? updates.length);
  if (!list.length) return <EmptyState icon={<Newspaper size={32} />} text={t('project.noNews')} />;
  return (
    <ul className="space-y-4">
      {list.map((u) => {
        const author = getUser(db, u.authorId);
        const project = getProject(db, u.projectId);
        const milestone = u.milestoneId ? project?.milestones.find((m) => m.id === u.milestoneId) : undefined;
        return (
          <li key={u.id} className="flex gap-3">
            <Avatar src={author?.avatar} name={author?.name ?? '?'} size={36} />
            <div className="min-w-0 flex-1 rounded-2xl bg-cream/70 p-3">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                <b className="text-ink">{author?.name}</b>
                <span className="text-ink-muted">{dateTime(u.date)}</span>
                <Badge tone={KIND_TONE[u.kind]} icon={KIND_ICON[u.kind]}>
                  {t(`updateKind.${u.kind}`)}
                </Badge>
              </div>
              {showProject && project && (
                <Link to={`/projects/${project.id}`} className="mb-1 block text-xs font-semibold text-primary hover:underline">
                  {tr(project.title)}
                </Link>
              )}
              {milestone && <p className="mb-1 text-xs font-semibold text-primary">✓ {tr(milestone.title)}</p>}
              <p className="text-sm text-ink-soft">{tr(u.text)}</p>
              {u.kind === 'expense' && u.amount !== undefined && <p className="mt-1 text-sm font-bold text-wheat-dark">{money(u.amount)}</p>}
              {u.photo && <Img src={u.photo} alt={tr(u.text)} className="mt-2 aspect-[16/9] w-full max-w-md rounded-xl" />}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
